using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using grad_project.Server.Data;
using grad_project.Server.DTOs;
using grad_project.Server.Services;

namespace grad_project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MockInterviewController : ControllerBase
{
    private const string AgentApiKeyHeader = "X-Agent-Api-Key";

    /// <summary>Cap on the report length (UTF-16 char count) accepted by <see cref="SaveReport"/>.</summary>
    /// <remarks>
    /// 200K chars comfortably fits a multi-section markdown report (~50 pages of
    /// text) while preventing a leaked api key from being used to flood the DB.
    /// Note: this is char count, not byte count. <see cref="RequestSizeLimitAttribute"/>
    /// below caps the raw HTTP body at the same number plus a small header budget,
    /// using bytes — that's the binding limit in practice for non-ASCII payloads.
    /// </remarks>
    private const int MaxReportLengthChars = 200 * 1024;

    private readonly PathGuideContext _context;
    private readonly ILiveKitTokenService _tokenService;
    private readonly ICvFileStore _cvFileStore;
    private readonly ICvTextExtractor _cvTextExtractor;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MockInterviewController> _logger;

    public MockInterviewController(
        PathGuideContext context,
        ILiveKitTokenService tokenService,
        ICvFileStore cvFileStore,
        ICvTextExtractor cvTextExtractor,
        IConfiguration configuration,
        ILogger<MockInterviewController> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _cvFileStore = cvFileStore;
        _cvTextExtractor = cvTextExtractor;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Issues a LiveKit access token for the candidate's mock-interview session.
    /// When <paramref name="request"/>.ApplicationId is supplied, the caller must
    /// own the application and it must be in <c>pending</c> status; the id is
    /// then forwarded to the Python agent via room metadata so the post-interview
    /// report can be saved against that application.
    /// </summary>
    [HttpPost("token")]
    [Authorize(Roles = "student")]
    public async Task<ActionResult<MockInterviewTokenResponseDto>> IssueToken(
        [FromBody] MockInterviewTokenRequestDto? request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
            {
                _logger.LogWarning("Mock interview token requested without a valid user id claim.");
                return Unauthorized(new { message = "Invalid user." });
            }

            _logger.LogInformation(
                "Mock interview token requested. UserId={UserId} ApplicationId={ApplicationId}",
                userId, request?.ApplicationId);

            var user = await _context.Users
                .Where(u => u.UserId == userId)
                .Select(u => new { u.Name, ProfileId = (int?)u.StudentProfile!.StudentProfileId })
                .FirstOrDefaultAsync();
            if (user is null)
            {
                _logger.LogWarning("Mock interview token requested for UserId={UserId} but no matching User row was found.", userId);
                return Unauthorized(new { message = "Invalid user." });
            }
            var displayName = user.Name ?? "Candidate";

            int? applicationId = null;
            if (request?.ApplicationId is int reqApp)
            {
                // Verify the caller actually owns this application and it's
                // still pending — otherwise we'd let any student write a
                // report into someone else's row, or onto a finished one.
                var application = await _context.InternshipApplications
                    .Where(a => a.ApplicationId == reqApp)
                    .Select(a => new { a.StudentId, a.Status })
                    .FirstOrDefaultAsync();
                if (application is null)
                {
                    return NotFound(new { message = "Application not found." });
                }
                if (application.StudentId != user.ProfileId)
                {
                    _logger.LogWarning(
                        "User {UserId} tried to start a mock interview for application {ApplicationId} they don't own.",
                        userId, reqApp);
                    return Forbid();
                }
                if (!string.Equals(application.Status, "pending", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        message = "Mock interview is only available while the application is pending.",
                    });
                }
                applicationId = reqApp;
            }

            var token = _tokenService.IssueParticipantToken(userId, displayName, applicationId);

            _logger.LogInformation(
                "Mock interview token issued. UserId={UserId} Room={Room} ApplicationId={ApplicationId} ExpiresAt={ExpiresAt:O}",
                userId, token.Room, applicationId, token.ExpiresAt);

            return Ok(new MockInterviewTokenResponseDto
            {
                Token = token.Token,
                Url = token.Url,
                Room = token.Room,
                Identity = token.Identity,
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "LiveKit token service is not configured");
            return StatusCode(500, new { message = "Mock interview service is not configured." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error issuing LiveKit token");
            return StatusCode(500, new { message = "Failed to start mock interview." });
        }
    }

    /// <summary>
    /// Server-to-server: the Python interview agent posts the final markdown
    /// report here when an interview ends. Authenticated by a shared API key
    /// header (<c>MockInterview:AgentApiKey</c> in configuration), not the
    /// student JWT — the agent runs out-of-band of any user session.
    ///
    /// A student may retake the mock interview as many times as they want;
    /// each post overwrites the previous report so only the latest one is kept.
    /// The endpoint only refuses to write once the application is
    /// <c>completed</c>, after which the report is frozen.
    /// </summary>
    [HttpPost("report")]
    [AllowAnonymous]
    [RequestSizeLimit(MaxReportLengthChars + 4096)]
    public async Task<IActionResult> SaveReport([FromBody] MockInterviewReportRequestDto request)
    {
        var keyError = ValidateAgentKey();
        if (keyError is not null)
        {
            return keyError;
        }

        if (request is null || request.ApplicationId <= 0 || string.IsNullOrWhiteSpace(request.Report))
        {
            return BadRequest(new { message = "applicationId and report are required." });
        }

        if (request.Report.Length > MaxReportLengthChars)
        {
            _logger.LogWarning(
                "Mock interview report rejected for ApplicationId={ApplicationId}: payload too large ({Length} chars > {Max}).",
                request.ApplicationId, request.Report.Length, MaxReportLengthChars);
            return StatusCode(StatusCodes.Status413PayloadTooLarge,
                new { message = "Report exceeds the maximum allowed size." });
        }

        try
        {
            var application = await _context.InternshipApplications
                .FirstOrDefaultAsync(a => a.ApplicationId == request.ApplicationId);
            if (application is null)
            {
                return NotFound(new { message = "Application not found." });
            }

            if (string.Equals(application.Status, "completed", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning(
                    "Refusing report write for ApplicationId={ApplicationId}: status is completed.",
                    request.ApplicationId);
                return Conflict(new { message = "Report cannot be saved once the application is completed." });
            }

            // A student may retake the mock interview any number of times; we
            // keep only the latest report, so each save overwrites the previous
            // value (last write wins).
            application.MockInterviewReport = request.Report;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Mock interview report saved. ApplicationId={ApplicationId} Length={Length}",
                request.ApplicationId, request.Report.Length);

            return Ok(new { message = "Report saved." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving mock interview report for ApplicationId={ApplicationId}", request.ApplicationId);
            return StatusCode(500, new { message = "Failed to save report." });
        }
    }

    /// <summary>
    /// Server-to-server: the Python interview agent fetches the candidate's
    /// interview context at session start so it can tailor the interview to the
    /// real internship and the candidate's CV. Authenticated by the same shared
    /// agent api key as <see cref="SaveReport"/> (the agent already holds it),
    /// not the student JWT.
    ///
    /// Returns the candidate name, the internship title and company, and the
    /// plain text extracted from the uploaded CV. <c>cvText</c> is an empty
    /// string when the candidate has no locally-stored CV (no CV on file, or a
    /// legacy external link) — the agent then falls back to a generic interview.
    /// The CV text itself is never logged (only its length), per candidate-data
    /// protection.
    /// </summary>
    [HttpGet("context")]
    [AllowAnonymous]
    public async Task<IActionResult> GetContext([FromQuery] int applicationId)
    {
        var keyError = ValidateAgentKey();
        if (keyError is not null)
        {
            return keyError;
        }

        if (applicationId <= 0)
        {
            return BadRequest(new { message = "applicationId is required." });
        }

        try
        {
            var application = await _context.InternshipApplications
                .Where(a => a.ApplicationId == applicationId)
                .Select(a => new
                {
                    CandidateName = a.StudentProfile.User.Name,
                    Position = a.Internship.Title,
                    CompanyName = a.Internship.RecruiterProfile.CompanyName,
                    a.StudentProfile.CvUrl,
                    University = a.StudentProfile.University!.UniversityName,
                    Major = a.StudentProfile.Major!.MajorName,
                    a.StudentProfile.Gpa,
                    a.StudentProfile.GraduationYear,
                    CareerPath = a.StudentProfile.CareerPath!.CareerPathName,
                    a.StudentProfile.LinkedinUrl,
                    a.StudentProfile.GithubUrl,
                    a.StudentProfile.Bio,
                    Skills = a.StudentProfile.StudentSkills
                        .Where(ss => ss.Skill != null)
                        .Select(ss => ss.Skill!.SkillName)
                        .ToList(),
                    Interests = a.StudentProfile.StudentInterests
                        .Select(si => si.Interest.InterestName)
                        .ToList(),
                })
                .FirstOrDefaultAsync();

            if (application is null)
            {
                return NotFound(new { message = "Application not found." });
            }

            // Primary source: accumulate the structured profile (always in the DB).
            var profileSummary = BuildProfileSummary(
                application.University, application.Major, application.Gpa, application.GraduationYear,
                application.CareerPath, application.Skills, application.Interests,
                application.LinkedinUrl, application.GithubUrl, application.Bio);

            // Secondary bonus: text from the uploaded CV file, when one exists locally.
            var cvText = ExtractCvText(application.CvUrl);

            _logger.LogInformation(
                "Mock interview context served. ApplicationId={ApplicationId} ProfileChars={ProfileChars} HasCv={HasCv} CvChars={CvChars}",
                applicationId, profileSummary.Length, cvText.Length > 0, cvText.Length);

            return Ok(new MockInterviewContextResponseDto
            {
                CandidateName = string.IsNullOrWhiteSpace(application.CandidateName) ? "Candidate" : application.CandidateName,
                Position = application.Position ?? string.Empty,
                CompanyName = application.CompanyName ?? string.Empty,
                ProfileSummary = profileSummary,
                CvText = cvText,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error building mock interview context for ApplicationId={ApplicationId}", applicationId);
            return StatusCode(500, new { message = "Failed to load interview context." });
        }
    }

    /// <summary>
    /// Accumulates the candidate's structured PathGuide profile into a readable,
    /// labelled block for the interview agent. Only fields that are actually
    /// present are included, so a sparse profile yields a short summary (or an
    /// empty string when nothing is on file). This is the primary source of
    /// candidate background — it comes straight from the database and never
    /// depends on an uploaded file.
    /// </summary>
    private static string BuildProfileSummary(
        string? university,
        string? major,
        decimal? gpa,
        int? graduationYear,
        string? careerPath,
        IEnumerable<string?> skills,
        IEnumerable<string?> interests,
        string? linkedinUrl,
        string? githubUrl,
        string? bio)
    {
        var lines = new List<string>();

        void Add(string label, string? value)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                lines.Add($"{label}: {value.Trim()}");
            }
        }

        Add("University", university);
        Add("Major", major);
        if (gpa.HasValue)
        {
            lines.Add($"GPA: {gpa.Value:0.00}");
        }
        if (graduationYear.HasValue)
        {
            lines.Add($"Expected graduation year: {graduationYear.Value}");
        }
        Add("Target career path", careerPath);

        var realSkills = skills.Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
        if (realSkills.Count > 0)
        {
            lines.Add($"Skills: {string.Join(", ", realSkills)}");
        }

        var realInterests = interests.Where(i => !string.IsNullOrWhiteSpace(i)).ToList();
        if (realInterests.Count > 0)
        {
            lines.Add($"Interests: {string.Join(", ", realInterests)}");
        }

        Add("LinkedIn", linkedinUrl);
        Add("GitHub", githubUrl);
        Add("Bio", bio);

        return string.Join("\n", lines);
    }

    /// <summary>
    /// Extracts plain text from the candidate's stored CV. Returns an empty
    /// string for the cases the agent treats as "no CV": no path on file, a
    /// legacy external URL (not a local file we can read), a missing file, or an
    /// extraction failure. Never throws.
    /// </summary>
    private string ExtractCvText(string? cvUrl)
    {
        if (string.IsNullOrEmpty(cvUrl) || CvFiles.IsExternalUrl(cvUrl) || !_cvFileStore.Exists(cvUrl))
        {
            return string.Empty;
        }

        try
        {
            var extension = Path.GetExtension(cvUrl).ToLowerInvariant();
            using var stream = _cvFileStore.OpenRead(cvUrl);
            return _cvTextExtractor.ExtractText(stream, extension) ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to extract CV text for the mock interview context.");
            return string.Empty;
        }
    }

    /// <summary>
    /// Validates the shared agent api key on the <c>X-Agent-Api-Key</c> header
    /// against <c>MockInterview:AgentApiKey</c>. Returns <c>null</c> when the key
    /// is valid, or the error <see cref="IActionResult"/> to return otherwise
    /// (500 when the key is not configured, 401 when missing/invalid). Shared by
    /// <see cref="SaveReport"/> and <see cref="GetContext"/>.
    /// </summary>
    private IActionResult? ValidateAgentKey()
    {
        var configuredKey = _configuration["MockInterview:AgentApiKey"];
        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            _logger.LogError("MockInterview:AgentApiKey is not configured; rejecting request.");
            return StatusCode(500, new { message = "Endpoint is not configured." });
        }

        var providedKey = Request.Headers[AgentApiKeyHeader].ToString();
        if (string.IsNullOrEmpty(providedKey) || !FixedTimeEquals(providedKey, configuredKey))
        {
            _logger.LogWarning(
                "Mock interview request rejected: invalid or missing {Header}.",
                AgentApiKeyHeader);
            return Unauthorized(new { message = "Invalid agent api key." });
        }

        return null;
    }

    /// <summary>
    /// Constant-time string comparison via <see cref="CryptographicOperations.FixedTimeEquals(ReadOnlySpan{byte}, ReadOnlySpan{byte})"/>.
    /// Avoids leaking the configured api key length and content via timing.
    /// </summary>
    private static bool FixedTimeEquals(string a, string b)
    {
        var ba = Encoding.UTF8.GetBytes(a);
        var bb = Encoding.UTF8.GetBytes(b);
        return ba.Length == bb.Length && CryptographicOperations.FixedTimeEquals(ba, bb);
    }
}
