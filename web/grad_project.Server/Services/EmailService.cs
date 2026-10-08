using System.Text;
using System.Text.Json;

namespace grad_project.Server.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger, IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<bool> SendVerificationEmailAsync(string email, string name, string verificationToken)
    {
        var frontendUrl = _configuration["AppSettings:FrontendUrl"];
        var verificationLink = $"{frontendUrl}/auth/verify-email?token={verificationToken}";

        var subject = "Verify Your Email - PathGuide";
        var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #0f766e; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .button {{ display: inline-block; background-color: #0f766e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Welcome to PathGuide!</h1>
                    </div>
                    <div class='content'>
                        <p>Hi {name},</p>
                        <p>Thank you for registering with PathGuide! Please verify your email address by clicking the button below:</p>
                        <p style='text-align: center;'>
                            <a href='{verificationLink}' style='display: inline-block; background-color: #0f766e; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600;'>Verify Email</a>
                        </p>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style='word-break: break-all; color: #0f766e;'>{verificationLink}</p>
                        <p>This link will expire in 24 hours.</p>
                        <p>If you didn't create an account with PathGuide, you can safely ignore this email.</p>
                    </div>
                    <div class='footer'>
                        <p>&copy; 2025 PathGuide. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

        var plainTextContent = $@"
            Hi {name},

            Thank you for registering with PathGuide! Please verify your email address by clicking the link below:

            {verificationLink}

            This link will expire in 24 hours.

            If you didn't create an account with PathGuide, you can safely ignore this email.

            - The PathGuide Team";

        return await SendEmailAsync(email, name, subject, plainTextContent, htmlContent);
    }

    public async Task<bool> SendPasswordResetEmailAsync(string email, string name, string resetToken)
    {
        var frontendUrl = _configuration["AppSettings:FrontendUrl"];
        var resetLink = $"{frontendUrl}/auth/reset-password?token={resetToken}";

        var subject = "Reset Your Password - PathGuide";
        var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #0f766e; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .button {{ display: inline-block; background-color: #0f766e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Password Reset</h1>
                    </div>
                    <div class='content'>
                        <p>Hi {name},</p>
                        <p>We received a request to reset your password. Click the button below to set a new password:</p>
                        <p style='text-align: center;'>
                            <a href='{resetLink}' style='display: inline-block; background-color: #0f766e; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600;'>Reset Password</a>
                        </p>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style='word-break: break-all; color: #0f766e;'>{resetLink}</p>
                        <p>This link will expire in 1 hour.</p>
                        <p>If you didn't request a password reset, you can safely ignore this email.</p>
                    </div>
                    <div class='footer'>
                        <p>&copy; 2025 PathGuide. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

        var plainTextContent = $@"
            Hi {name},

            We received a request to reset your password. Click the link below to set a new password:

            {resetLink}

            This link will expire in 1 hour.

            If you didn't request a password reset, you can safely ignore this email.

            - The PathGuide Team";

        return await SendEmailAsync(email, name, subject, plainTextContent, htmlContent);
    }

    public async Task<bool> SendWelcomeEmailAsync(string email, string name)
    {
        var frontendUrl = _configuration["AppSettings:FrontendUrl"];

        var subject = "Welcome to PathGuide!";
        var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #0f766e; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .button {{ display: inline-block; background-color: #0f766e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Welcome to PathGuide!</h1>
                    </div>
                    <div class='content'>
                        <p>Hi {name},</p>
                        <p>Your email has been verified and your account is now active!</p>
                        <p>You can now:</p>
                        <ul>
                            <li>Complete your profile</li>
                            <li>Add your skills and interests</li>
                            <li>Discover personalized career paths</li>
                            <li>Find internship opportunities</li>
                        </ul>
                        <p style='text-align: center;'>
                            <a href='{frontendUrl}/dashboard' style='display: inline-block; background-color: #0f766e; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600;'>Go to Dashboard</a>
                        </p>
                    </div>
                    <div class='footer'>
                        <p>&copy; 2025 PathGuide. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

        var plainTextContent = $@"
            Hi {name},

            Your email has been verified and your account is now active!

            You can now complete your profile, add your skills and interests, and discover personalized career paths.

            Visit your dashboard: {frontendUrl}/dashboard

            - The PathGuide Team";

        return await SendEmailAsync(email, name, subject, plainTextContent, htmlContent);
    }

    public async Task<bool> SendApplicationConfirmationAsync(string email, string name, string internshipTitle, string companyName)
    {
        var frontendUrl = _configuration["AppSettings:FrontendUrl"];

        var subject = $"Application Submitted - {internshipTitle}";
        var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #0f766e; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Application Submitted!</h1>
                    </div>
                    <div class='content'>
                        <p>Hi {name},</p>
                        <p>Your application for <strong>{internshipTitle}</strong> at <strong>{companyName}</strong> has been submitted successfully!</p>
                        <p>What happens next:</p>
                        <ul>
                            <li>The recruiter will review your application</li>
                            <li>You'll receive an email when your application status changes</li>
                            <li>You can track your application status in your dashboard</li>
                        </ul>
                        <p style='text-align: center;'>
                            <a href='{frontendUrl}/dashboard/student/applications' style='display: inline-block; background-color: #0f766e; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600;'>View My Applications</a>
                        </p>
                        <p>Good luck!</p>
                    </div>
                    <div class='footer'>
                        <p>&copy; 2025 PathGuide. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

        var plainTextContent = $@"
            Hi {name},

            Your application for {internshipTitle} at {companyName} has been submitted successfully!

            What happens next:
            - The recruiter will review your application
            - You'll receive an email when your application status changes
            - You can track your application status in your dashboard

            View your applications: {frontendUrl}/dashboard/student/applications

            Good luck!

            - The PathGuide Team";

        return await SendEmailAsync(email, name, subject, plainTextContent, htmlContent);
    }

    public async Task<bool> SendApplicationStatusUpdateAsync(string email, string name, string internshipTitle, string status)
    {
        var frontendUrl = _configuration["AppSettings:FrontendUrl"];
        var statusText = status switch
        {
            "accepted" => "Congratulations! Your application has been accepted!",
            "rejected" => "Unfortunately, your application was not selected.",
            "reviewed" => "Your application has been reviewed by the recruiter.",
            _ => $"Your application status has been updated to: {status}"
        };

        var subject = $"Application Update - {internshipTitle}";
        var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #0f766e; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .status {{ padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; font-weight: 600; }}
                    .status.accepted {{ background-color: #d1fae5; color: #065f46; }}
                    .status.rejected {{ background-color: #fee2e2; color: #991b1b; }}
                    .status.reviewed {{ background-color: #fef3c7; color: #92400e; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Application Update</h1>
                    </div>
                    <div class='content'>
                        <p>Hi {name},</p>
                        <p>There's an update on your application for <strong>{internshipTitle}</strong>:</p>
                        <div class='status {status}'>
                            {statusText}
                        </div>
                        <p style='text-align: center;'>
                            <a href='{frontendUrl}/dashboard/student/applications' style='display: inline-block; background-color: #0f766e; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600;'>View Application Details</a>
                        </p>
                    </div>
                    <div class='footer'>
                        <p>&copy; 2025 PathGuide. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

        var plainTextContent = $@"
            Hi {name},

            There's an update on your application for {internshipTitle}:

            {statusText}

            View your application: {frontendUrl}/dashboard/student/applications

            - The PathGuide Team";

        return await SendEmailAsync(email, name, subject, plainTextContent, htmlContent);
    }

    private async Task<bool> SendEmailAsync(string toEmail, string toName, string subject, string plainTextContent, string htmlContent)
    {
        try
        {
            var apiKey = _configuration["Brevo:ApiKey"];
            var fromEmail = _configuration["Brevo:FromEmail"];
            var fromName = _configuration["Brevo:FromName"];
            var apiUrl = _configuration["Brevo:ApiUrl"] ?? "https://api.brevo.com/v3/smtp/email";

            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("Brevo API key is not configured. Email not sent.");
                return false;
            }

            var payload = new
            {
                sender = new { name = fromName, email = fromEmail },
                to = new[] { new { email = toEmail, name = toName } },
                subject,
                htmlContent,
                textContent = plainTextContent
            };

            var client = _httpClientFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Post, apiUrl);
            request.Headers.Add("api-key", apiKey);
            request.Headers.Add("accept", "application/json");
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Email sent successfully to {Email}", toEmail);
                return true;
            }
            else
            {
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to send email to {Email}. Status: {StatusCode}, Body: {Body}",
                    toEmail, response.StatusCode, body);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {Email}", toEmail);
            return false;
        }
    }
}
