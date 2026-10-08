namespace grad_project.Server.Services;

/// <summary>
/// Extracts plain text from an uploaded CV file so it can be sent to the
/// profile parser. Implementations must never throw: any failure (corrupt file,
/// unsupported type, decompression bomb, etc.) yields an empty string, which
/// the caller treats as "could not autofill".
/// </summary>
public interface ICvTextExtractor
{
    /// <param name="content">The file stream (seekable).</param>
    /// <param name="extension">File extension including the dot, e.g. ".pdf".</param>
    /// <returns>Extracted plain text, or "" when nothing usable could be read.</returns>
    string ExtractText(Stream content, string extension);
}
