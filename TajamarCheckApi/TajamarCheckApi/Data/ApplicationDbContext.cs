using Microsoft.EntityFrameworkCore;
using TajamarCheckApi.Models;

namespace TajamarCheckApi.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<EquipoAutorizado> EquiposAutorizados { get; set; } = null!;
    public DbSet<Sesion> Sesiones { get; set; } = null!;
    public DbSet<Asistencia> Asistencias { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Asistencia>()
            .HasIndex(a => new { a.IdSesion, a.IdUsuario })
            .IsUnique();
    }
}