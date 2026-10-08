using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using grad_project.Server.Data;
using grad_project.Server.DTOs;

namespace grad_project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SkillsController : ControllerBase
{
    private readonly PathGuideContext _context;
    private readonly ILogger<SkillsController> _logger;

    public SkillsController(PathGuideContext context, ILogger<SkillsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<SkillDto>>> GetAll()
    {
        try
        {
            var skills = await _context.Skills
                .Where(s => s.IsActive == true)
                .OrderBy(s => s.Category)
                .ThenBy(s => s.SkillName)
                .Select(s => new SkillDto
                {
                    SkillId = s.SkillId,
                    SkillName = s.SkillName,
                    Category = s.Category
                })
                .ToListAsync();

            return Ok(skills);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting skills");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<string>>> GetCategories()
    {
        try
        {
            var categories = await _context.Skills
                .Where(s => s.IsActive == true && s.Category != null)
                .Select(s => s.Category!)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting skill categories");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    [HttpGet("by-category/{category}")]
    public async Task<ActionResult<List<SkillDto>>> GetByCategory(string category)
    {
        try
        {
            var skills = await _context.Skills
                .Where(s => s.IsActive == true && s.Category == category)
                .OrderBy(s => s.SkillName)
                .Select(s => new SkillDto
                {
                    SkillId = s.SkillId,
                    SkillName = s.SkillName,
                    Category = s.Category
                })
                .ToListAsync();

            return Ok(skills);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting skills by category");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
