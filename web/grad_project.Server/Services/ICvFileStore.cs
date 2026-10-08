namespace grad_project.Server.Services;

/// <summary>
/// Abstraction over the physical storage of uploaded CV files. All disk I/O
/// lives behind this seam so controllers stay unit-testable (mock it the same
/// way <see cref="IEmailService"/> is mocked) and so the storage root can be
/// relocated (e.g. out of wwwroot) without touching controller code.
///
/// Relative paths are always of the shape <c>uploads/cvs/{guid}{ext}</c> using
/// forward slashes, and are what gets persisted in <c>student_profiles.cv_url</c>.
/// </summary>
public interface ICvFileStore
{
    /// <summary>
    /// Persists <paramref name="content"/> under a freshly generated, collision-
    /// free file name with the given extension. The stream is written to a
    /// temporary file first and atomically moved into place so a reader never
    /// observes a half-written file. Returns the relative path to store in the DB.
    /// </summary>
    /// <param name="content">File bytes. Read from its current position to the end.</param>
    /// <param name="extension">File extension including the leading dot, e.g. ".pdf".</param>
    Task<string> SaveAsync(Stream content, string extension, CancellationToken cancellationToken = default);

    /// <summary>Returns true if the given relative path resolves to an existing file inside the uploads root.</summary>
    bool Exists(string relativePath);

    /// <summary>
    /// Opens the file for reading with <see cref="FileShare.Read"/>. Throws
    /// <see cref="FileNotFoundException"/> if missing and
    /// <see cref="UnauthorizedAccessException"/> if the path escapes the uploads root.
    /// </summary>
    Stream OpenRead(string relativePath);

    /// <summary>
    /// Best-effort delete. Never throws for a missing file or a path that
    /// resolves outside the uploads root; such cases are treated as no-ops.
    /// </summary>
    void Delete(string? relativePath);
}
