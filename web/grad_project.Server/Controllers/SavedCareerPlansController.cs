using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using grad_project.Server.Data;
using grad_project.Server.DTOs;
using grad_project.Server.Models;

namespace grad_project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SavedCareerPlansController : ControllerBase
{
    private readonly PathGuideContext _context;
    private readonly ILogger<SavedCareerPlansController> _logger;

    public SavedCareerPlansController(PathGuideContext context, ILogger<SavedCareerPlansController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/savedcareerplans - Get all saved plans for the current student
    [HttpGet]
    public async Task<ActionResult<List<SavedCareerPlanSummaryDto>>> GetMyPlans()
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

            var plans = await _context.SavedCareerPlans
                .Include(p => p.Courses)
                .Where(p => p.StudentId == profile.StudentProfileId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var result = plans.Select(p => new SavedCareerPlanSummaryDto
            {
                SavedPlanId = p.SavedPlanId,
                TargetRole = p.TargetRole,
                TotalHours = p.TotalHours,
                WeeksAt10H = p.WeeksAt10H,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                CompletedCoursesCount = p.Courses.Count(c => c.IsCompleted),
                TotalCoursesCount = p.Courses.Count,
                ProgressPercentage = p.Courses.Count > 0
                    ? Math.Round((double)p.Courses.Count(c => c.IsCompleted) / p.Courses.Count * 100, 1)
                    : 0
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting saved career plans");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // GET: api/savedcareerplans/active - Get the active plan for the current student
    [HttpGet("active")]
    public async Task<ActionResult<SavedCareerPlanDto>> GetActivePlan()
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

            var plan = await _context.SavedCareerPlans
                .Include(p => p.Skills)
                .Include(p => p.Courses)
                .Where(p => p.StudentId == profile.StudentProfileId && p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();

            if (plan == null)
            {
                return NotFound(new { message = "No active career plan found" });
            }

            return Ok(MapToDto(plan));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active career plan");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // GET: api/savedcareerplans/{id} - Get a specific saved plan
    [HttpGet("{id}")]
    public async Task<ActionResult<SavedCareerPlanDto>> GetPlan(int id)
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

            var plan = await _context.SavedCareerPlans
                .Include(p => p.Skills)
                .Include(p => p.Courses)
                .FirstOrDefaultAsync(p => p.SavedPlanId == id && p.StudentId == profile.StudentProfileId);

            if (plan == null)
            {
                return NotFound(new { message = "Career plan not found" });
            }

            return Ok(MapToDto(plan));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting career plan");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // POST: api/savedcareerplans - Save a new career plan
    [HttpPost]
    public async Task<ActionResult<SavedCareerPlanDto>> SavePlan([FromBody] SaveCareerPlanRequest? request)
    {
        try
        {
            // Log the incoming request for debugging
            _logger.LogInformation("SavePlan called with request: {@Request}", request);

            if (request == null)
            {
                return BadRequest(new { message = "Request body is null" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Validation failed", errors });
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var profile = await _context.StudentProfiles
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (profile == null)
            {
                return NotFound(new { message = "Student profile not found" });
            }

            // Deactivate any existing active plans for this student
            var existingActivePlans = await _context.SavedCareerPlans
                .Where(p => p.StudentId == profile.StudentProfileId && p.IsActive)
                .ToListAsync();

            foreach (var existingPlan in existingActivePlans)
            {
                existingPlan.IsActive = false;
                existingPlan.UpdatedAt = DateTime.UtcNow;
            }

            // Create the new plan
            var plan = new SavedCareerPlan
            {
                StudentId = profile.StudentProfileId,
                TargetRole = request.TargetRole,
                TotalHours = (int)Math.Round(request.TotalHours),
                WeeksAt10H = (int)Math.Round(request.WeeksAt10H),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.SavedCareerPlans.Add(plan);
            await _context.SaveChangesAsync();

            // Add skills
            foreach (var skillName in request.SkillsNeeded)
            {
                // Try to find matching skill in the database
                var existingSkill = await _context.Skills
                    .FirstOrDefaultAsync(s => s.SkillName.ToLower() == skillName.ToLower());

                var planSkill = new CareerPlanSkill
                {
                    SavedPlanId = plan.SavedPlanId,
                    SkillName = skillName,
                    SkillId = existingSkill?.SkillId
                };

                _context.CareerPlanSkills.Add(planSkill);
            }

            // Add courses
            foreach (var step in request.Steps)
            {
                var course = new CareerPlanCourse
                {
                    SavedPlanId = plan.SavedPlanId,
                    StepNumber = step.Step,
                    SkillName = step.Skill,
                    CourseTitle = step.CourseTitle,
                    CourseLink = step.CourseLink,
                    Hours = step.Hours.HasValue ? (int)Math.Round(step.Hours.Value) : null,
                    CumulativeHours = step.CumulativeHours.HasValue ? (int)Math.Round(step.CumulativeHours.Value) : null,
                    Prerequisites = JsonSerializer.Serialize(step.Prerequisites),
                    IsCompleted = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CareerPlanCourses.Add(course);
            }

            await _context.SaveChangesAsync();

            // Reload with relationships
            plan = await _context.SavedCareerPlans
                .Include(p => p.Skills)
                .Include(p => p.Courses)
                .FirstOrDefaultAsync(p => p.SavedPlanId == plan.SavedPlanId);

            return CreatedAtAction(nameof(GetPlan), new { id = plan!.SavedPlanId }, MapToDto(plan));
        }
        catch (Exception ex)
        {
            var innerMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Error saving career plan: {Message} | Inner: {Inner}", ex.Message, innerMessage);
            return StatusCode(500, new { message = $"An error occurred: {innerMessage}" });
        }
    }

    // PUT: api/savedcareerplans/{id}/courses/{courseId}/complete - Mark a course as complete
    [HttpPut("{id}/courses/{courseId}/complete")]
    public async Task<ActionResult<CareerPlanCourseDto>> MarkCourseComplete(int id, int courseId, [FromBody] MarkCourseCompleteRequest request)
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

            var plan = await _context.SavedCareerPlans
                .FirstOrDefaultAsync(p => p.SavedPlanId == id && p.StudentId == profile.StudentProfileId);

            if (plan == null)
            {
                return NotFound(new { message = "Career plan not found" });
            }

            var course = await _context.CareerPlanCourses
                .FirstOrDefaultAsync(c => c.CourseId == courseId && c.SavedPlanId == id);

            if (course == null)
            {
                return NotFound(new { message = "Course not found" });
            }

            course.IsCompleted = true;
            course.CompletedAt = DateTime.UtcNow;
            course.CertificateUrl = request.CertificateUrl;

            plan.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new CareerPlanCourseDto
            {
                CourseId = course.CourseId,
                StepNumber = course.StepNumber,
                SkillName = course.SkillName,
                CourseTitle = course.CourseTitle,
                CourseLink = course.CourseLink,
                Hours = course.Hours,
                CumulativeHours = course.CumulativeHours,
                Prerequisites = string.IsNullOrEmpty(course.Prerequisites)
                    ? new List<string>()
                    : JsonSerializer.Deserialize<List<string>>(course.Prerequisites) ?? new List<string>(),
                IsCompleted = course.IsCompleted,
                CompletedAt = course.CompletedAt,
                CertificateUrl = course.CertificateUrl
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking course complete");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // PUT: api/savedcareerplans/{id}/courses/{courseId}/uncomplete - Mark a course as not complete
    [HttpPut("{id}/courses/{courseId}/uncomplete")]
    public async Task<ActionResult<CareerPlanCourseDto>> MarkCourseUncomplete(int id, int courseId)
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

            var plan = await _context.SavedCareerPlans
                .FirstOrDefaultAsync(p => p.SavedPlanId == id && p.StudentId == profile.StudentProfileId);

            if (plan == null)
            {
                return NotFound(new { message = "Career plan not found" });
            }

            var course = await _context.CareerPlanCourses
                .FirstOrDefaultAsync(c => c.CourseId == courseId && c.SavedPlanId == id);

            if (course == null)
            {
                return NotFound(new { message = "Course not found" });
            }

            course.IsCompleted = false;
            course.CompletedAt = null;
            course.CertificateUrl = null;

            plan.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new CareerPlanCourseDto
            {
                CourseId = course.CourseId,
                StepNumber = course.StepNumber,
                SkillName = course.SkillName,
                CourseTitle = course.CourseTitle,
                CourseLink = course.CourseLink,
                Hours = course.Hours,
                CumulativeHours = course.CumulativeHours,
                Prerequisites = string.IsNullOrEmpty(course.Prerequisites)
                    ? new List<string>()
                    : JsonSerializer.Deserialize<List<string>>(course.Prerequisites) ?? new List<string>(),
                IsCompleted = course.IsCompleted,
                CompletedAt = course.CompletedAt,
                CertificateUrl = course.CertificateUrl
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking course uncomplete");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // DELETE: api/savedcareerplans/{id} - Delete a saved plan
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeletePlan(int id)
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

            var plan = await _context.SavedCareerPlans
                .FirstOrDefaultAsync(p => p.SavedPlanId == id && p.StudentId == profile.StudentProfileId);

            if (plan == null)
            {
                return NotFound(new { message = "Career plan not found" });
            }

            _context.SavedCareerPlans.Remove(plan);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Career plan deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting career plan");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // PUT: api/savedcareerplans/{id}/activate - Set a plan as active
    [HttpPut("{id}/activate")]
    public async Task<ActionResult> ActivatePlan(int id)
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

            var plan = await _context.SavedCareerPlans
                .FirstOrDefaultAsync(p => p.SavedPlanId == id && p.StudentId == profile.StudentProfileId);

            if (plan == null)
            {
                return NotFound(new { message = "Career plan not found" });
            }

            // Deactivate all other plans
            var otherPlans = await _context.SavedCareerPlans
                .Where(p => p.StudentId == profile.StudentProfileId && p.SavedPlanId != id)
                .ToListAsync();

            foreach (var otherPlan in otherPlans)
            {
                otherPlan.IsActive = false;
                otherPlan.UpdatedAt = DateTime.UtcNow;
            }

            plan.IsActive = true;
            plan.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Career plan activated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating career plan");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    private static SavedCareerPlanDto MapToDto(SavedCareerPlan plan)
    {
        var completedCount = plan.Courses.Count(c => c.IsCompleted);
        var totalCount = plan.Courses.Count;

        return new SavedCareerPlanDto
        {
            SavedPlanId = plan.SavedPlanId,
            StudentId = plan.StudentId,
            TargetRole = plan.TargetRole,
            TotalHours = plan.TotalHours,
            WeeksAt10H = plan.WeeksAt10H,
            IsActive = plan.IsActive,
            CreatedAt = plan.CreatedAt,
            UpdatedAt = plan.UpdatedAt,
            Skills = plan.Skills.Select(s => new CareerPlanSkillDto
            {
                PlanSkillId = s.PlanSkillId,
                SkillName = s.SkillName,
                SkillId = s.SkillId
            }).ToList(),
            Courses = plan.Courses.OrderBy(c => c.StepNumber).Select(c => new CareerPlanCourseDto
            {
                CourseId = c.CourseId,
                StepNumber = c.StepNumber,
                SkillName = c.SkillName,
                CourseTitle = c.CourseTitle,
                CourseLink = c.CourseLink,
                Hours = c.Hours,
                CumulativeHours = c.CumulativeHours,
                Prerequisites = string.IsNullOrEmpty(c.Prerequisites)
                    ? new List<string>()
                    : JsonSerializer.Deserialize<List<string>>(c.Prerequisites) ?? new List<string>(),
                IsCompleted = c.IsCompleted,
                CompletedAt = c.CompletedAt,
                CertificateUrl = c.CertificateUrl
            }).ToList(),
            CompletedCoursesCount = completedCount,
            TotalCoursesCount = totalCount,
            ProgressPercentage = totalCount > 0
                ? Math.Round((double)completedCount / totalCount * 100, 1)
                : 0
        };
    }
}
