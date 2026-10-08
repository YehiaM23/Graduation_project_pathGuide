using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace grad_project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class TestEmailController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<TestEmailController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public TestEmailController(
        IConfiguration configuration,
        ILogger<TestEmailController> logger,
        IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public class SendTestEmailDto
    {
        public string To { get; set; } = "";
        public string? FromEmail { get; set; }
        public string? FromName { get; set; }
        public string Subject { get; set; } = "";
        public string HtmlContent { get; set; } = "";
    }

    [HttpPost("send")]
    public async Task<IActionResult> Send([FromBody] SendTestEmailDto dto)
    {
        var apiKey = _configuration["Brevo:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return BadRequest(new { success = false, message = "Brevo:ApiKey is not configured." });
        }
        if (string.IsNullOrWhiteSpace(dto.To))
        {
            return BadRequest(new { success = false, message = "Recipient (to) is required." });
        }

        var fromEmail = string.IsNullOrWhiteSpace(dto.FromEmail) ? _configuration["Brevo:FromEmail"] : dto.FromEmail;
        var fromName = string.IsNullOrWhiteSpace(dto.FromName) ? _configuration["Brevo:FromName"] : dto.FromName;
        var apiUrl = _configuration["Brevo:ApiUrl"] ?? "https://api.brevo.com/v3/smtp/email";

        var payload = new
        {
            sender = new { name = fromName, email = fromEmail },
            to = new[] { new { email = dto.To } },
            subject = string.IsNullOrWhiteSpace(dto.Subject) ? "Brevo Test Email - PathGuide" : dto.Subject,
            htmlContent = string.IsNullOrWhiteSpace(dto.HtmlContent)
                ? "<html><body><h2>Brevo test email</h2><p>If you received this, the Brevo integration works.</p></body></html>"
                : dto.HtmlContent
        };

        try
        {
            var client = _httpClientFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Post, apiUrl);
            request.Headers.Add("api-key", apiKey);
            request.Headers.Add("accept", "application/json");
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Brevo test email sent to {To}. Response: {Body}", dto.To, body);
                return Ok(new { success = true, status = (int)response.StatusCode, message = "Email accepted by Brevo.", brevoResponse = body });
            }

            _logger.LogError("Brevo test email failed. Status: {Status}, Body: {Body}", response.StatusCode, body);
            return StatusCode((int)response.StatusCode, new { success = false, status = (int)response.StatusCode, message = "Brevo rejected the request.", brevoResponse = body });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending Brevo test email to {To}", dto.To);
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}
