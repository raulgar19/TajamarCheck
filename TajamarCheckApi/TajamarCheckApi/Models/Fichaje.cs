using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TajamarCheckApi.Models;

[Table("Fichajes")]
public sealed class Fichaje
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public int StudentId { get; set; }

    [Required]
    public DateTime FechaHora { get; set; } = DateTime.UtcNow;

    public Guid? EquipoId { get; set; }

    [ForeignKey(nameof(EquipoId))]
    public EquipoAutorizado? Equipo { get; set; }

    [Required]
    [MaxLength(50)]
    public string Metodo { get; set; } = "Automatico_Alumno"; // "Automatico_Alumno" o "Manual_Profesor"

    [Required]
    [MaxLength(50)]
    public string IpDetectada { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string HostnameDetectado { get; set; } = string.Empty;
}
