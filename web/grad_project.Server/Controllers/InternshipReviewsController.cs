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
public class InternshipReviewsController : ControllerBase
{
    private readonly PathGuideContext _context;
    private readonly ILogger<InternshipReviewsController> _logger;

    public InternshipReviewsController(PathGuideContext context, ILogger<InternshipReviewsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/internshipreviews/internship/{internshipId} - Get all reviews for an internship
    [HttpGet("internship/{internshipId}")]
    [AllowAnonymous]
    public async Task<ActionResult<InternshipReviewSummaryDto>> GetInternshipReviews(int internshipId)
    {
        try
        {
            // Get current user's student profile ID if authenticated
            var studentProfileId = 0;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId))
            {
                var profile = await _context.StudentProfiles
                    .FirstOrDefaultAsync(sp => sp.UserId == userId);
                studentProfileId = profile?.StudentProfileId ?? 0;
            }

            // Get internship details
            var internship = await _context.Internships
                .Include(i => i.RecruiterProfile)
                .FirstOrDefaultAsync(i => i.InternshipId == internshipId);

            if (internship == null)
            {
                return NotFound(new { message = "Internship not found" });
            }

            // Get all reviews for this internship
            var reviews = await _context.InternshipReviews
                .Include(ir => ir.Student)
                    .ThenInclude(s => s.User)
                .Where(ir => ir.InternshipId == internshipId)
                .OrderByDescending(ir => ir.CreatedAt)
                .ToListAsync();

            var reviewDtos = reviews.Select(r => new InternshipReviewDto
            {
                ReviewId = r.ReviewId,
                ApplicationId = r.ApplicationId,
                StudentId = r.StudentProfileId,
                StudentName = r.Student?.User?.Name ?? "Anonymous",
                InternshipId = r.InternshipId,
                InternshipTitle = internship.Title,
                CompanyName = internship.RecruiterProfile?.CompanyName,
                OverallRating = r.OverallRating,
                ReviewText = r.ReviewText,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                IsOwnReview = r.StudentProfileId == studentProfileId
            }).ToList();

            var summary = new InternshipReviewSummaryDto
            {
                InternshipId = internshipId,
                InternshipTitle = internship.Title,
                CompanyName = internship.RecruiterProfile?.CompanyName,
                AverageOverallRating = reviews.Count > 0 ? Math.Round(reviews.Average(r => r.OverallRating), 1) : 0,
                TotalReviews = reviews.Count,
                Reviews = reviewDtos
            };

            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting internship reviews for internship {InternshipId}", internshipId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // GET: api/internshipreviews/my - Get current user's reviews
    [HttpGet("my")]
    public async Task<ActionResult<List<InternshipReviewDto>>> GetMyReviews()
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

            var reviews = await _context.InternshipReviews
                .Include(ir => ir.Internship)
                    .ThenInclude(i => i.RecruiterProfile)
                .Where(ir => ir.StudentProfileId == profile.StudentProfileId)
                .OrderByDescending(ir => ir.CreatedAt)
                .ToListAsync();

            var reviewDtos = reviews.Select(r => new InternshipReviewDto
            {
                ReviewId = r.ReviewId,
                ApplicationId = r.ApplicationId,
                StudentId = r.StudentProfileId,
                StudentName = null,
                InternshipId = r.InternshipId,
                InternshipTitle = r.Internship?.Title,
                CompanyName = r.Internship?.RecruiterProfile?.CompanyName,
                OverallRating = r.OverallRating,
                ReviewText = r.ReviewText,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                IsOwnReview = true
            }).ToList();

            return Ok(reviewDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting my internship reviews");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // GET: api/internshipreviews/check/{applicationId} - Check if review exists for application
    [HttpGet("check/{applicationId}")]
    public async Task<ActionResult<InternshipReviewCheckDto>> CheckReviewExists(int applicationId)
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

            var review = await _context.InternshipReviews
                .FirstOrDefaultAsync(ir => ir.ApplicationId == applicationId && ir.StudentProfileId == profile.StudentProfileId);

            return Ok(new InternshipReviewCheckDto
            {
                Exists = review != null,
                ReviewId = review?.ReviewId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking review exists for application {ApplicationId}", applicationId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // POST: api/internshipreviews - Create a new review
    [HttpPost]
    public async Task<ActionResult<InternshipReviewDto>> CreateReview([FromBody] CreateInternshipReviewDto request)
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

            // Get the application and verify it belongs to the student and is completed
            var application = await _context.InternshipApplications
                .Include(a => a.Internship)
                    .ThenInclude(i => i.RecruiterProfile)
                .FirstOrDefaultAsync(a => a.ApplicationId == request.ApplicationId);

            if (application == null)
            {
                return NotFound(new { message = "Application not found" });
            }

            if (application.StudentId != profile.StudentProfileId)
            {
                return Forbid();
            }

            if (application.Status.ToLower() != "completed")
            {
                return BadRequest(new { message = "You can only review completed internships" });
            }

            // Check if review already exists
            var existingReview = await _context.InternshipReviews
                .FirstOrDefaultAsync(ir => ir.ApplicationId == request.ApplicationId);

            if (existingReview != null)
            {
                return BadRequest(new { message = "You have already reviewed this internship" });
            }

            var review = new InternshipReview
            {
                ApplicationId = request.ApplicationId,
                StudentProfileId = profile.StudentProfileId,
                InternshipId = application.InternshipId,
                OverallRating = request.OverallRating,
                ReviewText = request.ReviewText,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.InternshipReviews.Add(review);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInternshipReviews),
                new { internshipId = review.InternshipId },
                new InternshipReviewDto
                {
                    ReviewId = review.ReviewId,
                    ApplicationId = review.ApplicationId,
                    StudentId = review.StudentProfileId,
                    StudentName = profile.User?.Name ?? "Anonymous",
                    InternshipId = review.InternshipId,
                    InternshipTitle = application.Internship?.Title,
                    CompanyName = application.Internship?.RecruiterProfile?.CompanyName,
                    OverallRating = review.OverallRating,
                    ReviewText = review.ReviewText,
                    CreatedAt = review.CreatedAt,
                    UpdatedAt = review.UpdatedAt,
                    IsOwnReview = true
                });
        }
        catch (Exception ex)
        {
            var innerMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Error creating internship review: {Message}", innerMessage);
            return StatusCode(500, new { message = $"An error occurred: {innerMessage}" });
        }
    }

    // PUT: api/internshipreviews/{id} - Update a review
    [HttpPut("{id}")]
    public async Task<ActionResult<InternshipReviewDto>> UpdateReview(int id, [FromBody] UpdateInternshipReviewDto request)
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

            var review = await _context.InternshipReviews
                .Include(ir => ir.Internship)
                    .ThenInclude(i => i.RecruiterProfile)
                .FirstOrDefaultAsync(ir => ir.ReviewId == id && ir.StudentProfileId == profile.StudentProfileId);

            if (review == null)
            {
                return NotFound(new { message = "Review not found" });
            }

            review.OverallRating = request.OverallRating;
            review.ReviewText = request.ReviewText;
            review.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new InternshipReviewDto
            {
                ReviewId = review.ReviewId,
                ApplicationId = review.ApplicationId,
                StudentId = review.StudentProfileId,
                StudentName = profile.User?.Name ?? "Anonymous",
                InternshipId = review.InternshipId,
                InternshipTitle = review.Internship?.Title,
                CompanyName = review.Internship?.RecruiterProfile?.CompanyName,
                OverallRating = review.OverallRating,
                ReviewText = review.ReviewText,
                CreatedAt = review.CreatedAt,
                UpdatedAt = review.UpdatedAt,
                IsOwnReview = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating internship review {ReviewId}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // DELETE: api/internshipreviews/{id} - Delete a review
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

            var review = await _context.InternshipReviews
                .FirstOrDefaultAsync(ir => ir.ReviewId == id && ir.StudentProfileId == profile.StudentProfileId);

            if (review == null)
            {
                return NotFound(new { message = "Review not found" });
            }

            _context.InternshipReviews.Remove(review);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Review deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting internship review {ReviewId}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
