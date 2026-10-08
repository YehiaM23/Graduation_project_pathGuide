using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace grad_project.Server.Controllers
{
    [Route("api/career-planner")]
    [ApiController]
    public class CareerPlannerController : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<CareerPlannerController> _logger;
        private readonly string _careerPlannerUrl;

        public CareerPlannerController(IHttpClientFactory httpClientFactory, ILogger<CareerPlannerController> logger, IConfiguration configuration)
        {
            _httpClient = httpClientFactory.CreateClient();
            _careerPlannerUrl = configuration["AppSettings:CareerPlannerUrl"] ?? "http://localhost:8000";
            _httpClient.BaseAddress = new Uri(_careerPlannerUrl);
            _logger = logger;
        }

        [HttpGet("debug")]
        public async Task<IActionResult> Debug()
        {
            try
            {
                var response = await _httpClient.GetAsync("/health");
                var content = await response.Content.ReadAsStringAsync();
                return Ok(new {
                    success = true,
                    baseUrl = _careerPlannerUrl,
                    statusCode = (int)response.StatusCode,
                    response = content
                });
            }
            catch (Exception ex)
            {
                return Ok(new {
                    success = false,
                    baseUrl = _careerPlannerUrl,
                    error = ex.Message,
                    innerError = ex.InnerException?.Message,
                    exceptionType = ex.GetType().Name
                });
            }
        }

        [HttpGet("health")]
        public async Task<IActionResult> HealthCheck()
        {
            try
            {
                var response = await _httpClient.GetAsync("/health");
                var content = await response.Content.ReadAsStringAsync();
                return Content(content, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error connecting to Career Planner service");
                return StatusCode(503, new { error = "Career Planner service is not available. Please make sure the service is running.", details = ex.Message });
            }
        }

        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            try
            {
                var response = await _httpClient.GetAsync("/roles");
                var content = await response.Content.ReadAsStringAsync();
                return Content(content, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching roles from Career Planner service");
                return StatusCode(503, new { error = "Career Planner service is not available" });
            }
        }

        [HttpGet("skills")]
        public async Task<IActionResult> GetSkills()
        {
            try
            {
                var response = await _httpClient.GetAsync("/skills");
                var content = await response.Content.ReadAsStringAsync();
                return Content(content, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching skills from Career Planner service");
                return StatusCode(503, new { error = "Career Planner service is not available" });
            }
        }

        [HttpPost("plan")]
        public async Task<IActionResult> CreatePlan([FromBody] JsonElement requestBody)
        {
            try
            {
                var jsonContent = new StringContent(
                    requestBody.GetRawText(),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync("/plan", jsonContent);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, content);
                }

                return Content(content, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating plan from Career Planner service");
                return StatusCode(503, new {
                    error = "Career Planner service is not available",
                    details = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        [HttpPost("recommend")]
        public async Task<IActionResult> Recommend([FromBody] JsonElement requestBody)
        {
            try
            {
                var jsonContent = new StringContent(
                    requestBody.GetRawText(),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync("/recommend", jsonContent);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, content);
                }

                return Content(content, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recommendations from Career Planner service");
                return StatusCode(503, new {
                    error = "Career Planner service is not available",
                    details = ex.Message
                });
            }
        }
    }
}
