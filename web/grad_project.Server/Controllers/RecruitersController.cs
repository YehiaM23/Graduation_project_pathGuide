using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using grad_project.Server.Data;
using grad_project.Server.DTOs;

namespace grad_project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RecruitersController : ControllerBase
{
    private readonly PathGuideContext _context;
    private readonly ILogger<RecruitersController> _logger;

    public RecruitersController(PathGuideContext context, ILogger<RecruitersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("profile")]
    public async Task<ActionResult<RecruiterProfileDto>> GetMyProfile()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var profile = await _context.RecruiterProfiles
                .Include(rp => rp.User)
                .FirstOrDefaultAsync(rp => rp.UserId == userId);

            if (profile == null)
            {
                return NotFound(new { message = "Recruiter profile not found" });
            }

            return Ok(new RecruiterProfileDto
            {
                RecruiterProfileId = profile.RecruiterProfileId,
                UserId = profile.UserId,
                UserName = profile.User?.Name,
                UserEmail = profile.User?.Email,
                CompanyName = profile.CompanyName,
                Email = profile.Email,
                CompanyDescription = profile.CompanyDescription,
                LogoUrl = profile.LogoUrl,
                Website = profile.Website,
                CreatedAt = profile.CreatedAt,
                UpdatedAt = profile.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recruiter profile");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<RecruiterProfileDto>> GetProfile(int id)
    {
        try
        {
            var profile = await _context.RecruiterProfiles
                .Include(rp => rp.User)
                .FirstOrDefaultAsync(rp => rp.RecruiterProfileId == id);

            if (profile == null)
            {
                return NotFound(new { message = "Recruiter profile not found" });
            }

            return Ok(new RecruiterProfileDto
            {
                RecruiterProfileId = profile.RecruiterProfileId,
                UserId = profile.UserId,
                UserName = profile.User?.Name,
                UserEmail = profile.User?.Email,
                CompanyName = profile.CompanyName,
                Email = profile.Email,
                CompanyDescription = profile.CompanyDescription,
                LogoUrl = profile.LogoUrl,
                Website = profile.Website,
                CreatedAt = profile.CreatedAt,
                UpdatedAt = profile.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recruiter profile");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    [HttpPut("profile")]
    public async Task<ActionResult<RecruiterProfileDto>> UpdateProfile([FromBody] UpdateRecruiterProfileDto dto)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var profile = await _context.RecruiterProfiles
                .Include(rp => rp.User)
                .FirstOrDefaultAsync(rp => rp.UserId == userId);

            if (profile == null)
            {
                return NotFound(new { message = "Recruiter profile not found" });
            }

            // Update profile fields
            if (dto.CompanyName != null)
                profile.CompanyName = dto.CompanyName;
            if (dto.CompanyDescription != null)
                profile.CompanyDescription = dto.CompanyDescription;
            if (dto.LogoUrl != null)
                profile.LogoUrl = dto.LogoUrl;
            if (dto.Website != null)
                profile.Website = dto.Website;

            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new RecruiterProfileDto
            {
                RecruiterProfileId = profile.RecruiterProfileId,
                UserId = profile.UserId,
                UserName = profile.User?.Name,
                UserEmail = profile.User?.Email,
                CompanyName = profile.CompanyName,
                Email = profile.Email,
                CompanyDescription = profile.CompanyDescription,
                LogoUrl = profile.LogoUrl,
                Website = profile.Website,
                CreatedAt = profile.CreatedAt,
                UpdatedAt = profile.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating recruiter profile");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<RecruiterProfileDto>>> GetAllRecruiters()
    {
        try
        {
            var recruiters = await _context.RecruiterProfiles
                .Include(rp => rp.User)
                .Where(rp => rp.User != null && rp.User.IsActive == true)
                .Select(rp => new RecruiterProfileDto
                {
                    RecruiterProfileId = rp.RecruiterProfileId,
                    UserId = rp.UserId,
                    UserName = rp.User!.Name,
                    CompanyName = rp.CompanyName,
                    CompanyDescription = rp.CompanyDescription,
                    LogoUrl = rp.LogoUrl,
                    Website = rp.Website
                })
                .ToListAsync();

            return Ok(recruiters);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recruiters");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
