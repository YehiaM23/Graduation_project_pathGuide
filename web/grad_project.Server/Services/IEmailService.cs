namespace grad_project.Server.Services;

public interface IEmailService
{
    Task<bool> SendVerificationEmailAsync(string email, string name, string verificationToken);
    Task<bool> SendPasswordResetEmailAsync(string email, string name, string resetToken);
    Task<bool> SendWelcomeEmailAsync(string email, string name);
    Task<bool> SendApplicationConfirmationAsync(string email, string name, string internshipTitle, string companyName);
    Task<bool> SendApplicationStatusUpdateAsync(string email, string name, string internshipTitle, string status);
}
