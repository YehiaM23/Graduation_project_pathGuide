using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.IdentityModel.Tokens;

namespace grad_project.Server.Services;

/// <summary>
/// Mints LiveKit access tokens for the mock-interview flow.
///
/// Mirrors the behaviour of the Python <c>token_server.py</c> reference impl:
///   • a fresh, slug-based room name per token so back-to-back interviews
///     can't land in a stale room from a previous session;
///   • an explicit <c>roomConfig.agents</c> dispatch claim, so LiveKit Cloud
///     launches the worker registered under <c>AgentName</c> (the Python
///     <c>agent.py</c> registers itself as "interviewer") into the new room.
///
/// LiveKit tokens are HS256 JWTs whose <c>iss</c> is the API key, signed with
/// the API secret. The grants live in a custom <c>video</c> claim and the
/// agent-dispatch info in <c>roomConfig</c>; both must be embedded as JSON
/// objects (not escaped strings), hence the "JSON" claim valueType below.
/// </summary>
public partial class LiveKitTokenService : ILiveKitTokenService
{
    private const string DefaultAgentName = "interviewer";
    private const int DefaultTokenLifetimeMinutes = 120;

    private readonly LiveKitOptions _options;
    private readonly ILogger<LiveKitTokenService> _logger;

    public LiveKitTokenService(IConfiguration configuration, ILogger<LiveKitTokenService> logger)
    {
        _logger = logger;

        _options = configuration.GetSection("LiveKit").Get<LiveKitOptions>()
            ?? throw new InvalidOperationException("LiveKit configuration section is missing.");

        if (string.IsNullOrWhiteSpace(_options.ApiKey)
            || string.IsNullOrWhiteSpace(_options.ApiSecret)
            || string.IsNullOrWhiteSpace(_options.Url))
        {
            throw new InvalidOperationException("LiveKit ApiKey, ApiSecret, and Url must be configured.");
        }

        _logger.LogInformation(
            "LiveKit token service initialised. Url={Url} AgentName={AgentName} TokenLifetimeMinutes={LifetimeMinutes}",
            _options.Url, ResolvedAgentName, ResolvedLifetimeMinutes);
    }

    public LiveKitToken IssueParticipantToken(int userId, string displayName, int? applicationId = null)
    {
        var room = GenerateRoomName(displayName);
        var lifetime = TimeSpan.FromMinutes(ResolvedLifetimeMinutes);
        var notBefore = DateTime.UtcNow;
        var expires = notBefore.Add(lifetime);

        var videoGrants = new
        {
            room,
            roomJoin = true,
            canPublish = true,
            canSubscribe = true,
        };

        // The Python agent reads `ctx.room.metadata` to pick up the application
        // id; serialise as JSON so additional fields can be added later without
        // a breaking change to the format.
        var roomMetadata = applicationId.HasValue
            ? JsonSerializer.Serialize(new { applicationId = applicationId.Value })
            : null;

        var roomConfig = roomMetadata is null
            ? (object)new
            {
                agents = new[] { new { agentName = ResolvedAgentName } },
            }
            : new
            {
                metadata = roomMetadata,
                agents = new[] { new { agentName = ResolvedAgentName } },
            };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.ApiSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // valueType "JSON" tells JwtSecurityTokenHandler to embed the value as
        // a JSON object literal rather than as an escaped string — that's the
        // shape LiveKit's server-side token validator expects.
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, displayName),
            new("name", displayName),
            new("video", JsonSerializer.Serialize(videoGrants), "JSON"),
            new("roomConfig", JsonSerializer.Serialize(roomConfig), "JSON"),
        };

        var token = new JwtSecurityToken(
            issuer: _options.ApiKey,
            claims: claims,
            notBefore: notBefore,
            expires: expires,
            signingCredentials: credentials);

        var jwt = new JwtSecurityTokenHandler().WriteToken(token);

        _logger.LogInformation(
            "Minted LiveKit token. UserId={UserId} Room={Room} AgentName={AgentName} ApplicationId={ApplicationId} ExpiresAt={ExpiresAt:O}",
            userId, room, ResolvedAgentName, applicationId, expires);

        return new LiveKitToken(jwt, _options.Url, room, displayName, expires);
    }

    /// <summary>
    /// Builds a unique room name from the candidate's display name, matching
    /// the Python token_server format: <c>interview-{slug}-{unixSeconds}-{6 hex}</c>.
    /// Non-alphanumeric runs collapse to a single dash, leading/trailing dashes
    /// are trimmed, and an empty result falls back to "candidate".
    /// </summary>
    private static string GenerateRoomName(string displayName)
    {
        var slug = NonAlphanumericRunPattern()
            .Replace(displayName ?? string.Empty, "-")
            .Trim('-')
            .ToLowerInvariant();
        if (string.IsNullOrEmpty(slug))
        {
            slug = "candidate";
        }

        var unixSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var randomSuffix = RandomHex(3);
        return $"interview-{slug}-{unixSeconds}-{randomSuffix}";
    }

    private static string RandomHex(int byteCount)
    {
        Span<byte> bytes = stackalloc byte[byteCount];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private string ResolvedAgentName =>
        string.IsNullOrWhiteSpace(_options.AgentName) ? DefaultAgentName : _options.AgentName;

    private int ResolvedLifetimeMinutes =>
        _options.TokenLifetimeMinutes > 0 ? _options.TokenLifetimeMinutes : DefaultTokenLifetimeMinutes;

    [GeneratedRegex("[^a-zA-Z0-9]+", RegexOptions.CultureInvariant)]
    private static partial Regex NonAlphanumericRunPattern();

    private sealed class LiveKitOptions
    {
        public string Url { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string ApiSecret { get; set; } = string.Empty;
        public string AgentName { get; set; } = DefaultAgentName;
        public int TokenLifetimeMinutes { get; set; } = DefaultTokenLifetimeMinutes;
    }
}
