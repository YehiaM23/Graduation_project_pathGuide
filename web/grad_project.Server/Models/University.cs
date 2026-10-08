using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("universities")]
public class University
{
    [Key]
    [Column("university_id")]
    public int UniversityId { get; set; }

    [Column("university_name")]
    [StringLength(100)]
    public string? UniversityName { get; set; }

    // Navigation property
    public virtual ICollection<StudentProfile> StudentProfiles { get; set; } = new List<StudentProfile>();
}
