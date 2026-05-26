using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TajamarCheckApi.Data;
using TajamarCheckApi.Models;

namespace TajamarCheckApi.Controllers;

[ApiController]
[Route("api/attendance")]
public sealed class AttendanceController(ApplicationDbContext context) : ControllerBase
{
    // GET: api/attendance/absences/{studentId}
    [HttpGet("absences/{studentId:int}")]
    public async Task<IActionResult> GetAbsences(int studentId)
    {
        var absences = await context.Absences
            .Where(a => a.StudentId == studentId)
            .OrderByDescending(a => a.Date)
            .ToListAsync();

        return Ok(absences);
    }

    // GET: api/attendance/logs/{studentId}
    [HttpGet("logs/{studentId:int}")]
    public async Task<IActionResult> GetLogs(int studentId)
    {
        var logs = await context.AttendanceLogs
            .Where(l => l.StudentId == studentId)
            .OrderByDescending(l => l.Date)
            .ThenByDescending(l => l.CreatedAt)
            .ToListAsync();

        return Ok(logs);
    }

    // POST: api/attendance/absence
    [HttpPost("absence")]
    public async Task<IActionResult> CreateAbsence([FromBody] Absence absence)
    {
        if (absence == null)
        {
            return BadRequest(new { success = false, message = "Datos de falta no válidos." });
        }

        if (absence.StudentId <= 0)
        {
            return BadRequest(new { success = false, message = "El Id de estudiante es requerido y debe ser mayor a 0." });
        }

        if (string.IsNullOrWhiteSpace(absence.Subject))
        {
            return BadRequest(new { success = false, message = "La asignatura/materia es requerida." });
        }

        if (string.IsNullOrWhiteSpace(absence.Time))
        {
            return BadRequest(new { success = false, message = "El horario es requerido." });
        }

        if (absence.Date == default)
        {
            absence.Date = DateTime.Today;
        }

        context.Absences.Add(absence);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAbsences), new { studentId = absence.StudentId }, new { success = true, data = absence });
    }

    // POST: api/attendance/log
    [HttpPost("log")]
    public async Task<IActionResult> CreateLog([FromBody] AttendanceLog log)
    {
        if (log == null)
        {
            return BadRequest(new { success = false, message = "Datos de registro no válidos." });
        }

        if (log.StudentId <= 0)
        {
            return BadRequest(new { success = false, message = "El Id de estudiante es requerido y debe ser mayor a 0." });
        }

        if (string.IsNullOrWhiteSpace(log.Type))
        {
            return BadRequest(new { success = false, message = "El tipo de asistencia ('Entrada', 'Salida', 'Retraso') es requerido." });
        }

        var normalizedType = log.Type.Trim();
        if (!string.Equals(normalizedType, "Entrada", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(normalizedType, "Salida", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(normalizedType, "Retraso", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { success = false, message = "Tipo de registro no válido. Valores válidos: 'Entrada', 'Salida', 'Retraso'." });
        }

        // Normalizar tipo
        log.Type = normalizedType;

        if (string.IsNullOrWhiteSpace(log.Subject))
        {
            return BadRequest(new { success = false, message = "La asignatura/materia es requerida." });
        }

        if (string.IsNullOrWhiteSpace(log.Time))
        {
            return BadRequest(new { success = false, message = "La hora del registro es requerida." });
        }

        if (log.Date == default)
        {
            log.Date = DateTime.Today;
        }

        log.CreatedAt = DateTime.UtcNow;

        context.AttendanceLogs.Add(log);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLogs), new { studentId = log.StudentId }, new { success = true, data = log });
    }
}
