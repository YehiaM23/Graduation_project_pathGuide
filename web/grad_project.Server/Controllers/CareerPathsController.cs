using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using grad_project.Server.Data;
using grad_project.Server.DTOs;

namespace grad_project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CareerPathsController : ControllerBase
{
    private readonly PathGuideContext _context;
    private readonly ILogger<CareerPathsController> _logger;

    public CareerPathsController(PathGuideContext context, ILogger<CareerPathsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<CareerPathDto>>> GetAll()
    {
        try
        {
            var careerPaths = await _context.CareerPaths
                .OrderBy(cp => cp.CareerPathName)
                .Select(cp => new CareerPathDto
                {
                    CareerPathId = cp.CareerPathId,
                    CareerPathName = cp.CareerPathName
                })
                .ToListAsync();

            return Ok(careerPaths);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting career paths");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
