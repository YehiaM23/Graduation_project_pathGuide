using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using grad_project.Server.Data;
using grad_project.Server.DTOs;

namespace grad_project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InterestsController : ControllerBase
{
    private readonly PathGuideContext _context;
    private readonly ILogger<InterestsController> _logger;

    public InterestsController(PathGuideContext context, ILogger<InterestsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<InterestDto>>> GetAll()
    {
        try
        {
            var interests = await _context.Interests
                .OrderBy(i => i.InterestName)
                .Select(i => new InterestDto
                {
                    InterestId = i.InterestId,
                    InterestName = i.InterestName
                })
                .ToListAsync();

            return Ok(interests);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting interests");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
