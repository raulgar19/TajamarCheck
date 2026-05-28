using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TajamarCheckApi.Models;

[Table("Sesiones")]
public sealed class Sesion
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(50)]
    public string TipoClase { get; set; } = "Presencial"; // "Presencial" o "Casa"

    [Required]
    public DateTime Fecha { get; set; } = DateTime.Today;

    [Required]
    public int CursoId { get; set; } = 1;
}
