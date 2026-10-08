namespace grad_project.Server.Services;

public interface ILiveKitTokenService
{
    /// <summary>
    /// Mints a participant token for the mock-interview room. When
    /// <paramref name="applicationId"/> is supplied, it is embedded in the
    /// room metadata so the Python agent can identify which application the
    /// generated report belongs to.
    /// </summary>
    LiveKitToken IssueParticipantToken(int userId, string displayName, int? applicationId = null);
}

public record LiveKitToken(string Token, string Url, string Room, string Identity, DateTime ExpiresAt);
