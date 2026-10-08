using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using grad_project.Server.Data;
using grad_project.Server.DTOs;
using grad_project.Server.Models;
using grad_project.Server.Services;

namespace grad_project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly PathGuideContext _context;
    private readonly IAuthService _authService;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthController> _logger;
    private readonly ICvSuggestionService _cvSuggestionService;
    private readonly IAnonCvParseGate _anonCvParseGate;

    public AuthController(
        PathGuideContext context,
        IAuthService authService,
        IEmailService emailService,
        ILogger<AuthController> logger,
        ICvSuggestionService cvSuggestionService,
        IAnonCvParseGate anonCvParseGate)
    {
        _context = context;
        _authService = authService;
        _emailService = emailService;
        _logger = logger;
        _cvSuggestionService = cvSuggestionService;
        _anonCvParseGate = anonCvParseGate;
    }

    // POST: api/auth/parse-cv - Anonymous CV parse used during sign-up to
    // prefill the registration form. Does NOT store the file. Degrades
    // gracefully (parsed:false) when parsing is unavailable or budget-limited.
    [HttpPost("parse-cv")]
    [AllowAnonymous]
    [EnableRateLimiting("cv-parse-anon")]
    [RequestSizeLimit(6_291_456)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<CvSuggestionsDto>> ParseCv(IFormFile? file, CancellationToken cancellationToken)
    {
        try
        {
            // Cheap metadata checks first — never buffer a file we'll reject.
            var error = CvFiles.ValidateMetadata(file, out var extension);
            if (error != null)
            {
                return BadRequest(new { message = error });
            }

            // Magic-byte check from a fresh stream (still before buffering the file).
            var headerBytes = new byte[8];
            int headerRead;
            await using (var header = file!.OpenReadStream())
            {
                headerRead = await header.ReadAtLeastAsync(headerBytes, headerBytes.Length, throwOnEndOfStream: false, cancellationToken);
            }
            if (!CvFiles.HasValidSignature(headerBytes.AsSpan(0, headerRead), extension!))
            {
                return BadRequest(new { message = "The file content does not match its extension." });
            }

            // Cost ceiling / kill-switch (checked only after validation passes, so
            // junk uploads can't burn the budget). When closed, behave like the
            // no-API-key path: parsed:false → the form falls back to manual entry.
            if (!_anonCvParseGate.TryEnter())
            {
                return Ok(new CvSuggestionsDto { Parsed = false });
            }

            using var buffer = new MemoryStream();
            await using (var upload = file!.OpenReadStream())
            {
                await upload.CopyToAsync(buffer, cancellationToken);
            }
            buffer.Position = 0;

            var suggestions = await _cvSuggestionService.SuggestAsync(buffer, extension!, cancellationToken);
            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing CV during sign-up");
            // TEMP DIAGNOSTIC (revert): normally returns the generic message below.
            return StatusCode(500, new { message = "CV parse error: " + ex.Message, detail = ex.ToString() });
        }
    }

    [HttpPost("register/student")]
    public async Task<ActionResult<AuthResponseDto>> RegisterStudent([FromBody] RegisterStudentDto dto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Email already registered"
                });
            }

            // Validate UniversityId exists (only if provided)
            if (dto.UniversityId.HasValue && !await _context.Universities.AnyAsync(u => u.UniversityId == dto.UniversityId.Value))
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid university selected"
                });
            }

            // Validate MajorId exists (only if provided)
            if (dto.MajorId.HasValue && !await _context.Majors.AnyAsync(m => m.MajorId == dto.MajorId.Value))
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid major selected"
                });
            }

            // Create user. Email verification required before login.
            var verificationToken = _authService.GenerateVerificationToken();
            var user = new User
            {
                Email = dto.Email,
                Password = _authService.HashPassword(dto.Password),
                Name = dto.Name,
                Phone = dto.Phone,
                Role = "student",
                IsActive = true,
                EmailVerified = false,
                VerificationToken = verificationToken,
                VerificationTokenExpires = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create student profile with all fields including step 2
            var studentProfile = new StudentProfile
            {
                UserId = user.UserId,
                UniversityId = dto.UniversityId,
                MajorId = dto.MajorId,
                GraduationYear = dto.GraduationYear,
                LinkedinUrl = dto.LinkedinUrl,
                GithubUrl = dto.GithubUrl,
                CareerPathId = dto.CareerPathId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.StudentProfiles.Add(studentProfile);
            await _context.SaveChangesAsync();

            // Add skills if provided
            if (dto.SkillIds != null && dto.SkillIds.Count > 0)
            {
                foreach (var skillId in dto.SkillIds)
                {
                    _context.StudentSkills.Add(new StudentSkill
                    {
                        StudentId = studentProfile.StudentProfileId,
                        SkillId = skillId
                    });
                }
                await _context.SaveChangesAsync();
            }

            // Add interests if provided
            if (dto.InterestIds != null && dto.InterestIds.Count > 0)
            {
                foreach (var interestId in dto.InterestIds)
                {
                    _context.StudentInterests.Add(new StudentInterest
                    {
                        StudentId = studentProfile.StudentProfileId,
                        InterestId = interestId
                    });
                }
                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();

            // Send verification email (don't fail registration if email fails)
            try
            {
                await _emailService.SendVerificationEmailAsync(user.Email, user.Name ?? "User", verificationToken);
            }
            catch (Exception emailEx)
            {
                _logger.LogWarning(emailEx, "Failed to send verification email to {Email}", user.Email);
            }

            var token = _authService.GenerateJwtToken(user);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Registration successful. Please check your email to verify your account.",
                Token = token,
                User = new UserDto
                {
                    UserId = user.UserId,
                    Email = user.Email,
                    Name = user.Name,
                    Phone = user.Phone,
                    Role = user.Role,
                    EmailVerified = user.EmailVerified,
                    CreatedAt = user.CreatedAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during student registration: {Message}", ex.Message);
            return StatusCode(500, new AuthResponseDto
            {
                Success = false,
                Message = "An error occurred during registration."
            });
        }
    }

    [HttpPost("register/recruiter")]
    public async Task<ActionResult<AuthResponseDto>> RegisterRecruiter([FromBody] RegisterRecruiterDto dto)
    {
        try
        {
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Email already registered"
                });
            }

            // Create user. Email verification required before login.
            var verificationToken = _authService.GenerateVerificationToken();
            var user = new User
            {
                Email = dto.Email,
                Password = _authService.HashPassword(dto.Password),
                Name = dto.Name,
                Phone = dto.Phone,
                Role = "recruiter",
                IsActive = true,
                EmailVerified = false,
                VerificationToken = verificationToken,
                VerificationTokenExpires = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create recruiter profile
            var recruiterProfile = new RecruiterProfile
            {
                UserId = user.UserId,
                CompanyName = dto.CompanyName,
                Email = dto.Email,
                CompanyDescription = dto.CompanyDescription,
                Website = dto.Website,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.RecruiterProfiles.Add(recruiterProfile);
            await _context.SaveChangesAsync();

            // Send verification email (don't fail registration if email fails)
            try
            {
                await _emailService.SendVerificationEmailAsync(user.Email, user.Name ?? "User", verificationToken);
            }
            catch (Exception emailEx)
            {
                _logger.LogWarning(emailEx, "Failed to send verification email to {Email}", user.Email);
            }

            var token = _authService.GenerateJwtToken(user);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Registration successful. Please check your email to verify your account.",
                Token = token,
                User = new UserDto
                {
                    UserId = user.UserId,
                    Email = user.Email,
                    Name = user.Name,
                    Phone = user.Phone,
                    Role = user.Role,
                    EmailVerified = user.EmailVerified,
                    CreatedAt = user.CreatedAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during recruiter registration: {Message}", ex.Message);
            return StatusCode(500, new AuthResponseDto
            {
                Success = false,
                Message = "An error occurred during registration."
            });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null || !_authService.VerifyPassword(dto.Password, user.Password))
            {
                return Unauthorized(new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid email or password"
                });
            }

            if (!user.EmailVerified)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Please verify your email before logging in"
                });
            }

            var token = _authService.GenerateJwtToken(user);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Login successful",
                Token = token,
                User = new UserDto
                {
                    UserId = user.UserId,
                    Email = user.Email,
                    Name = user.Name,
                    Phone = user.Phone,
                    Role = user.Role,
                    EmailVerified = user.EmailVerified,
                    CreatedAt = user.CreatedAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, new AuthResponseDto
            {
                Success = false,
                Message = "An error occurred during login"
            });
        }
    }

    [HttpPost("verify-email")]
    public async Task<ActionResult<AuthResponseDto>> VerifyEmail([FromBody] VerifyEmailDto dto)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.VerificationToken == dto.Token);

            if (user == null)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid verification token"
                });
            }

            if (user.VerificationTokenExpires < DateTime.UtcNow)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Verification token has expired"
                });
            }

            user.EmailVerified = true;
            user.VerificationToken = null;
            user.VerificationTokenExpires = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Send welcome email
            await _emailService.SendWelcomeEmailAsync(user.Email, user.Name ?? "User");

            var token = _authService.GenerateJwtToken(user);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Email verified successfully",
                Token = token,
                User = new UserDto
                {
                    UserId = user.UserId,
                    Email = user.Email,
                    Name = user.Name,
                    Phone = user.Phone,
                    Role = user.Role,
                    EmailVerified = user.EmailVerified,
                    CreatedAt = user.CreatedAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during email verification");
            return StatusCode(500, new AuthResponseDto
            {
                Success = false,
                Message = "An error occurred during email verification"
            });
        }
    }

    [HttpPost("resend-verification")]
    public async Task<ActionResult<AuthResponseDto>> ResendVerification([FromBody] LoginDto dto)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null)
            {
                return NotFound(new AuthResponseDto
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            if (user.EmailVerified)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Email is already verified"
                });
            }

            // Generate new verification token
            var verificationToken = _authService.GenerateVerificationToken();
            user.VerificationToken = verificationToken;
            user.VerificationTokenExpires = DateTime.UtcNow.AddHours(24);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Send verification email
            await _emailService.SendVerificationEmailAsync(user.Email, user.Name ?? "User", verificationToken);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Verification email sent"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending verification email");
            return StatusCode(500, new AuthResponseDto
            {
                Success = false,
                Message = "An error occurred while sending verification email"
            });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<AuthResponseDto>> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

            // Always return success to prevent email enumeration
            if (user == null)
            {
                return Ok(new AuthResponseDto
                {
                    Success = true,
                    Message = "If an account with that email exists, a password reset link has been sent."
                });
            }

            // Generate reset token
            var resetToken = _authService.GenerateVerificationToken();
            user.ResetToken = resetToken;
            user.ResetTokenExpires = DateTime.UtcNow.AddHours(1);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Send password reset email
            try
            {
                await _emailService.SendPasswordResetEmailAsync(user.Email, user.Name ?? "User", resetToken);
            }
            catch (Exception emailEx)
            {
                _logger.LogWarning(emailEx, "Failed to send password reset email to {Email}", user.Email);
            }

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "If an account with that email exists, a password reset link has been sent."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during forgot password");
            return StatusCode(500, new AuthResponseDto
            {
                Success = false,
                Message = "An error occurred while processing your request"
            });
        }
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<AuthResponseDto>> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.ResetToken == dto.Token);

            if (user == null)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid or expired reset token"
                });
            }

            if (user.ResetTokenExpires < DateTime.UtcNow)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Reset token has expired. Please request a new password reset."
                });
            }

            // Update password
            user.Password = _authService.HashPassword(dto.NewPassword);
            user.ResetToken = null;
            user.ResetTokenExpires = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Password has been reset successfully. You can now log in with your new password."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset");
            return StatusCode(500, new AuthResponseDto
            {
                Success = false,
                Message = "An error occurred while resetting your password"
            });
        }
    }

    [HttpPut("change-password")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult<AuthResponseDto>> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new AuthResponseDto
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            // Verify current password
            if (!_authService.VerifyPassword(dto.CurrentPassword, user.Password))
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Current password is incorrect"
                });
            }

            // Update password
            user.Password = _authService.HashPassword(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Password changed successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password");
            return StatusCode(500, new AuthResponseDto
            {
                Success = false,
                Message = "An error occurred while changing password"
            });
        }
    }
}
