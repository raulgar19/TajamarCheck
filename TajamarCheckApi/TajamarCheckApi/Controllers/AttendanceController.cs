using System;
using System.Linq;
using System.Net;
using System.Net.Sockets;
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
    // ==========================================
    // LEGACY ENDPOINTS (Preserved & Extended)
    // ==========================================

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
            return BadRequest(new { success = false, message = "La asignatura/materia (subject) es requerida." });
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
            return BadRequest(new { success = false, message = "La asignatura/materia (subject) es requerida." });
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

    // ==========================================
    // NEW DAILY ROUNDS ENDPOINTS (Profesores)
    // ==========================================

    // GET: api/attendance/rondas
    [HttpGet("rondas")]
    public async Task<IActionResult> GetRondas()
    {
        var rondas = await context.Sesiones
            .OrderByDescending(s => s.Fecha)
            .ToListAsync();
        return Ok(rondas);
    }

    // GET: api/attendance/ronda-actual
    [HttpGet("ronda-actual")]
    public async Task<IActionResult> GetRondaActual()
    {
        var today = DateTime.Today;
        var ronda = await context.Sesiones
            .FirstOrDefaultAsync(s => s.Fecha.Date == today);
        
        return Ok(ronda);
    }

    // POST: api/attendance/rondas/abrir
    [HttpPost("rondas/abrir")]
    public async Task<IActionResult> AbrirRonda([FromBody] RondasRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.TipoClase))
        {
            return BadRequest(new { success = false, message = "El tipo de clase es obligatorio." });
        }

        if (request.TipoClase != "Presencial" && request.TipoClase != "Casa")
        {
            return BadRequest(new { success = false, message = "Tipo de clase inválido. Debe ser 'Presencial' o 'Casa'." });
        }

        var today = DateTime.Today;
        var existingRonda = await context.Sesiones
            .FirstOrDefaultAsync(s => s.Fecha.Date == today);

        if (existingRonda != null)
        {
            existingRonda.TipoClase = request.TipoClase;
            existingRonda.CursoId = request.CursoId <= 0 ? 1 : request.CursoId;
            existingRonda.PermitirCambioPC = request.PermitirCambioPC;
            context.Sesiones.Update(existingRonda);
            await context.SaveChangesAsync();
            return Ok(new { success = true, message = $"Ronda de hoy actualizada a '{request.TipoClase}'", data = existingRonda });
        }

        var nuevaRonda = new Sesion
        {
            TipoClase = request.TipoClase,
            Fecha = today,
            CursoId = request.CursoId <= 0 ? 1 : request.CursoId,
            PermitirCambioPC = request.PermitirCambioPC
        };

        context.Sesiones.Add(nuevaRonda);
        await context.SaveChangesAsync();

        return Created("", new { success = true, message = $"Ronda '{request.TipoClase}' abierta con éxito para hoy.", data = nuevaRonda });
    }

    // ==========================================
    // NEW STUDENT CHECK-IN ENDPOINT (Double-Factor)
    // ==========================================

    // POST: api/attendance/fichar/alumno
    [HttpPost("fichar/alumno")]
    public async Task<IActionResult> FicharAlumno([FromBody] FichajeAlumnoRequest request)
    {
        if (request == null || request.StudentId <= 0 || string.IsNullOrWhiteSpace(request.Type))
        {
            return BadRequest(new { success = false, message = "Los campos studentId y type ('Entrada'/'Salida') son requeridos." });
        }

        var today = DateTime.Today;
        var round = await context.Sesiones.FirstOrDefaultAsync(s => s.Fecha.Date == today);

        if (round == null)
        {
            return BadRequest(new { success = false, message = "Fichaje denegado: El profesor no ha abierto ninguna ronda de fichaje para el día de hoy." });
        }

        if (round.TipoClase == "Casa")
        {
            return StatusCode(403, new { success = false, message = "El fichaje autónomo está bloqueado para clases desde casa. El profesor registrará la asistencia manualmente." });
        }

        // Obtener IP del origen
        var rawIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var clientIp = NormalizeIpAddress(rawIp);

        // Obtener Hostname del header
        var clientHostname = HttpContext.Request.Headers["X-Client-Hostname"].ToString();
        if (string.IsNullOrWhiteSpace(clientHostname))
        {
            // Para pruebas en entorno local si no hay proxy inyectando la cabecera
            clientHostname = request.DevHostname ?? "";
        }

        if (string.IsNullOrWhiteSpace(clientHostname))
        {
            return BadRequest(new { success = false, message = "Fichaje denegado: No se pudo determinar el Hostname del dispositivo (Falta cabecera X-Client-Hostname)." });
        }

        // Validar contra EquiposAutorizados
        var device = await context.EquiposAutorizados
            .FirstOrDefaultAsync(d => d.NombreDispositivo.ToLower() == clientHostname.ToLower() && d.Activo);

        if (device == null)
        {
            return StatusCode(403, new { success = false, message = $"El dispositivo '{clientHostname}' no está registrado o activo en la lista blanca de equipos." });
        }

        // Validar que el dispositivo esté asignado a ESTE alumno (StudentId)
        if (device.StudentId != request.StudentId)
        {
            return StatusCode(403, new { success = false, message = $"Fichaje denegado: El dispositivo '{clientHostname}' no está asignado a tu cuenta de estudiante (ID: {request.StudentId})." });
        }

        // Validar IP (permitir coincidencia de IP registrada)
        var normalizedDeviceIp = NormalizeIpAddress(device.DireccionIP);
        if (normalizedDeviceIp != clientIp && normalizedDeviceIp != "127.0.0.1" && clientIp != "127.0.0.1")
        {
            return StatusCode(403, new { success = false, message = $"Fichaje denegado: La IP origen '{clientIp}' no coincide con la IP registrada para el dispositivo '{clientHostname}' ({device.DireccionIP})." });
        }

        // Registrar Fichaje
        var fichaje = new Fichaje
        {
            StudentId = request.StudentId,
            FechaHora = DateTime.UtcNow,
            EquipoId = device.Id,
            Metodo = "Automatico_Alumno",
            IpDetectada = clientIp,
            HostnameDetectado = clientHostname
        };
        context.Fichajes.Add(fichaje);

        // Registrar en AttendanceLogs (Legacy Sync) para que aparezca en estadísticas y calendario del alumno
        var legacyLog = new AttendanceLog
        {
            StudentId = request.StudentId,
            Type = request.Type, // "Entrada" o "Salida"
            Subject = $"Asistencia ({round.TipoClase})",
            Date = today,
            Time = DateTime.Now.ToString("HH:mm"),
            CreatedAt = DateTime.UtcNow,
            Text = $"Fichaje automático desde {clientHostname} ({clientIp})"
        };
        context.AttendanceLogs.Add(legacyLog);

        await context.SaveChangesAsync();

        return Ok(new { 
            success = true, 
            message = $"Fichaje de {request.Type} realizado con éxito.", 
            id = fichaje.Id,
            ip = clientIp,
            hostname = clientHostname
        });
    }

    // ==========================================
    // NEW DEVICE WHITELIST CRUD ENDPOINTS
    // ==========================================



    // GET: api/attendance/equipos
    [HttpGet("equipos")]
    public async Task<IActionResult> GetEquipos()
    {
        var equipos = await context.EquiposAutorizados
            .OrderBy(e => e.NombreDispositivo)
            .ToListAsync();
        return Ok(equipos);
    }

    // POST: api/attendance/equipos
    [HttpPost("equipos")]
    public async Task<IActionResult> CreateEquipo([FromBody] EquipoAutorizado equipo)
    {
        if (equipo == null || string.IsNullOrWhiteSpace(equipo.NombreDispositivo) || string.IsNullOrWhiteSpace(equipo.DireccionIP))
        {
            return BadRequest(new { success = false, message = "El nombre de dispositivo y la dirección IP son requeridos." });
        }

        var existe = await context.EquiposAutorizados
            .AnyAsync(e => e.NombreDispositivo.ToLower() == equipo.NombreDispositivo.ToLower());
        if (existe)
        {
            return BadRequest(new { success = false, message = "Ya existe un dispositivo registrado con este nombre." });
        }

        context.EquiposAutorizados.Add(equipo);
        await context.SaveChangesAsync();
        return Created("", equipo);
    }

    // GET: api/attendance/equipos/detectar-conexion
    [HttpGet("equipos/detectar-conexion")]
    public IActionResult DetectarConexion()
    {
        var rawIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var clientIp = NormalizeIpAddress(rawIp);

        // Si la conexión viene de localhost durante el desarrollo o prueba,
        // resolvemos la dirección IPv4 física activa asignada a la máquina (Wi-Fi o Ethernet)
        if (clientIp == "127.0.0.1" || clientIp == "::1" || clientIp == "0.0.0.1" || clientIp == "localhost")
        {
            clientIp = GetPhysicalNetworkIpAddress();
        }

        var clientHostname = HttpContext.Request.Headers["X-Client-Hostname"].ToString();
        if (string.IsNullOrWhiteSpace(clientHostname))
        {
            try
            {
                if (rawIp != "127.0.0.1" && rawIp != "::1" && rawIp != "0.0.0.1")
                {
                    var entry = System.Net.Dns.GetHostEntry(rawIp);
                    clientHostname = entry.HostName.Split('.')[0];
                }
                else
                {
                    clientHostname = System.Environment.MachineName;
                }
            }
            catch
            {
                clientHostname = System.Environment.MachineName; // Fallback al nombre de esta máquina
            }
        }

        return Ok(new { success = true, ip = clientIp, hostname = clientHostname });
    }

    // POST: api/attendance/equipos/registrar-alumno
    [HttpPost("equipos/registrar-alumno")]
    public async Task<IActionResult> RegistrarEquipoAlumno([FromBody] RegistrarEquipoAlumnoRequest request)
    {
        if (request == null || request.StudentId <= 0 || string.IsNullOrWhiteSpace(request.NombreDispositivo) || string.IsNullOrWhiteSpace(request.DireccionIP))
        {
            return BadRequest(new { success = false, message = "Todos los campos (studentId, nombreDispositivo, direccionIP) son requeridos." });
        }

        // Validar si el profesor permite el registro o cambio de PC para hoy
        var today = DateTime.Today;
        var round = await context.Sesiones.FirstOrDefaultAsync(s => s.Fecha.Date == today);
        if (round == null)
        {
            return StatusCode(403, new { success = false, message = "El registro o cambio de PC está denegado: El profesor no ha abierto ninguna ronda para el día de hoy." });
        }
        if (!round.PermitirCambioPC)
        {
            return StatusCode(403, new { success = false, message = "El registro o cambio de PC está bloqueado por el profesor para la sesión de hoy." });
        }

        // 1. Quitar la asignación previa que tuviera este alumno en cualquier PC
        var antiguosEquipos = await context.EquiposAutorizados
            .Where(e => e.StudentId == request.StudentId)
            .ToListAsync();
        
        foreach (var antiguo in antiguosEquipos)
        {
            antiguo.StudentId = null;
            context.EquiposAutorizados.Update(antiguo);
        }

        // 2. Buscar si el PC actual ya existe en la lista de EquiposAutorizados
        var pcExistente = await context.EquiposAutorizados
            .FirstOrDefaultAsync(e => e.NombreDispositivo.ToLower() == request.NombreDispositivo.ToLower());

        if (pcExistente != null)
        {
            // Si el PC existe, lo actualizamos con los datos del alumno y lo forzamos a estar Activo
            pcExistente.StudentId = request.StudentId;
            pcExistente.DireccionIP = request.DireccionIP;
            pcExistente.Activo = true;
            context.EquiposAutorizados.Update(pcExistente);
            await context.SaveChangesAsync();
            return Ok(new { success = true, message = $"Equipo '{request.NombreDispositivo}' asignado con éxito a tu cuenta.", data = pcExistente });
        }
        else
        {
            // Si no existe, creamos un nuevo registro de equipo asignado a este alumno
            var nuevoEquipo = new EquipoAutorizado
            {
                NombreDispositivo = request.NombreDispositivo,
                DireccionIP = request.DireccionIP,
                StudentId = request.StudentId,
                Activo = true
            };
            context.EquiposAutorizados.Add(nuevoEquipo);
            await context.SaveChangesAsync();
            return Created("", new { success = true, message = $"Equipo '{request.NombreDispositivo}' registrado y asignado con éxito a tu cuenta.", data = nuevoEquipo });
        }
    }

    // PUT: api/attendance/equipos/{id}
    [HttpPut("equipos/{id:guid}")]
    public async Task<IActionResult> UpdateEquipo(Guid id, [FromBody] EquipoAutorizado equipo)
    {
        if (equipo == null || id != equipo.Id)
        {
            return BadRequest(new { success = false, message = "Datos de dispositivo no válidos." });
        }

        var dbEquipo = await context.EquiposAutorizados.FindAsync(id);
        if (dbEquipo == null)
        {
            return NotFound(new { success = false, message = "Dispositivo no encontrado." });
        }

        dbEquipo.NombreDispositivo = equipo.NombreDispositivo;
        dbEquipo.DireccionIP = equipo.DireccionIP;
        dbEquipo.Activo = equipo.Activo;

        context.EquiposAutorizados.Update(dbEquipo);
        await context.SaveChangesAsync();
        return Ok(dbEquipo);
    }

    // DELETE: api/attendance/equipos/{id}
    [HttpDelete("equipos/{id:guid}")]
    public async Task<IActionResult> DeleteEquipo(Guid id)
    {
        var dbEquipo = await context.EquiposAutorizados.FindAsync(id);
        if (dbEquipo == null)
        {
            return NotFound(new { success = false, message = "Dispositivo no encontrado." });
        }

        context.EquiposAutorizados.Remove(dbEquipo);
        await context.SaveChangesAsync();
        return NoContent();
    }

    // ==========================================
    // UTILITIES
    // ==========================================

    private string NormalizeIpAddress(string ip)
    {
        if (ip == "::1") return "127.0.0.1";
        // Si tiene puerto o es IPv6 mapeada, extraer IPv4
        if (ip.Contains("::ffff:"))
        {
            return ip.Replace("::ffff:", "");
        }
        return ip;
    }

    private string GetPhysicalNetworkIpAddress()
    {
        try
        {
            var interfaces = System.Net.NetworkInformation.NetworkInterface.GetAllNetworkInterfaces();
            string wifiIp = "";
            string ethernetIp = "";
            string fallbackIp = "";

            foreach (var ni in interfaces)
            {
                if (ni.OperationalStatus != System.Net.NetworkInformation.OperationalStatus.Up)
                    continue;

                var type = ni.NetworkInterfaceType;
                if (type != System.Net.NetworkInformation.NetworkInterfaceType.Ethernet && 
                    type != System.Net.NetworkInformation.NetworkInterfaceType.Wireless80211)
                    continue;

                string name = ni.Name.ToLower();
                string desc = ni.Description.ToLower();
                if (name.Contains("virtual") || name.Contains("vethernet") || name.Contains("vmware") || 
                    name.Contains("virtualbox") || name.Contains("wsl") || name.Contains("loopback") || 
                    name.Contains("pseudo") || name.Contains("hyper-v") ||
                    desc.Contains("virtual") || desc.Contains("vethernet") || desc.Contains("vmware") || 
                    desc.Contains("virtualbox") || desc.Contains("wsl") || desc.Contains("loopback") || 
                    desc.Contains("pseudo") || desc.Contains("hyper-v"))
                    continue;

                var ipProps = ni.GetIPProperties();
                foreach (var addr in ipProps.UnicastAddresses)
                {
                    if (addr.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                    {
                        var ipStr = addr.Address.ToString();
                        if (ipStr != "127.0.0.1")
                        {
                            if (type == System.Net.NetworkInformation.NetworkInterfaceType.Wireless80211)
                            {
                                wifiIp = ipStr;
                            }
                            else if (type == System.Net.NetworkInformation.NetworkInterfaceType.Ethernet)
                            {
                                ethernetIp = ipStr;
                            }
                            else
                            {
                                fallbackIp = ipStr;
                            }
                        }
                    }
                }
            }

            if (!string.IsNullOrEmpty(wifiIp)) return wifiIp;
            if (!string.IsNullOrEmpty(ethernetIp)) return ethernetIp;
            if (!string.IsNullOrEmpty(fallbackIp)) return fallbackIp;
        }
        catch
        {
            // Ignorar
        }

        return "127.0.0.1";
    }

}

// ==========================================
// REQUEST DTOs
// ==========================================

public sealed class RondasRequest
{
    public string TipoClase { get; set; } = string.Empty; // "Presencial" o "Casa"
    public int CursoId { get; set; } = 1;
    public bool PermitirCambioPC { get; set; } = false;
}

public sealed class FichajeAlumnoRequest
{
    public int StudentId { get; set; }
    public string Type { get; set; } = string.Empty; // "Entrada" o "Salida"
    public string? DevHostname { get; set; } // Opcional para pruebas locales
}

public sealed class RegistrarEquipoAlumnoRequest
{
    public int StudentId { get; set; }
    public string NombreDispositivo { get; set; } = string.Empty;
    public string DireccionIP { get; set; } = string.Empty;
}
