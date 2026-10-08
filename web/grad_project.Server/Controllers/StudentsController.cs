using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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
public class StudentsController : ControllerBase
{
    private readonly PathGuideContext _context;
    private readonly ILogger<StudentsController> _logger;
    private readonly ICvFileStore _cvFileStore;
    private readonly ICvSuggestionService _cvSuggestionService;

    public StudentsController(
        PathGuideContext context,
        ILogger<StudentsController> logger,
        ICvFileStore cvFileStore,
        ICvSuggestionService cvSuggestionService)
    {
        _context = context;
        _logger = logger;
        _cvFileStore = cvFileStore;
        _cvSuggestionService = cvSuggestionService;
    }

    [HttpGet("profile")]
    public async Task<ActionResult<StudentProfileDto>> GetMyProfile()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var profile = await _context.StudentProfiles
                .Include(sp => sp.User)
                .Include(sp => sp.University)
                .Include(sp => sp.Major)
                .Include(sp => sp.CareerPath)
                .Include(sp => sp.StudentSkills)
                    .ThenInclude(ss => ss.Skill)
                .Include(sp => sp.StudentInterests)
                    .ThenInclude(si => si.Interest)
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (profile == null)
            {
                return NotFound(new { message = "Student profile not found" });
            }

            return Ok(MapToDto(profile));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting student profile");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<StudentProfileDto>> GetProfile(int id)
    {
        try
        {
            var profile = await _context.StudentProfiles
                .Include(sp => sp.User)
                .Include(sp => sp.University)
                .Include(sp => sp.Major)
                .Include(sp => sp.CareerPath)
                .Include(sp => sp.StudentSkills)
                    .ThenInclude(ss => ss.Skill)
                .Include(sp => sp.StudentInterests)
                    .ThenInclude(si => si.Interest)
                .FirstOrDefaultAsync(sp => sp.StudentProfileId == id);

            if (profile == null)
            {
                return NotFound(new { message = "Student profile not found" });
            }

            return Ok(MapToDto(profile));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting student profile");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    [HttpPut("profile")]
    public async Task<ActionResult<StudentProfileDto>> UpdateProfile([FromBody] UpdateStudentProfileDto dto)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var profile = await _context.StudentProfiles
                .Include(sp => sp.User)
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (profile == null)
            {
                return NotFound(new { message = "Student profile not found" });
            }

            // Update user fields (Name and Phone)
            if (profile.User != null)
            {
                if (dto.FullName != null)
                    profile.User.Name = dto.FullName;
                if (dto.Phone != null)
                    profile.User.Phone = dto.Phone;
                profile.User.UpdatedAt = DateTime.UtcNow;
            }

            // Update profile fields
            if (dto.UniversityId.HasValue)
                profile.UniversityId = dto.UniversityId;
            if (dto.MajorId.HasValue)
                profile.MajorId = dto.MajorId;
            if (dto.Gpa.HasValue)
                profile.Gpa = dto.Gpa;
            if (dto.GraduationYear.HasValue)
                profile.GraduationYear = dto.GraduationYear;
            // CvUrl is managed via the dedicated CV upload/delete endpoints, not here.
            if (dto.TranscriptUrl != null)
                profile.TranscriptUrl = dto.TranscriptUrl;
            if (dto.LinkedinUrl != null)
                profile.LinkedinUrl = dto.LinkedinUrl;
            if (dto.GithubUrl != null)
                profile.GithubUrl = dto.GithubUrl;
            // Always update CareerPathId to allow clearing (setting to null)
            profile.CareerPathId = dto.CareerPathId;
            if (dto.Bio != null)
                profile.Bio = dto.Bio;

            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Update skills separately to avoid tracking issues
            if (dto.SkillIds != null)
            {
                // Remove existing skills directly from database
                var existingSkills = await _context.StudentSkills
                    .Where(ss => ss.StudentId == profile.StudentProfileId)
                    .ToListAsync();
                _context.StudentSkills.RemoveRange(existingSkills);
                await _context.SaveChangesAsync();

                // Add new skills
                foreach (var skillId in dto.SkillIds)
                {
                    _context.StudentSkills.Add(new StudentSkill
                    {
                        StudentId = profile.StudentProfileId,
                        SkillId = skillId
                    });
                }
                await _context.SaveChangesAsync();
            }

            // Update interests separately to avoid tracking issues
            if (dto.InterestIds != null)
            {
                // Remove existing interests directly from database
                var existingInterests = await _context.StudentInterests
                    .Where(si => si.StudentId == profile.StudentProfileId)
                    .ToListAsync();
                _context.StudentInterests.RemoveRange(existingInterests);
                await _context.SaveChangesAsync();

                // Add new interests
                foreach (var interestId in dto.InterestIds)
                {
                    _context.StudentInterests.Add(new StudentInterest
                    {
                        StudentId = profile.StudentProfileId,
                        InterestId = interestId
                    });
                }
                await _context.SaveChangesAsync();
            }

            // Reload profile with relationships
            profile = await _context.StudentProfiles
                .Include(sp => sp.User)
                .Include(sp => sp.University)
                .Include(sp => sp.Major)
                .Include(sp => sp.CareerPath)
                .Include(sp => sp.StudentSkills)
                    .ThenInclude(ss => ss.Skill)
                .Include(sp => sp.StudentInterests)
                    .ThenInclude(si => si.Interest)
                .FirstOrDefaultAsync(sp => sp.StudentProfileId == profile.StudentProfileId);

            return Ok(MapToDto(profile!));
        }
        catch (Exception ex)
        {
            var innerMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Error updating student profile: {Message} | Inner: {Inner}", ex.Message, innerMessage);
            return StatusCode(500, new { message = $"An error occurred: {innerMessage}" });
        }
    }

