namespace grad_project.Server.Services;

/// <summary>
/// Turns raw CV text into structured profile fields via an LLM. Implementations
/// must never throw and must return null when extraction is unavailable (no API
/// key configured, network/timeout/HTTP error, or an unusable response), so the
/// caller can degrade gracefully.
/// </summary>
public interface ICvProfileParser
{
    Task<CvExtraction?> ParseAsync(string cvText, CancellationToken cancellationToken = default);
}
