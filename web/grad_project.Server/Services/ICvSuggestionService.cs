using grad_project.Server.DTOs;

namespace grad_project.Server.Services;

/// <summary>
/// Turns an uploaded CV (PDF/DOCX stream) into profile-field suggestions:
/// extracts text, parses it with the LLM, and resolves free-text names to
/// reference IDs. Used by both the authenticated profile parse endpoint and the
/// anonymous sign-up parse endpoint so the pipeline lives in one place.
/// </summary>
public interface ICvSuggestionService
{
    /// <summary>
    /// Returns suggestions for the given CV stream. The stream is BORROWED — the
    /// caller owns its lifetime and disposal. On any failure (blank text, parser
    /// unavailable, nothing extracted) returns <c>{ Parsed = false }</c>.
    /// </summary>
    /// <param name="content">Forward-readable CV stream; caller disposes it.</param>
    /// <param name="extension">File extension (any case), e.g. ".pdf".</param>
    Task<CvSuggestionsDto> SuggestAsync(Stream content, string extension, CancellationToken cancellationToken = default);
}
