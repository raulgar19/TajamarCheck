using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TajamarCheckApi.Models;

[Table("EquiposAutorizados")]
public sealed class EquipoAutorizado
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(150)]
    public string NombreDispositivo { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string DireccionIP { get; set; } = string.Empty;

    [Required]
    public bool Activo { get; set; } = true;
}
