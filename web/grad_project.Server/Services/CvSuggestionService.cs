using Microsoft.EntityFrameworkCore;
using grad_project.Server.Data;
using grad_project.Server.DTOs;
using grad_project.Server.Models;

namespace grad_project.Server.Services;

/// <summary>
/// Default <see cref="ICvSuggestionService"/>: extract → parse → resolve names to
/// reference IDs. Name matching is done in memory with
/// <see cref="StringComparer.OrdinalIgnoreCase"/> so behaviour is identical under
/// the InMemory test provider and SQL Server collation.
/// </summary>
public class CvSuggestionService : ICvSuggestionService
{
    private const int MaxResolvedNames = 50;

    private readonly PathGuideContext _context;
    private readonly ICvTextExtractor _textExtractor;
    private readonly ICvProfileParser _profileParser;

    public CvSuggestionService(PathGuideContext context, ICvTextExtractor textExtractor, ICvProfileParser profileParser)
    {
        _context = context;
        _textExtractor = textExtractor;
        _profileParser = profileParser;
    }

    public async Task<CvSuggestionsDto> SuggestAsync(Stream content, string extension, CancellationToken cancellationToken = default)
    {
        // Normalise the extension once here so the auth (lower-cased) and student
        // (Path.GetExtension) callers can't diverge.
        var normalisedExtension = (extension ?? string.Empty).ToLowerInvariant();

        // Borrowed stream: do not dispose — the caller owns it.
        var text = _textExtractor.ExtractText(content, normalisedExtension);
        if (string.IsNullOrWhiteSpace(text))
        {
            // TEMP DIAGNOSTIC (revert): normally returns { Parsed = false }.
            throw new InvalidOperationException($"[extract] text extraction returned empty for extension '{normalisedExtension}' (the PDF/DOCX could not be read).");
        }

        var extraction = await _profileParser.ParseAsync(text, cancellationToken);
        if (extraction == null || extraction.IsEmpty)
        {
            // TEMP DIAGNOSTIC (revert): normally returns { Parsed = false }.
            throw new InvalidOperationException("[openai] returned no usable profile fields (all fields null/empty).");
        }

        return await BuildSuggestionsAsync(extraction);
    }

    private async Task<CvSuggestionsDto> BuildSuggestionsAsync(CvExtraction e)
    {
        var dto = new CvSuggestionsDto
        {
            Parsed = true,
            FullName = NullIfBlank(e.FullName),
            Email = NullIfBlank(e.Email),
            Phone = NullIfBlank(e.Phone),
            Bio = NullIfBlank(e.Bio),
            LinkedinUrl = NormalizeHttpUrl(e.LinkedinUrl),
            GithubUrl = NormalizeHttpUrl(e.GithubUrl)
        };

        // GPA: only accept a 0–4 value, rounded to the column's 2-dp scale.
        if (e.Gpa is { } gpa && gpa >= 0m && gpa <= 4m)
        {
            dto.Gpa = Math.Round(gpa, 2);
        }

        // Graduation year: only within the range the profile form accepts.
        if (e.GraduationYear is { } year && year >= 2020 && year <= 2035)
        {
            dto.GraduationYear = year;
        }

        if (!string.IsNullOrWhiteSpace(e.University))
        {
            var universities = await _context.Universities.ToListAsync();
            dto.UniversityId = universities
                .FirstOrDefault(u => NameEquals(u.UniversityName, e.University))?.UniversityId;
        }

        if (!string.IsNullOrWhiteSpace(e.Major))
        {
            var majors = await _context.Majors.ToListAsync();
            dto.MajorId = majors
                .FirstOrDefault(m => NameEquals(m.MajorName, e.Major))?.MajorId;
        }

        if (!string.IsNullOrWhiteSpace(e.CareerPath))
        {
            var careerPaths = await _context.CareerPaths.ToListAsync();
            dto.CareerPathId = careerPaths
                .FirstOrDefault(c => NameEquals(c.CareerPathName, e.CareerPath))?.CareerPathId;
        }

        ResolveNames(e.Skills, await _context.Skills.ToListAsync(),
            s => s.SkillName, s => s.SkillId, dto.SkillIds, dto.UnmatchedSkills);

        ResolveNames(e.Interests, await _context.Interests.ToListAsync(),
            i => i.InterestName, i => i.InterestId, dto.InterestIds, dto.UnmatchedInterests);

        return dto;
    }

