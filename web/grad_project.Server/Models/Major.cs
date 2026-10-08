using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("majors")]
public class Major
{
    [Key]
    [Column("major_id")]
    public int MajorId { get; set; }

    [Column("major_name")]
    [StringLength(100)]
    public string? MajorName { get; set; }

    // Navigation property
    public virtual ICollection<StudentProfile> StudentProfiles { get; set; } = new List<StudentProfile>();
}
