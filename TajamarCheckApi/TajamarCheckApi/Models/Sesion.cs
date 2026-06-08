using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TajamarCheckApi.Models;

[Table("Sesiones")]
public sealed class Sesion
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int IdSesion { get; set; }

    [Required]
    public int IdCurso { get; set; } = 1;

    [Required]
    public DateTime Fecha { get; set; } = DateTime.Today;

    [Required]
    public DateTime HoraApertura { get; set; } = DateTime.Now;

    public DateTime? HoraCierre { get; set; }

    [Required]
    [MaxLength(20)]
    public string TipoSesion { get; set; } = "Presencial"; // "Presencial", "Virtual"

    [Required]
    public bool EsRondaCambio { get; set; } = false;

    [Required]
    [MaxLength(20)]
    public string Estado { get; set; } = "Abierta"; // "Abierta", "Cerrada"
}
