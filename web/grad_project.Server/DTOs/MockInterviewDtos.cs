namespace grad_project.Server.DTOs;

public class MockInterviewTokenRequestDto
{
    /// <summary>
    /// Optional. If provided, the token endpoint validates that the caller owns
    /// this application and that it is currently <c>pending</c>, then forwards
    /// the id to the Python agent via room metadata so the generated report can
    /// be saved against the right row.
    /// </summary>
    public int? ApplicationId { get; set; }
}

public class MockInterviewTokenResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Room { get; set; } = string.Empty;
    public string Identity { get; set; } = string.Empty;
}

public class MockInterviewReportRequestDto
{
    public int ApplicationId { get; set; }
    public string Report { get; set; } = string.Empty;
}

public class MockInterviewReportResponseDto
{
    public int ApplicationId { get; set; }
    public string Report { get; set; } = string.Empty;
}

/// <summary>
/// Server-to-server payload returned to the Python interview agent so it can
/// tailor the interview to the real internship and the candidate's background.
///
/// <see cref="ProfileSummary"/> is the primary source: the candidate's
/// structured PathGuide profile (university, major, GPA, graduation year, career
/// path, skills, interests, links, bio) accumulated into a readable block. It is
/// always available from the database and does not depend on an uploaded file.
///
/// <see cref="CvText"/> is a secondary bonus: the plain text extracted from the
/// uploaded CV file, or an empty string when the candidate has no locally-stored
/// CV (no file on record, a legacy external link, or a missing file).
/// </summary>
public class MockInterviewContextResponseDto
{
    public string CandidateName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string ProfileSummary { get; set; } = string.Empty;
    public string CvText { get; set; } = string.Empty;
}
