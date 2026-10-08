namespace grad_project.Server.Services;

/// <summary>
/// Shared rules and helpers for CV files, used by the upload endpoint and by
/// both (student and recruiter/admin) download endpoints so the limits and
/// content-type mapping never drift apart.
/// </summary>
public static class CvFiles
{
    /// <summary>Maximum accepted CV size: 5 MB.</summary>
    public const long MaxBytes = 5 * 1024 * 1024;

    public const string PdfExtension = ".pdf";
    public const string DocxExtension = ".docx";

    public const string PdfContentType = "application/pdf";
    public const string DocxContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    /// <summary>Allowed file extensions (lower-case, including the leading dot).</summary>
    public static readonly IReadOnlyCollection<string> AllowedExtensions = new[] { PdfExtension, DocxExtension };

    /// <summary>Client-supplied content types accepted as a cheap first gate (never trusted over magic bytes).</summary>
    public static readonly IReadOnlyCollection<string> AllowedContentTypes = new[] { PdfContentType, DocxContentType };

    /// <summary>
    /// True if the stored value is a legacy external link (the old paste-a-URL
    /// behaviour) rather than a relative path to a locally stored file.
    /// </summary>
    public static bool IsExternalUrl(string? storedValue) =>
        storedValue != null &&
        (storedValue.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
         storedValue.StartsWith("https://", StringComparison.OrdinalIgnoreCase));

    /// <summary>
    /// Validates an uploaded CV's metadata (presence, size, extension, declared
    /// content type) without reading the stream. Returns an error message for a
    /// 400, or null when valid; the resolved lower-case extension is returned via
    /// <paramref name="extension"/>. Magic-byte validation is a separate step
    /// (<see cref="HasValidSignature"/>) performed on the file contents.
    /// </summary>
    public static string? ValidateMetadata(IFormFile? file, out string? extension)
    {
        extension = null;
        if (file == null || file.Length == 0)
        {
            return "No file was uploaded.";
        }
        if (file.Length > MaxBytes)
        {
            return "File is too large. Maximum size is 5 MB.";
        }
        extension = GetAllowedExtension(file.FileName);
        if (extension == null)
        {
            return "Only PDF and DOCX files are allowed.";
        }
        // Client content-type is a weak gate; magic bytes are authoritative.
        if (!string.IsNullOrEmpty(file.ContentType) && !AllowedContentTypes.Contains(file.ContentType))
        {
            return "Only PDF and DOCX files are allowed.";
        }
        return null;
    }

    /// <summary>Returns the normalised, allowed extension for a filename, or null if not allowed.</summary>
    public static string? GetAllowedExtension(string? fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return null;
        }

        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return AllowedExtensions.Contains(ext) ? ext : null;
    }

    public static string ContentTypeForExtension(string extension) =>
        extension.Equals(PdfExtension, StringComparison.OrdinalIgnoreCase) ? PdfContentType : DocxContentType;

    /// <summary>
    /// Verifies the leading bytes match the declared extension. PDF must start
    /// with <c>%PDF</c>; DOCX must start with the ZIP local-file header
    /// <c>PK\x03\x04</c>. This is a deliberately shallow "is-a-zip" check for
    /// DOCX — a renamed .zip will pass; deeper inspection of the OOXML parts is
    /// noted as optional future hardening.
    /// </summary>
    public static bool HasValidSignature(ReadOnlySpan<byte> header, string extension)
    {
        if (extension.Equals(PdfExtension, StringComparison.OrdinalIgnoreCase))
        {
            return header.Length >= 4 && header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46;
        }

        if (extension.Equals(DocxExtension, StringComparison.OrdinalIgnoreCase))
        {
            return header.Length >= 4 && header[0] == 0x50 && header[1] == 0x4B && header[2] == 0x03 && header[3] == 0x04;
        }

        return false;
    }
}
