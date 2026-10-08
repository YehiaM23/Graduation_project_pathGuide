using System.ComponentModel.DataAnnotations;

namespace grad_project.Server.DTOs;

public class StudentProfileDto
{
    public int StudentProfileId { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public string? Phone { get; set; }
    public int? UniversityId { get; set; }
    public string? UniversityName { get; set; }
    public int? MajorId { get; set; }
    public string? MajorName { get; set; }
    public decimal? Gpa { get; set; }
    public int? GraduationYear { get; set; }
    /// <summary>
    /// True when the student has an uploaded CV. The raw storage path is never
    /// exposed; the file is fetched via the authenticated CV download endpoint.
    /// </summary>
    public bool HasCv { get; set; }
    public string? TranscriptUrl { get; set; }
    public string? LinkedinUrl { get; set; }
    public string? GithubUrl { get; set; }
    public int? CareerPathId { get; set; }
    public string? CareerPathName { get; set; }
    public string? Bio { get; set; }
    public List<SkillDto> Skills { get; set; } = new();
    public List<InterestDto> Interests { get; set; } = new();
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UpdateStudentProfileDto
{
    [MaxLength(100)]
    public string? FullName { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    public int? UniversityId { get; set; }
    public int? MajorId { get; set; }

    [Range(0, 4.0)]
    public decimal? Gpa { get; set; }

    [Range(2020, 2035)]
    public int? GraduationYear { get; set; }

    // CvUrl is intentionally not updatable here. CVs are managed exclusively
    // through the dedicated upload/delete endpoints in StudentsController.

    [Url]
    public string? TranscriptUrl { get; set; }

    [Url]
    public string? LinkedinUrl { get; set; }

    [Url]
    public string? GithubUrl { get; set; }

    public int? CareerPathId { get; set; }

    [MaxLength(1000)]
    public string? Bio { get; set; }

    public List<int>? SkillIds { get; set; }
    public List<int>? InterestIds { get; set; }
}

public class RecruiterProfileDto
{
    public int RecruiterProfileId { get; set; }
    public int? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public string? CompanyName { get; set; }
    public string? Email { get; set; }
    public string? CompanyDescription { get; set; }
    public string? LogoUrl { get; set; }
    public string? Website { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UpdateRecruiterProfileDto
{
    [MaxLength(100)]
    public string? CompanyName { get; set; }

    [MaxLength(1000)]
    public string? CompanyDescription { get; set; }

    [Url]
    public string? LogoUrl { get; set; }

    [Url]
    public string? Website { get; set; }
}

public class SkillDto
{
    public int SkillId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public string? Category { get; set; }
}

public class InterestDto
{
    public int InterestId { get; set; }
    public string? InterestName { get; set; }
}

public class MajorDto
{
    public int MajorId { get; set; }
    public string? MajorName { get; set; }
}

public class UniversityDto
{
    public int UniversityId { get; set; }
    public string? UniversityName { get; set; }
}

public class CareerPathDto
{
    public int CareerPathId { get; set; }
    public string CareerPathName { get; set; } = string.Empty;
}
