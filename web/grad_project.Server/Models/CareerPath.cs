using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("career_paths")]
public class CareerPath
{
    [Key]
    [Column("career_path_id")]
    public int CareerPathId { get; set; }

    [Required]
    [Column("career_path")]
    [StringLength(100)]
    public string CareerPathName { get; set; } = string.Empty;
}