    // POST: api/students/profile/cv - Upload (or replace) the current student's CV.
    // Accepts .pdf and .docx only. The request body cap (6 MB) sits just above the
    // 5 MB business limit to leave room for multipart boundaries/headers.
    [HttpPost("profile/cv")]
    [RequestSizeLimit(6_291_456)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult> UploadCv(IFormFile? file)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var profile = await _context.StudentProfiles
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (profile == null)
            {
                return NotFound(new { message = "Student profile not found" });
            }

            // ---- Validation (cheap checks first, before any disk I/O) ----
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file was uploaded." });
            }

            if (file.Length > CvFiles.MaxBytes)
            {
                return BadRequest(new { message = "File is too large. Maximum size is 5 MB." });
            }

            var extension = CvFiles.GetAllowedExtension(file.FileName);
            if (extension == null)
            {
                return BadRequest(new { message = "Only PDF and DOCX files are allowed." });
            }

            // Client content-type is a weak gate; magic bytes below are authoritative.
            if (!string.IsNullOrEmpty(file.ContentType) &&
                !CvFiles.AllowedContentTypes.Contains(file.ContentType))
            {
                return BadRequest(new { message = "Only PDF and DOCX files are allowed." });
            }

            // Buffer once so we can both validate the signature and persist the
            // bytes without re-reading the request stream.
            using var buffer = new MemoryStream();
            await using (var upload = file.OpenReadStream())
            {
                await upload.CopyToAsync(buffer);
            }

            var header = buffer.GetBuffer().AsSpan(0, (int)Math.Min(buffer.Length, 8));
            if (!CvFiles.HasValidSignature(header, extension))
            {
                return BadRequest(new { message = "The file content does not match its extension." });
            }

            buffer.Position = 0;

