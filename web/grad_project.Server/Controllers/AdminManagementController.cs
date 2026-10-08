using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using grad_project.Server.Data;
using grad_project.Server.DTOs;
using System.Security.Claims;

namespace grad_project.Server.Controllers;

[ApiController]
[Route("api/admin-management")]
[Authorize(Roles = "admin")]
public class AdminManagementController : ControllerBase
{
    private readonly PathGuideContext _context;
    private readonly ILogger<AdminManagementController> _logger;

    public AdminManagementController(
        PathGuideContext context,
        ILogger<AdminManagementController> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Dashboard

    /// <summary>
    /// Get dashboard statistics
    /// </summary>
    [HttpGet("dashboard/stats")]
    public async Task<ActionResult<AdminDashboardStatsDto>> GetDashboardStats()
    {
        try
        {
            var stats = new AdminDashboardStatsDto
            {
                TotalStudents = await _context.Users.CountAsync(u => u.Role == "student"),
                TotalRecruiters = await _context.Users.CountAsync(u => u.Role == "recruiter"),
                TotalInternships = await _context.Internships.CountAsync(),
                ActiveInternships = await _context.Internships.CountAsync(i => i.IsActive == true),
                TotalApplications = await _context.InternshipApplications.CountAsync(),
                PendingApplications = await _context.InternshipApplications.CountAsync(a => a.Status == "pending"),
                ReviewedApplications = await _context.InternshipApplications.CountAsync(a => a.Status == "reviewed"),
                AcceptedApplications = await _context.InternshipApplications.CountAsync(a => a.Status == "accepted"),
                RejectedApplications = await _context.InternshipApplications.CountAsync(a => a.Status == "rejected"),
                CompletedApplications = await _context.InternshipApplications.CountAsync(a => a.Status == "completed"),
                TotalInternshipReviews = await _context.InternshipReviews.CountAsync(),
                TotalCourseReviews = await _context.CourseReviews.CountAsync()
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching dashboard stats");
            return StatusCode(500, new { message = "An error occurred while fetching dashboard stats" });
        }
    }

    /// <summary>
    /// Get recent activity across the platform
    /// </summary>
    [HttpGet("dashboard/recent-activity")]
    public async Task<ActionResult<List<RecentActivityDto>>> GetRecentActivity()
    {
        try
        {
            var recentUsers = await _context.Users
                .Where(u => u.Role == "student" || u.Role == "recruiter")
                .OrderByDescending(u => u.CreatedAt)
                .Take(10)
                .Select(u => new RecentActivityDto
                {
                    Type = "registration",
                    Description = $"New {u.Role} registered: {u.Name}",
                    UserName = u.Name ?? "",
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            var recentApplications = await _context.InternshipApplications
                .Include(a => a.StudentProfile).ThenInclude(sp => sp.User)
                .Include(a => a.Internship)
                .OrderByDescending(a => a.AppliedAt)
                .Take(10)
                .Select(a => new RecentActivityDto
                {
                    Type = "application",
                    Description = $"{a.StudentProfile.User.Name} applied to {a.Internship.Title}",
                    UserName = a.StudentProfile.User.Name ?? "",
                    CreatedAt = a.AppliedAt
                })
                .ToListAsync();

            var recentReviews = await _context.InternshipReviews
                .Include(r => r.Student).ThenInclude(sp => sp.User)
                .Include(r => r.Internship)
                .OrderByDescending(r => r.CreatedAt)
                .Take(10)
                .Select(r => new RecentActivityDto
                {
                    Type = "review",
                    Description = $"{r.Student.User.Name} reviewed {r.Internship.Title}",
                    UserName = r.Student.User.Name ?? "",
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            var allActivity = recentUsers
                .Concat(recentApplications)
                .Concat(recentReviews)
                .OrderByDescending(a => a.CreatedAt)
                .Take(20)
                .ToList();

            return Ok(allActivity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching recent activity");
            return StatusCode(500, new { message = "An error occurred while fetching recent activity" });
        }
    }

    #endregion

    #region User Management

    /// <summary>
    /// List users with filtering and pagination
    /// </summary>
    [HttpGet("users")]
    public async Task<ActionResult<PaginatedResponse<AdminUserListItemDto>>> GetUsers(
        [FromQuery] string? role,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var query = _context.Users
                .Include(u => u.StudentProfile).ThenInclude(sp => sp!.University)
                .Include(u => u.StudentProfile).ThenInclude(sp => sp!.Major)
                .Include(u => u.RecruiterProfile)
                .Where(u => u.Role == "student" || u.Role == "recruiter")
                .AsQueryable();

            if (!string.IsNullOrEmpty(role))
                query = query.Where(u => u.Role == role);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(u =>
                    (u.Name != null && u.Name.Contains(search)) ||
                    u.Email.Contains(search));

            var totalCount = await query.CountAsync();

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new AdminUserListItemDto
                {
                    UserId = u.UserId,
                    Email = u.Email,
                    Name = u.Name ?? "",
                    Phone = u.Phone,
                    Role = u.Role ?? "",
                    IsActive = u.IsActive ?? false,
                    EmailVerified = u.EmailVerified,
                    CreatedAt = u.CreatedAt,
                    CompanyName = u.RecruiterProfile != null ? u.RecruiterProfile.CompanyName : null,
                    UniversityName = u.StudentProfile != null && u.StudentProfile.University != null
                        ? u.StudentProfile.University.UniversityName : null,
                    MajorName = u.StudentProfile != null && u.StudentProfile.Major != null
                        ? u.StudentProfile.Major.MajorName : null
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<AdminUserListItemDto>
            {
                Items = users,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching users");
            return StatusCode(500, new { message = "An error occurred while fetching users" });
        }
    }

    /// <summary>
    /// Get user detail with full profile
    /// </summary>
    [HttpGet("users/{id}")]
    public async Task<ActionResult<AdminUserDetailDto>> GetUserDetail(int id)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.StudentProfile).ThenInclude(sp => sp!.University)
                .Include(u => u.StudentProfile).ThenInclude(sp => sp!.Major)
                .Include(u => u.RecruiterProfile)
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
                return NotFound(new { message = "User not found" });

            var dto = new AdminUserDetailDto
            {
                UserId = user.UserId,
                Email = user.Email,
                Name = user.Name,
                Phone = user.Phone,
                Role = user.Role ?? "",
                IsActive = user.IsActive ?? false,
                EmailVerified = user.EmailVerified,
                CreatedAt = user.CreatedAt
            };

            if (user.StudentProfile != null)
            {
                dto.UniversityName = user.StudentProfile.University?.UniversityName;
                dto.MajorName = user.StudentProfile.Major?.MajorName;
                dto.Gpa = user.StudentProfile.Gpa;
                dto.GraduationYear = user.StudentProfile.GraduationYear;
                dto.HasCv = !string.IsNullOrEmpty(user.StudentProfile.CvUrl);
                dto.LinkedinUrl = user.StudentProfile.LinkedinUrl;
                dto.GithubUrl = user.StudentProfile.GithubUrl;
                dto.Bio = user.StudentProfile.Bio;
            }

            if (user.RecruiterProfile != null)
            {
                dto.CompanyName = user.RecruiterProfile.CompanyName;
                dto.CompanyDescription = user.RecruiterProfile.CompanyDescription;
                dto.Website = user.RecruiterProfile.Website;
                dto.LogoUrl = user.RecruiterProfile.LogoUrl;
            }

            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user detail {UserId}", id);
            return StatusCode(500, new { message = "An error occurred while fetching user detail" });
        }
    }

    /// <summary>
    /// Toggle user active status
    /// </summary>
    [HttpPut("users/{id}/toggle-active")]
    public async Task<ActionResult> ToggleUserActive(int id)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            user.IsActive = !(user.IsActive ?? false);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} active status toggled to {IsActive} by admin {AdminId}",
                id, user.IsActive, GetCurrentUserId());

            return Ok(new { message = $"User {(user.IsActive == true ? "activated" : "deactivated")} successfully", isActive = user.IsActive });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling user active status {UserId}", id);
            return StatusCode(500, new { message = "An error occurred while updating user status" });
        }
    }

    #endregion

    #region Internship Management

    /// <summary>
    /// List all internships with filtering and pagination
    /// </summary>
    [HttpGet("internships")]
    public async Task<ActionResult<PaginatedResponse<AdminInternshipListItemDto>>> GetInternships(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var query = _context.Internships
                .Include(i => i.RecruiterProfile)
                .Include(i => i.Applications)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
                query = query.Where(i =>
                    i.Title.Contains(search) ||
                    (i.RecruiterProfile.CompanyName != null && i.RecruiterProfile.CompanyName.Contains(search)));

            if (status == "active")
                query = query.Where(i => i.IsActive == true);
            else if (status == "inactive")
                query = query.Where(i => i.IsActive == false || i.IsActive == null);

            var totalCount = await query.CountAsync();

            var internships = await query
                .OrderByDescending(i => i.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(i => new AdminInternshipListItemDto
                {
                    InternshipId = i.InternshipId,
                    Title = i.Title,
                    CompanyName = i.RecruiterProfile.CompanyName,
                    Location = i.Location,
                    IsActive = i.IsActive ?? false,
                    ApplicationsCount = i.Applications.Count,
                    Stipend = i.Stipend,
                    Deadline = i.Deadline,
                    CreatedAt = i.CreatedAt
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<AdminInternshipListItemDto>
            {
                Items = internships,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching internships for admin");
            return StatusCode(500, new { message = "An error occurred while fetching internships" });
        }
    }

    /// <summary>
    /// Toggle internship active status
    /// </summary>
    [HttpPut("internships/{id}/toggle-active")]
    public async Task<ActionResult> ToggleInternshipActive(int id)
    {
        try
        {
            var internship = await _context.Internships.FindAsync(id);
            if (internship == null)
                return NotFound(new { message = "Internship not found" });

            internship.IsActive = !(internship.IsActive ?? false);
            internship.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Internship {InternshipId} active status toggled to {IsActive} by admin {AdminId}",
                id, internship.IsActive, GetCurrentUserId());

            return Ok(new { message = $"Internship {(internship.IsActive == true ? "activated" : "deactivated")} successfully", isActive = internship.IsActive });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling internship active status {InternshipId}", id);
            return StatusCode(500, new { message = "An error occurred while updating internship status" });
        }
    }

    /// <summary>
    /// Delete an internship
    /// </summary>
    [HttpDelete("internships/{id}")]
    public async Task<ActionResult> DeleteInternship(int id)
    {
        try
        {
            var internship = await _context.Internships.FindAsync(id);
            if (internship == null)
                return NotFound(new { message = "Internship not found" });

            _context.Internships.Remove(internship);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Internship {InternshipId} deleted by admin {AdminId}", id, GetCurrentUserId());

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting internship {InternshipId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting internship" });
        }
    }

    #endregion

    #region Application Oversight

    /// <summary>
    /// List all applications with filtering and pagination
    /// </summary>
    [HttpGet("applications")]
    public async Task<ActionResult<PaginatedResponse<AdminApplicationListItemDto>>> GetApplications(
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var query = _context.InternshipApplications
                .Include(a => a.StudentProfile).ThenInclude(sp => sp.User)
                .Include(a => a.Internship).ThenInclude(i => i.RecruiterProfile)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status == status);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(a =>
                    (a.StudentProfile.User.Name != null && a.StudentProfile.User.Name.Contains(search)) ||
                    a.Internship.Title.Contains(search));

            var totalCount = await query.CountAsync();

            var applications = await query
                .OrderByDescending(a => a.AppliedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new AdminApplicationListItemDto
                {
                    ApplicationId = a.ApplicationId,
                    StudentName = a.StudentProfile.User.Name,
                    StudentEmail = a.StudentProfile.User.Email,
                    InternshipTitle = a.Internship.Title,
                    CompanyName = a.Internship.RecruiterProfile.CompanyName,
                    Status = a.Status,
                    AppliedAt = a.AppliedAt
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<AdminApplicationListItemDto>
            {
                Items = applications,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching applications for admin");
            return StatusCode(500, new { message = "An error occurred while fetching applications" });
        }
    }

    #endregion

    #region Content Moderation

    /// <summary>
    /// List all internship reviews
    /// </summary>
    [HttpGet("reviews/internship")]
    public async Task<ActionResult<PaginatedResponse<AdminInternshipReviewDto>>> GetInternshipReviews(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var query = _context.InternshipReviews
                .Include(r => r.Student).ThenInclude(sp => sp.User)
                .Include(r => r.Internship).ThenInclude(i => i.RecruiterProfile)
                .AsQueryable();

            var totalCount = await query.CountAsync();

            var reviews = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new AdminInternshipReviewDto
                {
                    ReviewId = r.ReviewId,
                    StudentName = r.Student.User.Name,
                    InternshipTitle = r.Internship.Title,
                    CompanyName = r.Internship.RecruiterProfile.CompanyName,
                    OverallRating = r.OverallRating,
                    ReviewText = r.ReviewText,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<AdminInternshipReviewDto>
            {
                Items = reviews,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching internship reviews for admin");
            return StatusCode(500, new { message = "An error occurred while fetching internship reviews" });
        }
    }

    /// <summary>
    /// List all course reviews
    /// </summary>
    [HttpGet("reviews/course")]
    public async Task<ActionResult<PaginatedResponse<AdminCourseReviewDto>>> GetCourseReviews(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var query = _context.CourseReviews
                .Include(r => r.Student).ThenInclude(sp => sp.User)
                .AsQueryable();

            var totalCount = await query.CountAsync();

            var reviews = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new AdminCourseReviewDto
                {
                    ReviewId = r.ReviewId,
                    StudentName = r.Student.User.Name,
                    CourseTitle = r.CourseTitle,
                    CourseLink = r.CourseLink,
                    Rating = r.Rating,
                    ReviewText = r.ReviewText,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<AdminCourseReviewDto>
            {
                Items = reviews,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching course reviews for admin");
            return StatusCode(500, new { message = "An error occurred while fetching course reviews" });
        }
    }

    /// <summary>
    /// Delete an internship review
    /// </summary>
    [HttpDelete("reviews/internship/{id}")]
    public async Task<ActionResult> DeleteInternshipReview(int id)
    {
        try
        {
            var review = await _context.InternshipReviews.FindAsync(id);
            if (review == null)
                return NotFound(new { message = "Review not found" });

            _context.InternshipReviews.Remove(review);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Internship review {ReviewId} deleted by admin {AdminId}", id, GetCurrentUserId());

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting internship review {ReviewId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting review" });
        }
    }

    /// <summary>
    /// Delete a course review
    /// </summary>
    [HttpDelete("reviews/course/{id}")]
    public async Task<ActionResult> DeleteCourseReview(int id)
    {
        try
        {
            var review = await _context.CourseReviews.FindAsync(id);
            if (review == null)
                return NotFound(new { message = "Review not found" });

            _context.CourseReviews.Remove(review);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Course review {ReviewId} deleted by admin {AdminId}", id, GetCurrentUserId());

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting course review {ReviewId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting review" });
        }
    }

    #endregion

    #region Helper Methods

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    #endregion
}
