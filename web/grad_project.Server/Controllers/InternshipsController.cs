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
public class InternshipsController : ControllerBase
{
    private readonly PathGuideContext _context;
    private readonly ILogger<InternshipsController> _logger;

    public InternshipsController(PathGuideContext context, ILogger<InternshipsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/internships - Get all active internships (public)
    [HttpGet]
    public async Task<ActionResult<List<InternshipDto>>> GetInternships([FromQuery] bool? isActive = true)
    {
        try
        {
            var query = _context.Internships
                .Include(i => i.RecruiterProfile)
                .Include(i => i.Skill)
                .Include(i => i.Applications)
                .AsQueryable();

            if (isActive.HasValue)
            {
                query = query.Where(i => i.IsActive == isActive.Value);
            }

            var internships = await query
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return Ok(internships.Select(MapToDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting internships");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // GET: api/internships/{id} - Get internship by ID (public)
    [HttpGet("{id}")]
    public async Task<ActionResult<InternshipDto>> GetInternship(int id)
    {
        try
        {
            var internship = await _context.Internships
                .Include(i => i.RecruiterProfile)
                .Include(i => i.Skill)
                .Include(i => i.Applications)
                .FirstOrDefaultAsync(i => i.InternshipId == id);

            if (internship == null)
            {
                return NotFound(new { message = "Internship not found" });
            }

            return Ok(MapToDto(internship));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting internship");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // GET: api/internships/recruiter - Get internships for current recruiter
    [HttpGet("recruiter")]
    [Authorize]
    public async Task<ActionResult<List<InternshipDto>>> GetRecruiterInternships()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var recruiterProfile = await _context.RecruiterProfiles
                .FirstOrDefaultAsync(rp => rp.UserId == userId);

            if (recruiterProfile == null)
            {
                return NotFound(new { message = "Recruiter profile not found" });
            }

            var internships = await _context.Internships
                .Include(i => i.RecruiterProfile)
                .Include(i => i.Skill)
                .Include(i => i.Applications)
                .Where(i => i.RecruiterProfileId == recruiterProfile.RecruiterProfileId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return Ok(internships.Select(MapToDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recruiter internships");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // POST: api/internships - Create new internship (recruiter only)
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<InternshipDto>> CreateInternship([FromBody] CreateInternshipDto dto)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var recruiterProfile = await _context.RecruiterProfiles
                .FirstOrDefaultAsync(rp => rp.UserId == userId);

            if (recruiterProfile == null)
            {
                return BadRequest(new { message = "Only recruiters can create internships" });
            }

            var internship = new Internship
            {
                RecruiterProfileId = recruiterProfile.RecruiterProfileId,
                Title = dto.Title,
                Description = dto.Description,
                Location = dto.Location,
                StartDate = dto.StartDate,
                PeriodInWeeks = dto.PeriodInWeeks,
                Deadline = dto.Deadline,
                SkillId = dto.SkillId,
                Stipend = dto.Stipend,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Internships.Add(internship);
            await _context.SaveChangesAsync();

            // Reload with relationships
            internship = await _context.Internships
                .Include(i => i.RecruiterProfile)
                .Include(i => i.Skill)
                .FirstOrDefaultAsync(i => i.InternshipId == internship.InternshipId);

            return CreatedAtAction(nameof(GetInternship), new { id = internship!.InternshipId }, MapToDto(internship));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating internship: {Message}", ex.InnerException?.Message ?? ex.Message);
            return StatusCode(500, new { message = $"An error occurred: {ex.InnerException?.Message ?? ex.Message}" });
        }
    }

    // PUT: api/internships/{id} - Update internship (recruiter only)
    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<InternshipDto>> UpdateInternship(int id, [FromBody] UpdateInternshipDto dto)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var recruiterProfile = await _context.RecruiterProfiles
                .FirstOrDefaultAsync(rp => rp.UserId == userId);

            if (recruiterProfile == null)
            {
                return BadRequest(new { message = "Only recruiters can update internships" });
            }

            var internship = await _context.Internships
                .FirstOrDefaultAsync(i => i.InternshipId == id && i.RecruiterProfileId == recruiterProfile.RecruiterProfileId);

            if (internship == null)
            {
                return NotFound(new { message = "Internship not found or you don't have permission to update it" });
            }

            // Update fields
            if (!string.IsNullOrEmpty(dto.Title))
                internship.Title = dto.Title;
            if (dto.Description != null)
                internship.Description = dto.Description;
            if (dto.Location != null)
                internship.Location = dto.Location;
            if (dto.StartDate.HasValue)
                internship.StartDate = dto.StartDate;
            if (dto.PeriodInWeeks.HasValue)
                internship.PeriodInWeeks = dto.PeriodInWeeks;
            if (dto.Deadline.HasValue)
                internship.Deadline = dto.Deadline;
            if (dto.SkillId.HasValue)
                internship.SkillId = dto.SkillId;
            if (dto.Stipend.HasValue)
                internship.Stipend = dto.Stipend;
            if (dto.IsActive.HasValue)
                internship.IsActive = dto.IsActive;

            internship.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Reload with relationships
            internship = await _context.Internships
                .Include(i => i.RecruiterProfile)
                .Include(i => i.Skill)
                .Include(i => i.Applications)
                .FirstOrDefaultAsync(i => i.InternshipId == id);

            return Ok(MapToDto(internship!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating internship");
            return StatusCode(500, new { message = $"An error occurred: {ex.Message}" });
        }
    }

    // DELETE: api/internships/{id} - Delete internship (recruiter only)
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> DeleteInternship(int id)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var recruiterProfile = await _context.RecruiterProfiles
                .FirstOrDefaultAsync(rp => rp.UserId == userId);

            if (recruiterProfile == null)
            {
                return BadRequest(new { message = "Only recruiters can delete internships" });
            }

            var internship = await _context.Internships
                .FirstOrDefaultAsync(i => i.InternshipId == id && i.RecruiterProfileId == recruiterProfile.RecruiterProfileId);

            if (internship == null)
            {
                return NotFound(new { message = "Internship not found or you don't have permission to delete it" });
            }

            _context.Internships.Remove(internship);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Internship deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting internship");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    private static InternshipDto MapToDto(Internship internship)
    {
        return new InternshipDto
        {
            InternshipId = internship.InternshipId,
            RecruiterProfileId = internship.RecruiterProfileId,
            CompanyName = internship.RecruiterProfile?.CompanyName,
            CompanyLogo = internship.RecruiterProfile?.LogoUrl,
            Title = internship.Title,
            Description = internship.Description,
            Location = internship.Location,
            StartDate = internship.StartDate,
            PeriodInWeeks = internship.PeriodInWeeks,
            Deadline = internship.Deadline,
            SkillId = internship.SkillId,
            RequiredSkill = internship.Skill != null ? new SkillDto
            {
                SkillId = internship.Skill.SkillId,
                SkillName = internship.Skill.SkillName,
                Category = internship.Skill.Category
            } : null,
            Stipend = internship.Stipend,
            IsActive = internship.IsActive ?? true,
            ApplicationsCount = internship.Applications?.Count ?? 0,
            CreatedAt = internship.CreatedAt
        };
    }
}
