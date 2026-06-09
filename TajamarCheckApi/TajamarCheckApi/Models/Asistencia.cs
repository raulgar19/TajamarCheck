using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TajamarCheckApi.Models;

[Table("Asistencias")]
public sealed class Asistencia
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int IdAsistencia { get; set; }

    [Required]
    public int IdSesion { get; set; }

    [ForeignKey(nameof(IdSesion))]
    public Sesion? Sesion { get; set; }

    [Required]
    public int IdUsuario { get; set; }

    [Required]
    [MaxLength(100)]
    public string NombreUsuario { get; set; } = string.Empty;

    [Required]
    public DateTime HoraFichaje { get; set; } = DateTime.Now;

    [MaxLength(45)]
    public string? IPUtilizada { get; set; }

    [Required]
    [MaxLength(20)]
    public string EstadoAsistencia { get; set; } = "Presente"; // "Presente", "Retraso", "Falta"

    [MaxLength(500)]
    public string? Justificacion { get; set; }

    [Required]
    public bool EstaJustificada { get; set; } = false;
}
