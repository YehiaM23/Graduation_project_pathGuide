namespace grad_project.Server.DTOs;

// Generic pagination wrapper
public class PaginatedResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}

// Dashboard
public class AdminDashboardStatsDto
{
    public int TotalStudents { get; set; }
    public int TotalRecruiters { get; set; }
    public int TotalInternships { get; set; }
    public int ActiveInternships { get; set; }
    public int TotalApplications { get; set; }
    public int PendingApplications { get; set; }
    public int ReviewedApplications { get; set; }
    public int AcceptedApplications { get; set; }
    public int RejectedApplications { get; set; }
    public int CompletedApplications { get; set; }
    public int TotalInternshipReviews { get; set; }
    public int TotalCourseReviews { get; set; }
}

public class RecentActivityDto
{
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public DateTime? CreatedAt { get; set; }
}

// User management
public class AdminUserListItemDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool EmailVerified { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? CompanyName { get; set; }
    public string? UniversityName { get; set; }
    public string? MajorName { get; set; }
}

public class AdminUserDetailDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool EmailVerified { get; set; }
    public DateTime? CreatedAt { get; set; }
    // Student fields
    public string? UniversityName { get; set; }
    public string? MajorName { get; set; }
    public decimal? Gpa { get; set; }
    public int? GraduationYear { get; set; }
    /// <summary>True when the student has an uploaded CV. The raw storage path is never exposed.</summary>
    public bool HasCv { get; set; }
    public string? LinkedinUrl { get; set; }
    public string? GithubUrl { get; set; }
    public string? Bio { get; set; }
    // Recruiter fields
    public string? CompanyName { get; set; }
    public string? CompanyDescription { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
}

// Internship management
public class AdminInternshipListItemDto
{
    public int InternshipId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? Location { get; set; }
    public bool IsActive { get; set; }
    public int ApplicationsCount { get; set; }
    public decimal? Stipend { get; set; }
    public DateTime? Deadline { get; set; }
    public DateTime? CreatedAt { get; set; }
}

// Application oversight
public class AdminApplicationListItemDto
{
    public int ApplicationId { get; set; }
    public string? StudentName { get; set; }
    public string? StudentEmail { get; set; }
    public string? InternshipTitle { get; set; }
    public string? CompanyName { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? AppliedAt { get; set; }
}

// Review moderation
public class AdminInternshipReviewDto
{
    public int ReviewId { get; set; }
    public string? StudentName { get; set; }
    public string? InternshipTitle { get; set; }
    public string? CompanyName { get; set; }
    public int OverallRating { get; set; }
    public string? ReviewText { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class AdminCourseReviewDto
{
    public int ReviewId { get; set; }
    public string? StudentName { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string? CourseLink { get; set; }
    public int Rating { get; set; }
    public string? ReviewText { get; set; }
    public DateTime? CreatedAt { get; set; }
}
