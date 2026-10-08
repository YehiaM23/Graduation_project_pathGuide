namespace grad_project.Server.DTOs;

/// <summary>
/// Profile field suggestions derived from a parsed CV. Returned by the parse
/// endpoint for the client to pre-fill empty form fields; nothing is persisted
/// server-side. Names are resolved to reference IDs where a match exists;
/// unmatched names are returned for display only.
/// </summary>
public class CvSuggestionsDto
{
    /// <summary>False when autofill was unavailable (no key, extraction/parse failed, or nothing usable found).</summary>
    public bool Parsed { get; set; }

    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int? UniversityId { get; set; }
    public int? MajorId { get; set; }
    public decimal? Gpa { get; set; }
    public int? GraduationYear { get; set; }
    public string? LinkedinUrl { get; set; }
    public string? GithubUrl { get; set; }
    public string? Bio { get; set; }
    public int? CareerPathId { get; set; }

    public List<int> SkillIds { get; set; } = new();
    public List<int> InterestIds { get; set; } = new();
    public List<string> UnmatchedSkills { get; set; } = new();
    public List<string> UnmatchedInterests { get; set; } = new();
}