            // ---- Crash-safe replace: write new -> persist column -> delete old ----
            string? newRelativePath = null;
            var previousValue = profile.CvUrl;
            try
            {
                newRelativePath = await _cvFileStore.SaveAsync(buffer, extension, HttpContext.RequestAborted);

                profile.CvUrl = newRelativePath;
                profile.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            catch
            {
                // DB never committed the new path, so the existing CV (if any) is
                // still valid. Remove the just-written orphan and surface the error.
                if (newRelativePath != null)
                {
                    _cvFileStore.Delete(newRelativePath);
                }
                throw;
            }

            // Only after the new path is durably committed do we drop the old
            // file. Legacy external URLs have no local file to delete.
            if (!string.IsNullOrEmpty(previousValue) && !CvFiles.IsExternalUrl(previousValue))
            {
                _cvFileStore.Delete(previousValue);
            }

            return Ok(new { hasCv = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading CV");
            // TEMP DIAGNOSTIC (revert): normally returns the generic message below.
            return StatusCode(500, new { message = "CV upload error: " + ex.Message, detail = ex.ToString() });
        }
    }

    // GET: api/students/{studentProfileId}/cv - Download a CV. Allowed for the
    // owning student or an admin. Recruiters use the application-scoped endpoint.
    [HttpGet("{studentProfileId}/cv")]
    public async Task<ActionResult> DownloadCv(int studentProfileId)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var profile = await _context.StudentProfiles
                .FirstOrDefaultAsync(sp => sp.StudentProfileId == studentProfileId);

            if (profile == null)
            {
                return NotFound(new { message = "Student profile not found" });
            }

            if (profile.UserId != userId && !User.IsInRole("admin"))
            {
                return Forbid();
            }

            return BuildCvDownload(profile.CvUrl, studentProfileId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading CV for profile {ProfileId}", studentProfileId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // DELETE: api/students/profile/cv - Remove the current student's CV. Idempotent.
    [HttpDelete("profile/cv")]
    public async Task<ActionResult> DeleteCv()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var profile = await _context.StudentProfiles
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (profile == null)
            {
                return NotFound(new { message = "Student profile not found" });
            }

            var previousValue = profile.CvUrl;
            profile.CvUrl = null;
            profile.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            if (!string.IsNullOrEmpty(previousValue) && !CvFiles.IsExternalUrl(previousValue))
            {
                _cvFileStore.Delete(previousValue);
            }

            return Ok(new { hasCv = false });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting CV");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // POST: api/students/profile/cv/parse - Parse the current student's uploaded
    // CV with OpenAI and return profile-field suggestions (nothing is saved).
    // Degrades gracefully: if anything goes wrong, returns { parsed: false }.
    [HttpPost("profile/cv/parse")]
    [EnableRateLimiting("cv-parse")]
    public async Task<ActionResult<CvSuggestionsDto>> ParseCv(CancellationToken cancellationToken)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            // Self-only: a student can only parse their own CV (looked up by claim).
            var profile = await _context.StudentProfiles
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (profile == null)
            {
                return NotFound(new { message = "Student profile not found" });
            }

            if (string.IsNullOrEmpty(profile.CvUrl))
            {
                return BadRequest(new { message = "Upload a CV first." });
            }

            // Legacy external link or a file that's gone — can't extract text.
            // TEMP DIAGNOSTIC (revert): normally returns { Parsed = false } here.
            if (CvFiles.IsExternalUrl(profile.CvUrl))
            {
                return StatusCode(500, new { message = "Stored CV is an external URL, not a local file: " + profile.CvUrl });
            }
            if (!_cvFileStore.Exists(profile.CvUrl))
            {
                return StatusCode(500, new { message = "CV file not found on disk for stored path: " + profile.CvUrl });
            }

            Stream? stream;
            try
            {
                stream = _cvFileStore.OpenRead(profile.CvUrl);
            }
            catch (Exception ex)
            {
                // TEMP DIAGNOSTIC (revert): normally degrades gracefully to { Parsed = false }.
                _logger.LogWarning(ex, "Could not open CV for parsing");
                return StatusCode(500, new { message = "Could not open CV file: " + ex.Message, detail = ex.ToString() });
            }

            // We own the stream; the service borrows it. A genuine failure inside
            // the pipeline (e.g. DB error during resolution) propagates to the
            // outer catch as a 500 rather than masquerading as parsed:false.
            try
            {
                var suggestions = await _cvSuggestionService.SuggestAsync(
                    stream, Path.GetExtension(profile.CvUrl), cancellationToken);
                return Ok(suggestions);
            }
            finally
            {
                stream.Dispose();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing CV");
            // TEMP DIAGNOSTIC (revert): normally returns the generic message below.
            return StatusCode(500, new { message = "CV parse error: " + ex.Message, detail = ex.ToString() });
        }
    }

    /// <summary>
    /// Builds the download response for a stored CV value. Returns a file stream
    /// (Content-Disposition: attachment) for locally stored CVs, a small JSON
    /// payload pointing at the link for legacy external URLs, or 404 when there
    /// is no CV or the file is missing on disk.
    /// </summary>
    private ActionResult BuildCvDownload(string? storedValue, int studentProfileId)
    {
        if (string.IsNullOrEmpty(storedValue))
        {
            return NotFound(new { message = "No CV available." });
        }

        if (CvFiles.IsExternalUrl(storedValue))
        {
            return Ok(new { type = "external", url = storedValue });
        }

        if (!_cvFileStore.Exists(storedValue))
        {
            return NotFound(new { message = "CV file not found." });
        }

        var extension = Path.GetExtension(storedValue);
        var stream = _cvFileStore.OpenRead(storedValue);
        // File(...) with a download name emits Content-Disposition: attachment,
        // so a malicious PDF can't be rendered inline in our origin.
        return File(stream, CvFiles.ContentTypeForExtension(extension), $"cv-{studentProfileId}{extension}");
    }

    [HttpPost("skills/{skillId}")]
    public async Task<ActionResult> AddSkill(int skillId)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var profile = await _context.StudentProfiles
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (profile == null)
            {
                return NotFound(new { message = "Student profile not found" });
            }

            // Check if skill exists
            var skill = await _context.Skills.FindAsync(skillId);
            if (skill == null)
            {
                return NotFound(new { message = "Skill not found" });
            }

            // Check if already added
            var existing = await _context.StudentSkills
                .AnyAsync(ss => ss.StudentId == profile.StudentProfileId && ss.SkillId == skillId);

            if (existing)
            {
                return BadRequest(new { message = "Skill already added" });
            }

            _context.StudentSkills.Add(new StudentSkill
            {
                StudentId = profile.StudentProfileId,
                SkillId = skillId
            });

            await _context.SaveChangesAsync();

            return Ok(new { message = "Skill added successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding skill");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    [HttpDelete("skills/{skillId}")]
    public async Task<ActionResult> RemoveSkill(int skillId)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var profile = await _context.StudentProfiles
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (profile == null)
            {
                return NotFound(new { message = "Student profile not found" });
            }

            var studentSkill = await _context.StudentSkills
                .FirstOrDefaultAsync(ss => ss.StudentId == profile.StudentProfileId && ss.SkillId == skillId);

            if (studentSkill == null)
            {
                return NotFound(new { message = "Skill not found in profile" });
            }

            _context.StudentSkills.Remove(studentSkill);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Skill removed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing skill");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    [HttpPost("interests/{interestId}")]
    public async Task<ActionResult> AddInterest(int interestId)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var profile = await _context.StudentProfiles
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (profile == null)
            {
                return NotFound(new { message = "Student profile not found" });
            }

            // Check if interest exists
            var interest = await _context.Interests.FindAsync(interestId);
            if (interest == null)
            {
                return NotFound(new { message = "Interest not found" });
            }

            // Check if already added
            var existing = await _context.StudentInterests
                .AnyAsync(si => si.StudentId == profile.StudentProfileId && si.InterestId == interestId);

            if (existing)
            {
                return BadRequest(new { message = "Interest already added" });
            }

            _context.StudentInterests.Add(new StudentInterest
            {
                StudentId = profile.StudentProfileId,
                InterestId = interestId
            });

            await _context.SaveChangesAsync();

            return Ok(new { message = "Interest added successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding interest");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    [HttpDelete("interests/{interestId}")]
    public async Task<ActionResult> RemoveInterest(int interestId)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var profile = await _context.StudentProfiles
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (profile == null)
            {
                return NotFound(new { message = "Student profile not found" });
            }

            var studentInterest = await _context.StudentInterests
                .FirstOrDefaultAsync(si => si.StudentId == profile.StudentProfileId && si.InterestId == interestId);

            if (studentInterest == null)
            {
                return NotFound(new { message = "Interest not found in profile" });
            }

            _context.StudentInterests.Remove(studentInterest);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Interest removed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing interest");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    private static StudentProfileDto MapToDto(StudentProfile profile)
    {
        return new StudentProfileDto
        {
            StudentProfileId = profile.StudentProfileId,
            UserId = profile.UserId,
            UserName = profile.User?.Name,
            UserEmail = profile.User?.Email,
            Phone = profile.User?.Phone,
            UniversityId = profile.UniversityId,
            UniversityName = profile.University?.UniversityName,
            MajorId = profile.MajorId,
            MajorName = profile.Major?.MajorName,
            Gpa = profile.Gpa,
            GraduationYear = profile.GraduationYear,
            HasCv = !string.IsNullOrEmpty(profile.CvUrl),
            TranscriptUrl = profile.TranscriptUrl,
            LinkedinUrl = profile.LinkedinUrl,
            GithubUrl = profile.GithubUrl,
            CareerPathId = profile.CareerPathId,
            CareerPathName = profile.CareerPath?.CareerPathName,
            Bio = profile.Bio,
            Skills = profile.StudentSkills
                .Where(ss => ss.Skill != null)
                .Select(ss => new SkillDto
                {
                    SkillId = ss.Skill!.SkillId,
                    SkillName = ss.Skill.SkillName,
                    Category = ss.Skill.Category
                }).ToList(),
            Interests = profile.StudentInterests
                .Where(si => si.Interest != null)
                .Select(si => new InterestDto
                {
                    InterestId = si.Interest.InterestId,
                    InterestName = si.Interest.InterestName
                }).ToList(),
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt
        };
    }
}
