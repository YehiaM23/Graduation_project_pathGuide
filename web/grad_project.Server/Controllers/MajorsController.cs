using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using grad_project.Server.Data;
using grad_project.Server.DTOs;

namespace grad_project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MajorsController : ControllerBase
{
    private readonly PathGuideContext _context;
    private readonly ILogger<MajorsController> _logger;

    public MajorsController(PathGuideContext context, ILogger<MajorsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<MajorDto>>> GetAll()
    {
        try
        {
            var majors = await _context.Majors
                .OrderBy(m => m.MajorName)
                .Select(m => new MajorDto
                {
                    MajorId = m.MajorId,
                    MajorName = m.MajorName
                })
                .ToListAsync();

            return Ok(majors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting majors");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
