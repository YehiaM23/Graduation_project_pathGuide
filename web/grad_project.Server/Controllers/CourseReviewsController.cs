using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using grad_project.Server.Data;
using grad_project.Server.DTOs;
using grad_project.Server.Models;

namespace grad_project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CourseReviewsController : ControllerBase
{
    private readonly PathGuideContext _context;
    private readonly ILogger<CourseReviewsController> _logger;

    public CourseReviewsController(PathGuideContext context, ILogger<CourseReviewsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/coursereviews?courseTitle=xxx&courseLink=xxx - Get reviews for a course
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<CourseReviewSummaryDto>> GetCourseReviews(
        [FromQuery] string courseTitle,
        [FromQuery] string? courseLink)
    {
        try
        {
            var userId = 0;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userIdClaim))
            {
                int.TryParse(userIdClaim, out userId);
            }

            var studentProfileId = 0;
            if (userId > 0)
            {
                var profile = await _context.StudentProfiles
                    .FirstOrDefaultAsync(sp => sp.UserId == userId);
                studentProfileId = profile?.StudentProfileId ?? 0;
            }

            var query = _context.CourseReviews
                .Include(cr => cr.Student)
                    .ThenInclude(s => s.User)
                .Where(cr => cr.CourseTitle == courseTitle);

            if (!string.IsNullOrEmpty(courseLink))
            {
                query = query.Where(cr => cr.CourseLink == courseLink);
            }

            var reviews = await query
                .OrderByDescending(cr => cr.CreatedAt)
                .ToListAsync();

            var reviewDtos = reviews.Select(r => new CourseReviewDto
            {
                ReviewId = r.ReviewId,
                StudentId = r.StudentId,
                StudentName = r.Student?.User?.Name ?? "Anonymous",
                Rating = r.Rating,
                ReviewText = r.ReviewText,
                CourseTitle = r.CourseTitle,
                CourseLink = r.CourseLink,
                SkillName = r.SkillName,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                IsOwnReview = r.StudentId == studentProfileId
            }).ToList();

            var summary = new CourseReviewSummaryDto
            {
                CourseTitle = courseTitle,
                CourseLink = courseLink,
                AverageRating = reviews.Count > 0 ? Math.Round(reviews.Average(r => r.Rating), 1) : 0,
                TotalReviews = reviews.Count,
                Reviews = reviewDtos
            };

            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting course reviews");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // GET: api/coursereviews/my - Get current user's reviews
    [HttpGet("my")]
    public async Task<ActionResult<List<CourseReviewDto>>> GetMyReviews()
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

            var reviews = await _context.CourseReviews
                .Where(cr => cr.StudentId == profile.StudentProfileId)
                .OrderByDescending(cr => cr.CreatedAt)
                .ToListAsync();

            var reviewDtos = reviews.Select(r => new CourseReviewDto
            {
                ReviewId = r.ReviewId,
                StudentId = r.StudentId,
                StudentName = null,
                Rating = r.Rating,
                ReviewText = r.ReviewText,
                CourseTitle = r.CourseTitle,
                CourseLink = r.CourseLink,
                SkillName = r.SkillName,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                IsOwnReview = true
            }).ToList();

            return Ok(reviewDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting my reviews");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // POST: api/coursereviews - Create a new review
    [HttpPost]
    public async Task<ActionResult<CourseReviewDto>> CreateReview([FromBody] CreateCourseReviewRequest request)
    {
        try
        {
            if (request.Rating < 1 || request.Rating > 5)
            {
                return BadRequest(new { message = "Rating must be between 1 and 5" });
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var profile = await _context.StudentProfiles
                .Include(sp => sp.User)
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (profile == null)
            {
                return NotFound(new { message = "Student profile not found" });
            }

            // Check if user already reviewed this course
            var existingReview = await _context.CourseReviews
                .FirstOrDefaultAsync(cr =>
                    cr.StudentId == profile.StudentProfileId &&
                    cr.CourseTitle == request.CourseTitle &&
                    cr.CourseLink == request.CourseLink);

            if (existingReview != null)
            {
                return BadRequest(new { message = "You have already reviewed this course" });
            }

            var review = new CourseReview
            {
                StudentId = profile.StudentProfileId,
                Rating = request.Rating,
                ReviewText = request.ReviewText,
                CourseTitle = request.CourseTitle,
                CourseLink = request.CourseLink,
                SkillName = request.SkillName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CourseReviews.Add(review);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCourseReviews),
                new { courseTitle = review.CourseTitle, courseLink = review.CourseLink },
                new CourseReviewDto
                {
                    ReviewId = review.ReviewId,
                    StudentId = review.StudentId,
                    StudentName = profile.User?.Name ?? "Anonymous",
                    Rating = review.Rating,
                    ReviewText = review.ReviewText,
                    CourseTitle = review.CourseTitle,
                    CourseLink = review.CourseLink,
                    SkillName = review.SkillName,
                    CreatedAt = review.CreatedAt,
                    UpdatedAt = review.UpdatedAt,
                    IsOwnReview = true
                });
        }
        catch (Exception ex)
        {
            var innerMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Error creating review: {Message}", innerMessage);
            return StatusCode(500, new { message = $"An error occurred: {innerMessage}" });
        }
    }

    // PUT: api/coursereviews/{id} - Update a review
    [HttpPut("{id}")]
    public async Task<ActionResult<CourseReviewDto>> UpdateReview(int id, [FromBody] UpdateCourseReviewRequest request)
    {
        try
        {
            if (request.Rating < 1 || request.Rating > 5)
            {
                return BadRequest(new { message = "Rating must be between 1 and 5" });
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var profile = await _context.StudentProfiles
                .Include(sp => sp.User)
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (profile == null)
            {
                return NotFound(new { message = "Student profile not found" });
            }

            var review = await _context.CourseReviews
                .FirstOrDefaultAsync(cr => cr.ReviewId == id && cr.StudentId == profile.StudentProfileId);

            if (review == null)
            {
                return NotFound(new { message = "Review not found" });
            }

            review.Rating = request.Rating;
            review.ReviewText = request.ReviewText;
            review.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new CourseReviewDto
            {
                ReviewId = review.ReviewId,
                StudentId = review.StudentId,
                StudentName = profile.User?.Name ?? "Anonymous",
                Rating = review.Rating,
                ReviewText = review.ReviewText,
                CourseTitle = review.CourseTitle,
                CourseLink = review.CourseLink,
                SkillName = review.SkillName,
                CreatedAt = review.CreatedAt,
                UpdatedAt = review.UpdatedAt,
                IsOwnReview = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating review");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // DELETE: api/coursereviews/{id} - Delete a review
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteReview(int id)
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

            var review = await _context.CourseReviews
                .FirstOrDefaultAsync(cr => cr.ReviewId == id && cr.StudentId == profile.StudentProfileId);

            if (review == null)
            {
                return NotFound(new { message = "Review not found" });
            }

            _context.CourseReviews.Remove(review);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Review deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting review");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
