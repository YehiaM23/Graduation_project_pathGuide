using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using grad_project.Server.Data;
using grad_project.Server.DTOs;
using grad_project.Server.Models;
using grad_project.Server.Services;

namespace grad_project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ApplicationsController : ControllerBase
{
    private readonly PathGuideContext _context;
    private readonly ILogger<ApplicationsController> _logger;
    private readonly IEmailService _emailService;
    private readonly ICvFileStore _cvFileStore;

    public ApplicationsController(
        PathGuideContext context,
        ILogger<ApplicationsController> logger,
        IEmailService emailService,
        ICvFileStore cvFileStore)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
        _cvFileStore = cvFileStore;
    }

    // GET: api/applications/student - Get applications for current student
    [HttpGet("student")]
    public async Task<ActionResult<List<InternshipApplicationDto>>> GetStudentApplications()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var studentProfile = await _context.StudentProfiles
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (studentProfile == null)
            {
                return NotFound(new { message = "Student profile not found" });
            }

            // Direct EF projection (no Include + memory map). Keeps the
            // NVARCHAR(MAX) MockInterviewReport column out of the result set
            // — the student UI only needs the boolean flag.
            var applications = await _context.InternshipApplications
                .Where(a => a.StudentId == studentProfile.StudentProfileId)
                .OrderByDescending(a => a.AppliedAt)
                .Select(a => new InternshipApplicationDto
                {
                    ApplicationId = a.ApplicationId,
                    InternshipId = a.InternshipId,
                    InternshipTitle = a.Internship.Title,
                    CompanyName = a.Internship.RecruiterProfile.CompanyName,
                    StudentId = a.StudentId,
                    Status = a.Status,
                    AppliedAt = a.AppliedAt,
                    ReviewedAt = a.ReviewedAt,
                    ReviewerNotes = a.ReviewerNotes,
                    PerformanceRating = a.PerformanceRating,
                    PerformanceComment = a.PerformanceComment,
                    CertificateUrl = a.CertificateUrl,
                    CompletedAt = a.CompletedAt,
                    HasMockInterviewReport = a.MockInterviewReport != null && a.MockInterviewReport != "",
                    MockInterviewReportShared = a.MockInterviewReportSharedWithRecruiter,
                })
                .ToListAsync();

            return Ok(applications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting student applications");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // GET: api/applications/recruiter - Get all applications for recruiter's internships
    [HttpGet("recruiter")]
    public async Task<ActionResult<List<InternshipApplicationDto>>> GetRecruiterApplications()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var recruiterProfile = await _context.RecruiterProfiles
                .FirstOrDefaultAsync(rp => rp.UserId == userId);

            if (recruiterProfile == null)
            {
                return BadRequest(new { message = "Only recruiters can view applications" });
            }

            // Direct EF projection (no Include + memory map). This avoids
            // pulling the NVARCHAR(MAX) MockInterviewReport column from SQL —
            // we only need a boolean indicator on the list view.
            var applications = await _context.InternshipApplications
                .Where(a => a.Internship.RecruiterProfileId == recruiterProfile.RecruiterProfileId)
                .OrderByDescending(a => a.AppliedAt)
                .Select(a => new InternshipApplicationDto
                {
                    ApplicationId = a.ApplicationId,
                    InternshipId = a.InternshipId,
                    InternshipTitle = a.Internship.Title,
                    CompanyName = a.Internship.RecruiterProfile.CompanyName,
                    StudentId = a.StudentId,
                    StudentName = a.StudentProfile.User.Name,
                    StudentEmail = a.StudentProfile.User.Email,
                    Status = a.Status,
                    AppliedAt = a.AppliedAt,
                    ReviewedAt = a.ReviewedAt,
                    ReviewerNotes = a.ReviewerNotes,
                    PerformanceRating = a.PerformanceRating,
                    PerformanceComment = a.PerformanceComment,
                    CertificateUrl = a.CertificateUrl,
                    CompletedAt = a.CompletedAt,
                    UniversityName = a.StudentProfile.University != null ? a.StudentProfile.University.UniversityName : null,
                    MajorName = a.StudentProfile.Major != null ? a.StudentProfile.Major.MajorName : null,
                    Gpa = a.StudentProfile.Gpa,
                    GraduationYear = a.StudentProfile.GraduationYear,
                    HasCv = a.StudentProfile.CvUrl != null && a.StudentProfile.CvUrl != "",
                    LinkedinUrl = a.StudentProfile.LinkedinUrl,
                    GithubUrl = a.StudentProfile.GithubUrl,
                    StudentSkills = a.StudentProfile.StudentSkills
                        .Where(ss => ss.Skill != null)
                        .Select(ss => new SkillDto
                        {
                            SkillId = ss.Skill!.SkillId,
                            SkillName = ss.Skill.SkillName,
                            Category = ss.Skill.Category,
                        })
                        .ToList(),
                    // Recruiter only sees the report exists once the student shares it.
                    HasMockInterviewReport = a.MockInterviewReport != null && a.MockInterviewReport != ""
                        && a.MockInterviewReportSharedWithRecruiter,
                })
                .ToListAsync();

            return Ok(applications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recruiter applications");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // GET: api/applications/internship/{internshipId} - Get applications for an internship (recruiter only)
    [HttpGet("internship/{internshipId}")]
    public async Task<ActionResult<List<InternshipApplicationDto>>> GetInternshipApplications(int internshipId)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var recruiterProfile = await _context.RecruiterProfiles
                .FirstOrDefaultAsync(rp => rp.UserId == userId);

            if (recruiterProfile == null)
            {
                return BadRequest(new { message = "Only recruiters can view internship applications" });
            }

            // Verify the recruiter owns this internship
            var internship = await _context.Internships
                .FirstOrDefaultAsync(i => i.InternshipId == internshipId && i.RecruiterProfileId == recruiterProfile.RecruiterProfileId);

            if (internship == null)
            {
                return NotFound(new { message = "Internship not found or you don't have permission to view applications" });
            }

            // Direct EF projection (no Include + memory map). Keeps the
            // NVARCHAR(MAX) MockInterviewReport column out of the result set;
            // recruiters fetch the full report on demand from the dedicated
            // /api/applications/{id}/mock-interview-report endpoint.
            var applications = await _context.InternshipApplications
                .Where(a => a.InternshipId == internshipId)
                .OrderByDescending(a => a.AppliedAt)
                .Select(a => new InternshipApplicationDto
                {
                    ApplicationId = a.ApplicationId,
                    InternshipId = a.InternshipId,
                    InternshipTitle = internship.Title,
                    StudentId = a.StudentId,
                    StudentName = a.StudentProfile.User.Name,
                    StudentEmail = a.StudentProfile.User.Email,
                    Status = a.Status,
                    AppliedAt = a.AppliedAt,
                    ReviewedAt = a.ReviewedAt,
                    ReviewerNotes = a.ReviewerNotes,
                    PerformanceRating = a.PerformanceRating,
                    PerformanceComment = a.PerformanceComment,
                    CertificateUrl = a.CertificateUrl,
                    CompletedAt = a.CompletedAt,
                    UniversityName = a.StudentProfile.University != null ? a.StudentProfile.University.UniversityName : null,
                    MajorName = a.StudentProfile.Major != null ? a.StudentProfile.Major.MajorName : null,
                    Gpa = a.StudentProfile.Gpa,
                    GraduationYear = a.StudentProfile.GraduationYear,
                    HasCv = a.StudentProfile.CvUrl != null && a.StudentProfile.CvUrl != "",
                    LinkedinUrl = a.StudentProfile.LinkedinUrl,
                    GithubUrl = a.StudentProfile.GithubUrl,
                    StudentSkills = a.StudentProfile.StudentSkills
                        .Where(ss => ss.Skill != null)
                        .Select(ss => new SkillDto
                        {
                            SkillId = ss.Skill!.SkillId,
                            SkillName = ss.Skill.SkillName,
                            Category = ss.Skill.Category,
                        })
                        .ToList(),
                    // Recruiter only sees the report exists once the student shares it.
                    HasMockInterviewReport = a.MockInterviewReport != null && a.MockInterviewReport != ""
                        && a.MockInterviewReportSharedWithRecruiter,
                })
                .ToListAsync();

            return Ok(applications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting internship applications");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // GET: api/applications/{applicationId}/mock-interview-report - Recruiter
    // who owns the internship reads the candidate's mock interview report.
    [HttpGet("{applicationId}/mock-interview-report")]
    public async Task<ActionResult<MockInterviewReportResponseDto>> GetMockInterviewReport(int applicationId)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var recruiterProfile = await _context.RecruiterProfiles
                .FirstOrDefaultAsync(rp => rp.UserId == userId);
            if (recruiterProfile == null)
            {
                return Forbid();
            }

            // Single round-trip: verify ownership and pull the report in one go.
            var row = await _context.InternshipApplications
                .Where(a => a.ApplicationId == applicationId
                            && a.Internship.RecruiterProfileId == recruiterProfile.RecruiterProfileId)
                .Select(a => new
                {
                    a.ApplicationId,
                    a.MockInterviewReport,
                    a.MockInterviewReportSharedWithRecruiter,
                })
                .FirstOrDefaultAsync();

            if (row == null)
            {
                // Either the application doesn't exist or this recruiter doesn't
                // own its internship. Respond identically in both cases so
                // application existence isn't leaked to non-owners.
                return NotFound(new { message = "Application not found." });
            }

            // The report is private until the student shares it. Respond as if
            // there is no report so an unshared one isn't even revealed to exist.
            if (string.IsNullOrEmpty(row.MockInterviewReport) || !row.MockInterviewReportSharedWithRecruiter)
            {
                return NotFound(new { message = "No mock interview report available for this application." });
            }

            return Ok(new MockInterviewReportResponseDto
            {
                ApplicationId = row.ApplicationId,
                Report = row.MockInterviewReport,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching mock interview report for application {ApplicationId}", applicationId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // GET: api/applications/{applicationId}/my-mock-interview-report - the
    // student who owns the application reads their own mock interview report.
    [HttpGet("{applicationId}/my-mock-interview-report")]
    public async Task<ActionResult<MockInterviewReportResponseDto>> GetMyMockInterviewReport(int applicationId)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var studentProfile = await _context.StudentProfiles
                .FirstOrDefaultAsync(sp => sp.UserId == userId);
            if (studentProfile == null)
            {
                return Forbid();
            }

            // Single round-trip: verify ownership and pull the report in one go.
            var row = await _context.InternshipApplications
                .Where(a => a.ApplicationId == applicationId
                            && a.StudentId == studentProfile.StudentProfileId)
                .Select(a => new
                {
                    a.ApplicationId,
                    a.MockInterviewReport,
                })
                .FirstOrDefaultAsync();

            if (row == null)
            {
                // Either the application doesn't exist or it doesn't belong to
                // this student. Respond identically in both cases so
                // application existence isn't leaked to non-owners.
                return NotFound(new { message = "Application not found." });
            }

            if (string.IsNullOrEmpty(row.MockInterviewReport))
            {
                return NotFound(new { message = "No mock interview report available for this application." });
            }

            return Ok(new MockInterviewReportResponseDto
            {
                ApplicationId = row.ApplicationId,
                Report = row.MockInterviewReport,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching mock interview report for application {ApplicationId}", applicationId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // PUT: api/applications/{applicationId}/share-mock-interview-report - the
    // student who owns the application opts to share (or hide) their mock
    // interview report with the recruiter. The report stays private until this
    // is set to true.
    [HttpPut("{applicationId}/share-mock-interview-report")]
    public async Task<IActionResult> ShareMockInterviewReport(
        int applicationId,
        [FromBody] ShareMockInterviewReportDto request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var studentProfile = await _context.StudentProfiles
                .FirstOrDefaultAsync(sp => sp.UserId == userId);
            if (studentProfile == null)
            {
                return Forbid();
            }

            var application = await _context.InternshipApplications
                .FirstOrDefaultAsync(a => a.ApplicationId == applicationId
                                          && a.StudentId == studentProfile.StudentProfileId);
            if (application == null)
            {
                return NotFound(new { message = "Application not found." });
            }

            if (request.Shared && string.IsNullOrEmpty(application.MockInterviewReport))
            {
                return BadRequest(new { message = "There is no mock interview report to share." });
            }

            application.MockInterviewReportSharedWithRecruiter = request.Shared;
            await _context.SaveChangesAsync();

            return Ok(new { shared = application.MockInterviewReportSharedWithRecruiter });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating mock interview report sharing for application {ApplicationId}", applicationId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // GET: api/applications/{applicationId}/cv - The recruiter who owns the
    // internship (or an admin) downloads the applicant's CV.
    [HttpGet("{applicationId}/cv")]
    public async Task<ActionResult> DownloadApplicantCv(int applicationId)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var isAdmin = User.IsInRole("admin");

            int? recruiterProfileId = null;
            if (!isAdmin)
            {
                var recruiterProfile = await _context.RecruiterProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId);
                if (recruiterProfile == null)
                {
                    return Forbid();
                }
                recruiterProfileId = recruiterProfile.RecruiterProfileId;
            }

            // Single round-trip that also enforces ownership: a non-owning
            // recruiter and a non-existent application both yield null, so the
            // 404 below can't be used to probe which applications exist.
            var row = await _context.InternshipApplications
                .Where(a => a.ApplicationId == applicationId
                            && (isAdmin || a.Internship.RecruiterProfileId == recruiterProfileId))
                .Select(a => new
                {
                    a.StudentId,
                    a.StudentProfile.CvUrl,
                })
                .FirstOrDefaultAsync();

            if (row == null)
            {
                return NotFound(new { message = "Application not found." });
            }

            if (string.IsNullOrEmpty(row.CvUrl))
            {
                return NotFound(new { message = "No CV available." });
            }

            if (CvFiles.IsExternalUrl(row.CvUrl))
            {
                return Ok(new { type = "external", url = row.CvUrl });
            }

            if (!_cvFileStore.Exists(row.CvUrl))
            {
                return NotFound(new { message = "CV file not found." });
            }

            var extension = Path.GetExtension(row.CvUrl);
            var stream = _cvFileStore.OpenRead(row.CvUrl);
            return File(stream, CvFiles.ContentTypeForExtension(extension), $"cv-{row.StudentId}{extension}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading CV for application {ApplicationId}", applicationId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // POST: api/applications - Apply for an internship (student only)
    [HttpPost]
    public async Task<ActionResult<InternshipApplicationDto>> ApplyForInternship([FromBody] CreateApplicationDto dto)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var studentProfile = await _context.StudentProfiles
                .Include(sp => sp.User)
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (studentProfile == null)
            {
                return BadRequest(new { message = "Only students can apply for internships" });
            }

            // Check if internship exists and is active
            var internship = await _context.Internships
                .Include(i => i.RecruiterProfile)
                .FirstOrDefaultAsync(i => i.InternshipId == dto.InternshipId);

            if (internship == null)
            {
                return NotFound(new { message = "Internship not found" });
            }

            if (internship.IsActive != true)
            {
                return BadRequest(new { message = "This internship is no longer accepting applications" });
            }

            if (internship.Deadline.HasValue && internship.Deadline.Value < DateTime.UtcNow)
            {
                return BadRequest(new { message = "The application deadline has passed" });
            }

            // Check if already applied
            var existingApplication = await _context.InternshipApplications
                .FirstOrDefaultAsync(a => a.InternshipId == dto.InternshipId && a.StudentId == studentProfile.StudentProfileId);

            if (existingApplication != null)
            {
                return BadRequest(new { message = "You have already applied for this internship" });
            }

            var application = new InternshipApplication
            {
                InternshipId = dto.InternshipId,
                StudentId = studentProfile.StudentProfileId,
                Status = "pending",
                AppliedAt = DateTime.UtcNow
            };

            _context.InternshipApplications.Add(application);
            await _context.SaveChangesAsync();

            // Send confirmation email to student
            try
            {
                await _emailService.SendApplicationConfirmationAsync(
                    studentProfile.User?.Email ?? "",
                    studentProfile.User?.Name ?? "Applicant",
                    internship.Title,
                    internship.RecruiterProfile?.CompanyName ?? "Company"
                );
            }
            catch (Exception emailEx)
            {
                _logger.LogWarning(emailEx, "Failed to send application confirmation email");
            }

            return CreatedAtAction(nameof(GetStudentApplications), new InternshipApplicationDto
            {
                ApplicationId = application.ApplicationId,
                InternshipId = application.InternshipId,
                InternshipTitle = internship.Title,
                CompanyName = internship.RecruiterProfile?.CompanyName,
                StudentId = application.StudentId,
                Status = application.Status,
                AppliedAt = application.AppliedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying for internship");
            return StatusCode(500, new { message = $"An error occurred: {ex.Message}" });
        }
    }

    // PUT: api/applications/{id}/status - Update application status (recruiter only)
    [HttpPut("{id}/status")]
    public async Task<ActionResult<InternshipApplicationDto>> UpdateApplicationStatus(int id, [FromBody] UpdateApplicationStatusDto dto)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var recruiterProfile = await _context.RecruiterProfiles
                .FirstOrDefaultAsync(rp => rp.UserId == userId);

            if (recruiterProfile == null)
            {
                return BadRequest(new { message = "Only recruiters can update application status" });
            }

            var application = await _context.InternshipApplications
                .FirstOrDefaultAsync(a => a.ApplicationId == id);

            if (application == null)
            {
                return NotFound(new { message = "Application not found" });
            }

            // Load the internship separately to verify ownership
            var internship = await _context.Internships
                .FirstOrDefaultAsync(i => i.InternshipId == application.InternshipId);

            if (internship == null)
            {
                return BadRequest(new { message = "Associated internship not found" });
            }

            // Verify the recruiter owns this internship
            if (internship.RecruiterProfileId != recruiterProfile.RecruiterProfileId)
            {
                return BadRequest(new { message = "You don't have permission to update this application" });
            }

            application.Status = dto.Status;
            application.ReviewerNotes = dto.ReviewerNotes;
            application.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Load student info for response
            var studentProfile = await _context.StudentProfiles
                .Include(sp => sp.User)
                .FirstOrDefaultAsync(sp => sp.StudentProfileId == application.StudentId);

            // Send status update email to student
            try
            {
                await _emailService.SendApplicationStatusUpdateAsync(
                    studentProfile?.User?.Email ?? "",
                    studentProfile?.User?.Name ?? "Applicant",
                    internship.Title,
                    dto.Status
                );
            }
            catch (Exception emailEx)
            {
                _logger.LogWarning(emailEx, "Failed to send application status update email");
            }

            return Ok(new InternshipApplicationDto
            {
                ApplicationId = application.ApplicationId,
                InternshipId = application.InternshipId,
                InternshipTitle = internship.Title,
                StudentId = application.StudentId,
                StudentName = studentProfile?.User?.Name,
                Status = application.Status,
                AppliedAt = application.AppliedAt,
                ReviewedAt = application.ReviewedAt,
                ReviewerNotes = application.ReviewerNotes
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating application status: {Message}", ex.Message);
            return StatusCode(500, new { message = $"An error occurred: {ex.Message}" });
        }
    }

    // PUT: api/applications/{id}/complete - Mark application as complete (recruiter only)
    [HttpPut("{id}/complete")]
    public async Task<ActionResult<InternshipApplicationDto>> CompleteApplication(int id, [FromBody] CompleteApplicationDto dto)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var recruiterProfile = await _context.RecruiterProfiles
                .FirstOrDefaultAsync(rp => rp.UserId == userId);

            if (recruiterProfile == null)
            {
                return BadRequest(new { message = "Only recruiters can mark applications as complete" });
            }

            var application = await _context.InternshipApplications
                .FirstOrDefaultAsync(a => a.ApplicationId == id);

            if (application == null)
            {
                return NotFound(new { message = "Application not found" });
            }

            // Load the internship to verify ownership
            var internship = await _context.Internships
                .FirstOrDefaultAsync(i => i.InternshipId == application.InternshipId);

            if (internship == null)
            {
                return BadRequest(new { message = "Associated internship not found" });
            }

            // Verify the recruiter owns this internship
            if (internship.RecruiterProfileId != recruiterProfile.RecruiterProfileId)
            {
                return BadRequest(new { message = "You don't have permission to update this application" });
            }

            // Only allow completion for accepted or already completed applications
            if (application.Status != "accepted" && application.Status != "completed")
            {
                return BadRequest(new { message = "Can only mark accepted applications as complete" });
            }

            // Update completion fields
            application.Status = "completed";
            application.PerformanceRating = dto.PerformanceRating;
            application.PerformanceComment = dto.PerformanceComment;
            application.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Load student info for response
            var studentProfile = await _context.StudentProfiles
                .Include(sp => sp.User)
                .FirstOrDefaultAsync(sp => sp.StudentProfileId == application.StudentId);

            // Send completion notification email to student
            try
            {
                await _emailService.SendApplicationStatusUpdateAsync(
                    studentProfile?.User?.Email ?? "",
                    studentProfile?.User?.Name ?? "Applicant",
                    internship.Title,
                    "completed"
                );
            }
            catch (Exception emailEx)
            {
                _logger.LogWarning(emailEx, "Failed to send internship completion email");
            }

            return Ok(new InternshipApplicationDto
            {
                ApplicationId = application.ApplicationId,
                InternshipId = application.InternshipId,
                InternshipTitle = internship.Title,
                StudentId = application.StudentId,
                StudentName = studentProfile?.User?.Name,
                Status = application.Status,
                AppliedAt = application.AppliedAt,
                ReviewedAt = application.ReviewedAt,
                ReviewerNotes = application.ReviewerNotes,
                PerformanceRating = application.PerformanceRating,
                PerformanceComment = application.PerformanceComment,
                CertificateUrl = application.CertificateUrl,
                CompletedAt = application.CompletedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing application: {Message}", ex.Message);
            return StatusCode(500, new { message = $"An error occurred: {ex.Message}" });
        }
    }

    // PUT: api/applications/{id}/undo-complete - Undo completion (recruiter only)
    [HttpPut("{id}/undo-complete")]
    public async Task<ActionResult<InternshipApplicationDto>> UndoCompleteApplication(int id)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var recruiterProfile = await _context.RecruiterProfiles
                .FirstOrDefaultAsync(rp => rp.UserId == userId);

            if (recruiterProfile == null)
            {
                return BadRequest(new { message = "Only recruiters can undo completion" });
            }

            var application = await _context.InternshipApplications
                .FirstOrDefaultAsync(a => a.ApplicationId == id);

            if (application == null)
            {
                return NotFound(new { message = "Application not found" });
            }

            // Load the internship to verify ownership
            var internship = await _context.Internships
                .FirstOrDefaultAsync(i => i.InternshipId == application.InternshipId);

            if (internship == null)
            {
                return BadRequest(new { message = "Associated internship not found" });
            }

            // Verify the recruiter owns this internship
            if (internship.RecruiterProfileId != recruiterProfile.RecruiterProfileId)
            {
                return BadRequest(new { message = "You don't have permission to update this application" });
            }

            // Only allow undo for completed applications
            if (application.Status != "completed")
            {
                return BadRequest(new { message = "Can only undo completed applications" });
            }

            // Revert to accepted status and clear completion fields
            application.Status = "accepted";
            application.PerformanceRating = null;
            application.PerformanceComment = null;
            application.CertificateUrl = null;
            application.CompletedAt = null;

            await _context.SaveChangesAsync();

            // Load student info for response
            var studentProfile = await _context.StudentProfiles
                .Include(sp => sp.User)
                .FirstOrDefaultAsync(sp => sp.StudentProfileId == application.StudentId);

            return Ok(new InternshipApplicationDto
            {
                ApplicationId = application.ApplicationId,
                InternshipId = application.InternshipId,
                InternshipTitle = internship.Title,
                StudentId = application.StudentId,
                StudentName = studentProfile?.User?.Name,
                Status = application.Status,
                AppliedAt = application.AppliedAt,
                ReviewedAt = application.ReviewedAt,
                ReviewerNotes = application.ReviewerNotes,
                PerformanceRating = null,
                PerformanceComment = null,
                CertificateUrl = null,
                CompletedAt = null
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error undoing application completion: {Message}", ex.Message);
            return StatusCode(500, new { message = $"An error occurred: {ex.Message}" });
        }
    }

    // DELETE: api/applications/{id} - Withdraw application (student only)
    [HttpDelete("{id}")]
    public async Task<ActionResult> WithdrawApplication(int id)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var studentProfile = await _context.StudentProfiles
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (studentProfile == null)
            {
                return BadRequest(new { message = "Only students can withdraw applications" });
            }

            var application = await _context.InternshipApplications
                .FirstOrDefaultAsync(a => a.ApplicationId == id && a.StudentId == studentProfile.StudentProfileId);

            if (application == null)
            {
                return NotFound(new { message = "Application not found or you don't have permission to withdraw it" });
            }

            if (application.Status != "pending")
            {
                return BadRequest(new { message = "Can only withdraw pending applications" });
            }

            _context.InternshipApplications.Remove(application);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Application withdrawn successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error withdrawing application");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
