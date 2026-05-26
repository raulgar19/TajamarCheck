using Microsoft.EntityFrameworkCore;
using TajamarCheckApi.Models;

namespace TajamarCheckApi.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Absence> Absences { get; set; } = null!;
    public DbSet<AttendanceLog> AttendanceLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    }
}