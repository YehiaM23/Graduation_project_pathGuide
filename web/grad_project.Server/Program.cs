using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using grad_project.Server.Data;
using grad_project.Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddOpenApi();

// Configure Entity Framework with SQL Server
builder.Services.AddDbContext<PathGuideContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Configure CORS
var frontendUrl = builder.Configuration["AppSettings:FrontendUrl"] ?? "https://localhost:62246";
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.WithOrigins(
                    "https://localhost:62246",
                    "http://localhost:62246",
                    "https://localhost:7243",
                    "http://localhost:5064"
                )
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        }
        else
        {
            policy.WithOrigins(frontendUrl)
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        }
    });
});

// Persist Data Protection keys to disk so they survive restarts, and encrypt
// them at rest with machine-scoped DPAPI on Windows (no extra dep, only valid
// on the same machine that wrote them — which is what we want for IIS).
var dpKeyPath = Path.Combine(builder.Environment.ContentRootPath, "dp-keys");
var dpBuilder = builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dpKeyPath))
    .SetApplicationName("PathGuide");
if (OperatingSystem.IsWindows())
{
    dpBuilder.ProtectKeysWithDpapi(protectToLocalMachine: true);
}

// Register services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddSingleton<ILiveKitTokenService, LiveKitTokenService>();
builder.Services.AddSingleton<ICvFileStore, LocalCvFileStore>();
builder.Services.AddSingleton<ICvTextExtractor, CvTextExtractor>();
builder.Services.AddHttpClient<ICvProfileParser, OpenAiCvProfileParser>();
builder.Services.AddScoped<ICvSuggestionService, CvSuggestionService>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<IAnonCvParseGate, AnonCvParseGate>();

// Per-user throttle for the paid OpenAI-backed CV parse endpoint.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("cv-parse", httpContext =>
    {
        var userId = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        // [Authorize] guarantees a user id here; fall back to the remote IP so a
        // missing claim can never merge distinct callers into one shared bucket.
        var partitionKey = string.IsNullOrEmpty(userId)
            ? $"ip:{httpContext.Connection.RemoteIpAddress}"
            : $"user:{userId}";
        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        });
    });

    // Anonymous CV parse (sign-up). Partition by client IP (IPv6 grouped to /64
    // so a single client can't trivially evade via the rest of its prefix).
    // This is best-effort; the hard cost ceiling is IAnonCvParseGate.
    options.AddPolicy("cv-parse-anon", httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress;
        string partitionKey;
        if (ip == null)
        {
            partitionKey = "anon:unknown";
        }
        else if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6)
        {
            var bytes = ip.GetAddressBytes();
            Array.Clear(bytes, 8, 8); // keep the /64 prefix only
            partitionKey = $"anon:{new System.Net.IPAddress(bytes)}";
        }
        else
        {
            partitionKey = $"anon:{ip}";
        }

        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 3,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        });
    });
});

// Register HttpClientFactory for Career Planner proxy
builder.Services.AddHttpClient();

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseDefaultFiles();
app.MapStaticAssets();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Use CORS before authentication
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.UseRateLimiter();

app.MapControllers();

app.MapFallbackToFile("/index.html");

// Ensure database is created and seed initial admin
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<PathGuideContext>();
    context.Database.EnsureCreated();

    // Seed initial admin if no admin exists
    if (!context.Users.Any(u => u.Role == "admin"))
    {
        var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
        var adminUser = new grad_project.Server.Models.User
        {
            Email = "admin@pathguide.com",
            Password = authService.HashPassword("Admin@123456"),
            Role = "admin",
            Name = "System Administrator",
            IsActive = true,
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(adminUser);
        context.SaveChanges();

        context.AdminProfiles.Add(new grad_project.Server.Models.AdminProfile
        {
            UserId = adminUser.UserId,
            IsFullAdmin = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        context.SaveChanges();

        app.Logger.LogInformation("Initial admin seeded: admin@pathguide.com / Admin@123456");
    }
}

app.Run();
