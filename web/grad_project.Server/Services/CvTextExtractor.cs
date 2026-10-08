using System.Text;
using System.IO.Compression;
using System.Xml;
using UglyToad.PdfPig;

namespace grad_project.Server.Services;

/// <summary>
/// Extracts text from PDF (via PdfPig) and DOCX (via ZipArchive + a hardened
/// XmlReader). Hostile input is expected: every path is wrapped so any error
/// returns "", and decompression is bounded so a zip bomb cannot exhaust memory.
/// </summary>
public class CvTextExtractor : ICvTextExtractor
{
    // Upper bound on returned text (also bounds OpenAI token cost downstream).
    private const int MaxOutputChars = 100_000;
    // Authoritative cap on bytes read from the DOCX document part, regardless of
    // the (attacker-controlled) declared entry length.
    private const int MaxDocxPartBytes = 10 * 1024 * 1024;

    private const string WordprocessingNs = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

    private readonly ILogger<CvTextExtractor> _logger;

    public CvTextExtractor(ILogger<CvTextExtractor> logger) => _logger = logger;

    public string ExtractText(Stream content, string extension)
    {
        try
        {
            var text = extension?.ToLowerInvariant() switch
            {
                ".pdf" => ExtractPdf(content),
                ".docx" => ExtractDocx(content),
                _ => string.Empty
            };

            text = text.Trim();
            return text.Length > MaxOutputChars ? text[..MaxOutputChars] : text;
        }
        catch (Exception ex)
        {
            // Never let a malformed/hostile document break the request.
            _logger.LogWarning(ex, "CV text extraction failed for extension {Extension}", extension);
            return string.Empty;
        }
    }

    private static string ExtractPdf(Stream content)
    {
        var sb = new StringBuilder();
        var urls = new List<string>();
        using var doc = PdfDocument.Open(content);
        foreach (var page in doc.GetPages())
        {
            sb.Append(page.Text);
            sb.Append('\n');

            // A link such as "GitHub" / "LinkedIn" carries the real address in the
            // annotation target, not the visible text, so collect those URIs too.
            try
            {
                foreach (var link in page.GetHyperlinks())
                {
                    if (!string.IsNullOrWhiteSpace(link.Uri))
                    {
                        urls.Add(link.Uri.Trim());
                    }
                }
            }
            catch
            {
                // A page with malformed annotations must not lose its text.
            }

            if (sb.Length >= MaxOutputChars)
            {
                break;
            }
        }
        AppendLinks(sb, urls);
        return sb.ToString();
    }

    private static string ExtractDocx(Stream content)
    {
        using var zip = new ZipArchive(content, ZipArchiveMode.Read);
        var entry = zip.GetEntry("word/document.xml");
        if (entry == null)
        {
            return string.Empty;
        }

        // Read at most MaxDocxPartBytes from the (decompressed) part stream. We do
        // NOT trust entry.Length — a malicious archive can understate it — so the
        // read itself is capped and a part larger than the cap is rejected.
        using var entryStream = entry.Open();
        var bytes = ReadCapped(entryStream, MaxDocxPartBytes);
        if (bytes == null)
        {
            return string.Empty; // exceeds cap → treat as hostile
        }

        var settings = new XmlReaderSettings
        {
            DtdProcessing = DtdProcessing.Prohibit, // block DTDs / XXE
            XmlResolver = null,                      // never resolve external entities
            MaxCharactersFromEntities = 1024,        // defense-in-depth (no effect while DTDs are prohibited)
            CloseInput = true
        };

        var sb = new StringBuilder();
        using var ms = new MemoryStream(bytes);
        using var reader = XmlReader.Create(ms, settings);
        while (reader.Read())
        {
            if (reader.NodeType == XmlNodeType.Element &&
                reader.LocalName == "t" &&
                reader.NamespaceURI == WordprocessingNs)
            {
                sb.Append(reader.ReadElementContentAsString());
                sb.Append(' ');
                if (sb.Length >= MaxOutputChars)
                {
                    break;
                }
            }
        }

        // In Word, "GitHub" / "LinkedIn" are usually hyperlinks: the visible text
        // above only gives the label, while the real address lives in the document
        // relationships part. Pull the external targets so the parser sees them.
        AppendLinks(sb, ReadDocxHyperlinkTargets(zip, settings));
        return sb.ToString();
    }

    /// <summary>
    /// Collects external hyperlink targets from <c>word/_rels/document.xml.rels</c>.
    /// Only http(s) targets are returned; anything else (mailto, internal anchors,
    /// unreadable rels) is skipped, and any failure yields an empty list.
    /// </summary>
    private static List<string> ReadDocxHyperlinkTargets(ZipArchive zip, XmlReaderSettings settings)
    {
        var urls = new List<string>();
        try
        {
            var relsEntry = zip.GetEntry("word/_rels/document.xml.rels");
            if (relsEntry == null)
            {
                return urls;
            }

            using var relsStream = relsEntry.Open();
            var bytes = ReadCapped(relsStream, MaxDocxPartBytes);
            if (bytes == null)
            {
                return urls;
            }

            using var ms = new MemoryStream(bytes);
            using var reader = XmlReader.Create(ms, settings);
            while (reader.Read())
            {
                if (reader.NodeType == XmlNodeType.Element &&
                    reader.LocalName == "Relationship")
                {
                    var target = reader.GetAttribute("Target");
                    if (!string.IsNullOrWhiteSpace(target) &&
                        (target.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                         target.StartsWith("https://", StringComparison.OrdinalIgnoreCase)))
                    {
                        urls.Add(target.Trim());
                    }
                }
            }
        }
        catch
        {
            // Missing/malformed rels must not lose the body text already extracted.
        }
        return urls;
    }

    /// <summary>
    /// Appends de-duplicated link URLs on their own line so the LLM can read the
    /// real LinkedIn/GitHub addresses that are hidden behind hyperlink labels.
    /// </summary>
    private static void AppendLinks(StringBuilder sb, List<string> urls)
    {
        if (urls.Count == 0)
        {
            return;
        }
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var distinct = urls.Where(u => seen.Add(u)).ToList();
        if (distinct.Count > 0)
        {
            sb.Append("\nLinks: ").Append(string.Join(" ", distinct)).Append('\n');
        }
    }

    /// <summary>
    /// Reads up to <paramref name="maxBytes"/> from the stream. Returns null if
    /// the stream contains more than that (so callers can reject oversized input
    /// without ever buffering more than the cap).
    /// </summary>
    private static byte[]? ReadCapped(Stream stream, int maxBytes)
    {
        using var buffer = new MemoryStream();
        var chunk = new byte[81920];
        int read;
        while ((read = stream.Read(chunk, 0, chunk.Length)) > 0)
        {
            if (buffer.Length + read > maxBytes)
            {
                return null;
            }
            buffer.Write(chunk, 0, read);
        }
        return buffer.ToArray();
    }
}
