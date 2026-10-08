using Microsoft.AspNetCore.Hosting;

namespace grad_project.Server.Services;

/// <summary>
/// Disk-backed <see cref="ICvFileStore"/> that stores CV files under
/// <c>{WebRoot}/uploads/cvs</c>. The folder is intentionally NOT served as
/// static content (Program.cs has no <c>UseStaticFiles</c>), and a web.config
/// rule denies public access to <c>/uploads</c> as defence-in-depth.
/// </summary>
public class LocalCvFileStore : ICvFileStore
{
    // Relative folder (forward slashes) used both in the DB value and to build
    // the on-disk path. Keep these segments in sync with the web.config deny rule.
    private const string UploadsFolder = "uploads/cvs";

    private readonly string _rootPath;       // absolute {WebRoot}
    private readonly string _uploadsPath;     // absolute {WebRoot}/uploads/cvs (canonical)
    private readonly ILogger<LocalCvFileStore> _logger;

    public LocalCvFileStore(IWebHostEnvironment env, ILogger<LocalCvFileStore> logger)
    {
        _rootPath = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        _uploadsPath = Path.GetFullPath(Path.Combine(_rootPath, "uploads", "cvs"));
        _logger = logger;
    }

    public async Task<string> SaveAsync(Stream content, string extension, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(_uploadsPath);

        // GUID names make a collision effectively impossible, so the move never
        // needs to overwrite. Writing to a temp file first means a reader never
        // sees a partially written CV under the final name.
        var fileName = $"{Guid.NewGuid():N}{extension}";
        var relativePath = $"{UploadsFolder}/{fileName}";
        var finalPath = Path.Combine(_uploadsPath, fileName);
        var tempPath = finalPath + ".tmp";

        try
        {
            await using (var temp = new FileStream(tempPath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await content.CopyToAsync(temp, cancellationToken);
                await temp.FlushAsync(cancellationToken);
            }

            File.Move(tempPath, finalPath);
        }
        catch
        {
            // Don't leave a half-written temp file behind on cancellation/IO error.
            TryDeleteTemp(tempPath);
            throw;
        }

        return relativePath;
    }

    public bool Exists(string relativePath)
    {
        return TryResolve(relativePath, out var fullPath) && File.Exists(fullPath);
    }

    public Stream OpenRead(string relativePath)
    {
        if (!TryResolve(relativePath, out var fullPath))
        {
            throw new UnauthorizedAccessException("Resolved CV path is outside the uploads root.");
        }

        return new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
    }

    public void Delete(string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath) || !TryResolve(relativePath, out var fullPath))
        {
            return;
        }

        try
        {
            File.Delete(fullPath); // no-op if the file does not exist
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or DirectoryNotFoundException)
        {
            // Best-effort: an orphaned file is preferable to failing the request.
            _logger.LogWarning(ex, "Failed to delete CV file {Path}", relativePath);
        }
    }

    private static void TryDeleteTemp(string tempPath)
    {
        try
        {
            if (File.Exists(tempPath))
            {
                File.Delete(tempPath);
            }
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or DirectoryNotFoundException)
        {
            // Swallow: a stray .tmp is harmless and lives under the deny-listed uploads folder.
        }
    }

    /// <summary>
    /// Resolves a stored relative path to an absolute path and verifies it stays
    /// within the uploads root (defence-in-depth against a tampered DB value such
    /// as <c>..\..\web.config</c>). Returns false if it escapes the root.
    /// </summary>
    private bool TryResolve(string relativePath, out string fullPath)
    {
        fullPath = string.Empty;
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            return false;
        }

        // Normalise to OS separators and resolve relative to the web root.
        var normalised = relativePath.Replace('/', Path.DirectorySeparatorChar);
        var candidate = Path.GetFullPath(Path.Combine(_rootPath, normalised));

        // Must live inside {WebRoot}/uploads/cvs.
        var root = _uploadsPath + Path.DirectorySeparatorChar;
        if (!candidate.StartsWith(root, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        fullPath = candidate;
        return true;
    }
}
