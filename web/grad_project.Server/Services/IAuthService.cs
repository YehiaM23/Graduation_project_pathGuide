using grad_project.Server.Models;

namespace grad_project.Server.Services;

public interface IAuthService
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string hashedPassword);
    string GenerateJwtToken(User user);
    string GenerateVerificationToken();
    bool ValidateToken(string token);
}
