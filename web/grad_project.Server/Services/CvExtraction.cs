namespace grad_project.Server.Services;

/// <summary>
/// Raw, unresolved fields extracted from a CV by <see cref="ICvProfileParser"/>.
/// Names (university/major/skills/etc.) are free text as written in the CV; the
/// controller resolves them against reference tables. All fields are best-effort
/// and may be null/empty.
/// </summary>
public class CvExtraction
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? University { get; set; }
    public string? Major { get; set; }
    public decimal? Gpa { get; set; }
    public int? GraduationYear { get; set; }
    public string? LinkedinUrl { get; set; }
    public string? GithubUrl { get; set; }
    public string? Bio { get; set; }
    public string? CareerPath { get; set; }
    public List<string> Skills { get; set; } = new();
    public List<string> Interests { get; set; } = new();

    /// <summary>True when every field is null/empty — nothing usable was extracted.</summary>
    public bool IsEmpty =>
        string.IsNullOrWhiteSpace(FullName) &&
        string.IsNullOrWhiteSpace(Email) &&
        string.IsNullOrWhiteSpace(Phone) &&
        string.IsNullOrWhiteSpace(University) &&
        string.IsNullOrWhiteSpace(Major) &&
        Gpa == null &&
        GraduationYear == null &&
        string.IsNullOrWhiteSpace(LinkedinUrl) &&
        string.IsNullOrWhiteSpace(GithubUrl) &&
        string.IsNullOrWhiteSpace(Bio) &&
        string.IsNullOrWhiteSpace(CareerPath) &&
        Skills.Count == 0 &&
        Interests.Count == 0;
}
