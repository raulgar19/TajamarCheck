using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TajamarCheckApi.Models;

[Table("EquiposAutorizados")]
public sealed class EquipoAutorizado
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int IdEquipo { get; set; }

    [Required]
    [MaxLength(100)]
    public string NombreEquipo { get; set; } = string.Empty;

    [Required]
    [MaxLength(45)]
    public string IPAsignada { get; set; } = string.Empty;

    public int? IdUsuarioActual { get; set; }

    [Required]
    public DateTime FechaAsignacion { get; set; } = DateTime.Now;
}