    /// <summary>
    /// Trims and case-insensitively de-duplicates the extracted names (capped at
    /// <see cref="MaxResolvedNames"/>), matching each against the reference list:
    /// matches go to <paramref name="matchedIds"/>, the rest to
    /// <paramref name="unmatched"/> (no name appears in both).
    /// </summary>
    private static void ResolveNames<T>(
        List<string> names,
        List<T> reference,
        Func<T, string?> nameSelector,
        Func<T, int> idSelector,
        List<int> matchedIds,
        List<string> unmatched)
    {
        var lookup = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var item in reference)
        {
            var name = nameSelector(item)?.Trim();
            if (!string.IsNullOrEmpty(name) && !lookup.ContainsKey(name))
            {
                lookup[name] = idSelector(item);
            }
        }

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var classified = 0;
        foreach (var raw in names)
        {
            var name = raw?.Trim();
            if (string.IsNullOrEmpty(name) || !seen.Add(name))
            {
                continue; // skip blanks and case-insensitive duplicates
            }
            if (classified >= MaxResolvedNames)
            {
                break; // bound payload size
            }
            classified++;

            if (lookup.TryGetValue(name, out var id))
            {
                if (!matchedIds.Contains(id))
                {
                    matchedIds.Add(id);
                }
            }
            else
            {
                unmatched.Add(name);
            }
        }
    }

    private static bool NameEquals(string? referenceName, string? extracted) =>
        referenceName != null && extracted != null &&
        string.Equals(referenceName.Trim(), extracted.Trim(), StringComparison.OrdinalIgnoreCase);

    private static string? NullIfBlank(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    /// <summary>
    /// Returns a usable http(s) URL for a profile link, or null. A CV often writes
    /// a LinkedIn/GitHub address as bare text with no scheme ("linkedin.com/in/mona",
    /// "www.github.com/john"); such a value is given the implied https so it is not
    /// lost. Values that already carry a scheme are left untouched, so non-http
    /// schemes (mailto:, ftp:, javascript:) and relative paths are still rejected.
    /// </summary>
    private static string? NormalizeHttpUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var candidate = value.Trim();

        // A real address never contains inner whitespace; rejecting it here keeps
        // us from emitting an un-encoded, malformed URL after the scheme prepend.
        if (candidate.Any(char.IsWhiteSpace))
        {
            return null;
        }

        if (!HasScheme(candidate))
        {
            candidate = "https://" + candidate;
        }

        // Require a dotted host so a bare label the model might echo back (e.g.
        // "LinkedIn" → "https://LinkedIn") is rejected rather than stored as junk.
        return Uri.TryCreate(candidate, UriKind.Absolute, out var uri) &&
               (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps) &&
               uri.Host.Contains('.')
            ? candidate
            : null;
    }

    /// <summary>
    /// True if the value begins with an RFC 3986 URI scheme (e.g. "https:",
    /// "mailto:"). Used to tell a real scheme apart from a bare host that merely
    /// contains a colon, so only genuinely schemeless addresses get the implied https.
    /// </summary>
    private static bool HasScheme(string value)
    {
        var colonIndex = value.IndexOf(':');
        if (colonIndex <= 0 || !char.IsLetter(value[0]))
        {
            return false;
        }
        for (var i = 1; i < colonIndex; i++)
        {
            var c = value[i];
            if (!char.IsLetterOrDigit(c) && c is not ('+' or '-' or '.'))
            {
                return false;
            }
        }
        return true;
    }
}
