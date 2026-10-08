using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using grad_project.Server.Data;
using grad_project.Server.DTOs;

namespace grad_project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UniversitiesController : ControllerBase
{
    private readonly PathGuideContext _context;
    private readonly ILogger<UniversitiesController> _logger;

    public UniversitiesController(PathGuideContext context, ILogger<UniversitiesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<UniversityDto>>> GetAll()
    {
        try
        {
            var universities = await _context.Universities
                .OrderBy(u => u.UniversityName)
                .Select(u => new UniversityDto
                {
                    UniversityId = u.UniversityId,
                    UniversityName = u.UniversityName
                })
                .ToListAsync();

            return Ok(universities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting universities");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
