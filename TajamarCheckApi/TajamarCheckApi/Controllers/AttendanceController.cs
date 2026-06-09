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
    // LEGACY & COMPATIBILITY ENDPOINTS (Alumnos)
    // ==========================================

    // GET: api/attendance/absences/{studentId}
    [HttpGet("absences/{studentId:int}")]
    public async Task<IActionResult> GetAbsences(int studentId)
    {
        var absences = await context.Asistencias
            .Include(a => a.Sesion)
            .Where(a => a.IdUsuario == studentId && a.EstadoAsistencia == "Falta")
            .OrderByDescending(a => a.HoraFichaje)
            .Select(a => new
            {
                id = a.IdAsistencia,
                studentId = a.IdUsuario,
                subject = a.Sesion != null ? $"Asistencia ({a.Sesion.TipoSesion})" : "Asistencia Clase",
                date = a.Sesion != null ? a.Sesion.Fecha : a.HoraFichaje.Date,
                time = a.HoraFichaje.ToString("HH:mm"),
                justificacion = a.Justificacion,
                estaJustificada = a.EstaJustificada
            })
            .ToListAsync();

        return Ok(absences);
    }

    // GET: api/attendance/logs/{studentId}
    [HttpGet("logs/{studentId:int}")]
    public async Task<IActionResult> GetLogs(int studentId)
    {
        var logs = await context.Asistencias
            .Include(a => a.Sesion)
            .Where(a => a.IdUsuario == studentId && (a.EstadoAsistencia == "Presente" || a.EstadoAsistencia == "Retraso"))
            .OrderByDescending(a => a.HoraFichaje)
            .Select(a => new
            {
                id = a.IdAsistencia,
                studentId = a.IdUsuario,
                type = a.EstadoAsistencia == "Presente" ? "Entrada" : "Retraso",
                subject = a.Sesion != null ? $"Asistencia ({a.Sesion.TipoSesion})" : "Asistencia Clase",
                date = a.Sesion != null ? a.Sesion.Fecha : a.HoraFichaje.Date,
                time = a.HoraFichaje.ToString("HH:mm"),
                minutes = a.EstadoAsistencia == "Retraso" ? 15 : 0, // Fallback minutes
                text = a.Justificacion ?? (a.EstadoAsistencia == "Retraso" ? "Retraso en la llegada" : "Fichaje realizado"),
                justificacion = a.Justificacion,
                estaJustificada = a.EstaJustificada
            })
            .ToListAsync();

        return Ok(logs);
    }

    // ==========================================
    // DAILY ROUNDS ENDPOINTS (Profesores)
    // ==========================================

    // GET: api/attendance/rondas
    [HttpGet("rondas")]
    public async Task<IActionResult> GetRondas()
    {
        var rondas = await context.Sesiones
            .OrderByDescending(s => s.Fecha)
            .Select(s => new
            {
                id = s.IdSesion, // Map to old string/int ID
                tipoClase = s.TipoSesion == "Virtual" ? "Casa" : "Presencial",
                fecha = s.Fecha,
                cursoId = s.IdCurso,
                permitirCambioPC = s.EsRondaCambio
            })
            .ToListAsync();
        return Ok(rondas);
    }

    // GET: api/attendance/ronda-actual
    [HttpGet("ronda-actual")]
    public async Task<IActionResult> GetRondaActual()
    {
        var today = DateTime.Today;
        var ronda = await context.Sesiones
            .FirstOrDefaultAsync(s => s.Fecha == today && s.Estado == "Abierta");
        
        if (ronda == null) return Ok(null);

        return Ok(new
        {
            id = ronda.IdSesion,
            tipoClase = ronda.TipoSesion == "Virtual" ? "Casa" : "Presencial",
            fecha = ronda.Fecha,
            cursoId = ronda.IdCurso,
            permitirCambioPC = ronda.EsRondaCambio
        });
    }

    // POST: api/attendance/rondas/abrir
    [HttpPost("rondas/abrir")]
    public async Task<IActionResult> AbrirRonda([FromBody] RondasRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.TipoClase))
        {
            return BadRequest(new { success = false, message = "El tipo de clase es obligatorio." });
        }

        var tipoClaseMapped = request.TipoClase == "Casa" ? "Virtual" : "Presencial";

        var today = DateTime.Today;
        var existingRonda = await context.Sesiones
            .FirstOrDefaultAsync(s => s.Fecha == today && s.Estado == "Abierta");

        if (existingRonda != null)
        {
            existingRonda.TipoSesion = tipoClaseMapped;
            existingRonda.IdCurso = request.CursoId <= 0 ? 1 : request.CursoId;
            existingRonda.EsRondaCambio = request.PermitirCambioPC;
            
            if (request.EliminarEquipos)
            {
                var equipos = await context.EquiposAutorizados.ToListAsync();
                context.EquiposAutorizados.RemoveRange(equipos);
            }
            else if (request.DesvincularTodos)
            {
                var equipos = await context.EquiposAutorizados.ToListAsync();
                foreach (var eq in equipos)
                {
                    eq.IdUsuarioActual = null;
                }
            }

            context.Sesiones.Update(existingRonda);
            await context.SaveChangesAsync();

            return Ok(new { 
                success = true, 
                message = $"Ronda de hoy actualizada a '{request.TipoClase}'", 
                data = new {
                    id = existingRonda.IdSesion,
                    tipoClase = request.TipoClase,
                    fecha = existingRonda.Fecha,
                    cursoId = existingRonda.IdCurso,
                    permitirCambioPC = existingRonda.EsRondaCambio
                }
            });
        }

        var nuevaRonda = new Sesion
        {
            TipoSesion = tipoClaseMapped,
            Fecha = today,
            HoraApertura = DateTime.Now,
            IdCurso = request.CursoId <= 0 ? 1 : request.CursoId,
            EsRondaCambio = request.PermitirCambioPC,
            Estado = "Abierta"
        };

        if (request.EliminarEquipos)
        {
            var equipos = await context.EquiposAutorizados.ToListAsync();
            context.EquiposAutorizados.RemoveRange(equipos);
        }
        else if (request.DesvincularTodos)
        {
            var equipos = await context.EquiposAutorizados.ToListAsync();
            foreach (var eq in equipos)
            {
                eq.IdUsuarioActual = null;
            }
        }

        context.Sesiones.Add(nuevaRonda);
        await context.SaveChangesAsync();

        return Created("", new { 
            success = true, 
            message = $"Ronda '{request.TipoClase}' abierta con éxito para hoy.", 
            data = new {
                id = nuevaRonda.IdSesion,
                tipoClase = request.TipoClase,
                fecha = nuevaRonda.Fecha,
                cursoId = nuevaRonda.IdCurso,
                permitirCambioPC = nuevaRonda.EsRondaCambio
            }
        });
    }

    // ==========================================
    // STUDENT CHECK-IN ENDPOINT (Time-based & IP)
    // ==========================================

    // POST: api/attendance/fichar/alumno
    [HttpPost("fichar/alumno")]
    public async Task<IActionResult> FicharAlumno([FromBody] FichajeAlumnoRequest request)
    {
        if (request == null || request.StudentId <= 0)
        {
            return BadRequest(new { success = false, message = "El campo studentId es requerido." });
        }

        var today = DateTime.Today;
        var session = await context.Sesiones.FirstOrDefaultAsync(s => s.Fecha == today && s.Estado == "Abierta");

        if (session == null)
        {
            return BadRequest(new { success = false, message = "Fichaje denegado: El profesor no ha abierto ninguna ronda de fichaje para el día de hoy." });
        }

        if (session.TipoSesion == "Virtual")
        {
            return StatusCode(403, new { success = false, message = "El fichaje autónomo está bloqueado para clases desde casa. El profesor registrará la asistencia manualmente." });
        }

        // Obtener IP del origen
        var clientIp = GetClientIpAddress();


        // Obtener equipo registrado para el alumno
        var device = await context.EquiposAutorizados
            .FirstOrDefaultAsync(d => d.IdUsuarioActual == request.StudentId);

        if (device == null)
        {
            return StatusCode(403, new { success = false, message = "Fichaje denegado: No tienes ningún PC registrado a tu cuenta. Debes registrar tu ordenador primero." });
        }

        // Validar IP (permitir coincidencia o localhost para pruebas)
        var normalizedDeviceIp = NormalizeIpAddress(device.IPAsignada);
        if (normalizedDeviceIp != clientIp && normalizedDeviceIp != "127.0.0.1" && clientIp != "127.0.0.1")
        {
            return StatusCode(403, new { success = false, message = $"Fichaje denegado: Tu IP de conexión '{clientIp}' no coincide con la IP registrada de tu ordenador '{device.NombreEquipo}' ({device.IPAsignada})." });
        }

        // Calcular estado de asistencia basado en la hora de apertura
        var diffMinutes = (DateTime.Now - session.HoraApertura).TotalMinutes;
        string estadoAsistencia = "Presente";
        string msg = "";

        if (diffMinutes <= 10)
        {
            estadoAsistencia = "Presente";
            msg = "Fichado a tiempo (Presente).";
        }
        else if (diffMinutes <= 60)
        {
            estadoAsistencia = "Retraso";
            msg = $"Fichado con retraso ({Math.Round(diffMinutes)} min después de la apertura).";
        }
        else
        {
            estadoAsistencia = "Falta";
            msg = $"Fichado fuera de hora. Se registra como Falta de asistencia ({Math.Round(diffMinutes)} min después).";
        }

        // Registrar o actualizar Asistencia
        var existingAsistencia = await context.Asistencias
            .FirstOrDefaultAsync(a => a.IdSesion == session.IdSesion && a.IdUsuario == request.StudentId);

        // Bloquear re-fichaje si ya tiene un registro de Presente o Retraso
        if (existingAsistencia != null && (existingAsistencia.EstadoAsistencia == "Presente" || existingAsistencia.EstadoAsistencia == "Retraso"))
        {
            return StatusCode(409, new
            {
                success = false,
                message = $"Ya has registrado tu asistencia para la sesión de hoy a las {existingAsistencia.HoraFichaje:HH:mm}. No es posible fichar de nuevo."
            });
        }


        if (existingAsistencia != null)
        {
            existingAsistencia.HoraFichaje = DateTime.Now;
            existingAsistencia.IPUtilizada = clientIp;
            existingAsistencia.EstadoAsistencia = estadoAsistencia;
            existingAsistencia.Justificacion = $"Fichaje automático ({estadoAsistencia})";
            if (!string.IsNullOrWhiteSpace(request.NombreUsuario))
            {
                existingAsistencia.NombreUsuario = request.NombreUsuario;
            }
            context.Asistencias.Update(existingAsistencia);
        }
        else
        {
            var newAsis = new Asistencia
            {
                IdSesion = session.IdSesion,
                IdUsuario = request.StudentId,
                NombreUsuario = !string.IsNullOrWhiteSpace(request.NombreUsuario) ? request.NombreUsuario : GetStudentNameLocal(request.StudentId),
                HoraFichaje = DateTime.Now,
                IPUtilizada = clientIp,
                EstadoAsistencia = estadoAsistencia,
                Justificacion = $"Fichaje automático ({estadoAsistencia})",
                EstaJustificada = false
            };
            context.Asistencias.Add(newAsis);
        }

        await context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = $"Fichaje registrado con éxito. Estado: {estadoAsistencia}. {msg}",
            hostname = device.NombreEquipo,
            ip = clientIp
        });
    }

    // ==========================================
    // DEVICE REGISTRATION AND WHITELIST CRUD
    // ==========================================

    // GET: api/attendance/fichajes/sesion/{sessionId}
    [HttpGet("fichajes/sesion/{sessionId:int}")]
    public async Task<IActionResult> GetFichajesPorSesion(int sessionId)
    {
        var sesion = await context.Sesiones.FirstOrDefaultAsync(s => s.IdSesion == sessionId);
        if (sesion == null)
        {
            return NotFound(new { success = false, message = "Sesión no encontrada." });
        }

        var fichajes = await context.Asistencias
            .Where(f => f.IdSesion == sessionId)
            .OrderByDescending(f => f.HoraFichaje)
            .Select(f => new
            {
                studentId = f.IdUsuario,
                studentName = f.NombreUsuario,
                fechaHora = f.HoraFichaje,
                metodo = "Automático",
                ipDetectada = f.IPUtilizada ?? "N/A",
                hostnameDetectado = "Dispositivo del Alumno",
                equipo = context.EquiposAutorizados.FirstOrDefault(e => e.IdUsuarioActual == f.IdUsuario)
            })
            .ToListAsync();

        return Ok(new { success = true, session = new { id = sesion.IdSesion, tipoClase = sesion.TipoSesion == "Virtual" ? "Casa" : "Presencial", fecha = sesion.Fecha }, data = fichajes });
    }

    // GET: api/attendance/fichajes/sesion-actual
    [HttpGet("fichajes/sesion-actual")]
    public async Task<IActionResult> GetFichajesSesionActual()
    {
        var today = DateTime.Today;
        var ronda = await context.Sesiones.FirstOrDefaultAsync(s => s.Fecha == today && s.Estado == "Abierta");
        if (ronda == null)
        {
            return NotFound(new { success = false, message = "No hay sesión abierta para hoy." });
        }

        return await GetFichajesPorSesion(ronda.IdSesion);
    }

    // GET: api/attendance/equipos
    [HttpGet("equipos")]
    public async Task<IActionResult> GetEquipos()
    {
        var equipos = await context.EquiposAutorizados
            .OrderBy(e => e.NombreEquipo)
            .Select(e => new
            {
                id = e.IdEquipo, // Compatibility
                nombreDispositivo = e.NombreEquipo,
                direccionIP = e.IPAsignada,
                activo = true,
                studentId = e.IdUsuarioActual
            })
            .ToListAsync();
        return Ok(equipos);
    }

    // POST: api/attendance/equipos
    [HttpPost("equipos")]
    public async Task<IActionResult> CreateEquipo([FromBody] EquipoCompatibilityDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.NombreDispositivo) || string.IsNullOrWhiteSpace(dto.DireccionIP))
        {
            return BadRequest(new { success = false, message = "El nombre de dispositivo y la dirección IP son requeridos." });
        }

        var existe = await context.EquiposAutorizados
            .AnyAsync(e => e.IPAsignada == dto.DireccionIP || e.NombreEquipo.ToLower() == dto.NombreDispositivo.ToLower());
        if (existe)
        {
            return BadRequest(new { success = false, message = "Ya existe un dispositivo registrado con esta IP o nombre." });
        }

        var equipo = new EquipoAutorizado
        {
            NombreEquipo = dto.NombreDispositivo,
            IPAsignada = dto.DireccionIP,
            IdUsuarioActual = dto.StudentId,
            FechaAsignacion = DateTime.Now
        };

        context.EquiposAutorizados.Add(equipo);
        await context.SaveChangesAsync();
        
        return Created("", new
        {
            id = equipo.IdEquipo,
            nombreDispositivo = equipo.NombreEquipo,
            direccionIP = equipo.IPAsignada,
            activo = true,
            studentId = equipo.IdUsuarioActual
        });
    }

    // GET: api/attendance/equipos/detectar-conexion
    [HttpGet("equipos/detectar-conexion")]
    public IActionResult DetectarConexion()
    {
        var clientIp = GetClientIpAddress();

        var clientHostname = System.Environment.MachineName;

        return Ok(new { success = true, ip = clientIp, hostname = clientHostname });
    }

    // POST: api/attendance/equipos/registrar-alumno
    [HttpPost("equipos/registrar-alumno")]
    public async Task<IActionResult> RegistrarEquipoAlumno([FromBody] RegistrarEquipoAlumnoRequest request)
    {
        if (request == null || request.StudentId <= 0 || string.IsNullOrWhiteSpace(request.DireccionIP))
        {
            return BadRequest(new { success = false, message = "El id de estudiante y la dirección IP son requeridos." });
        }

        // Validar si el profesor permite el registro (EsRondaCambio == true) en la sesión de hoy
        var today = DateTime.Today;
        var round = await context.Sesiones.FirstOrDefaultAsync(s => s.Fecha == today && s.Estado == "Abierta");
        if (round == null)
        {
            return StatusCode(403, new { success = false, message = "El registro de PC está denegado: El profesor no ha abierto ninguna ronda para el día de hoy." });
        }
        if (!round.EsRondaCambio)
        {
            return StatusCode(403, new { success = false, message = "El registro o cambio de PC está bloqueado por el profesor para la sesión de hoy." });
        }

        // 1. Quitar la asignación previa que tuviera este alumno en cualquier PC
        var antiguosEquipos = await context.EquiposAutorizados
            .Where(e => e.IdUsuarioActual == request.StudentId)
            .ToListAsync();
        
        foreach (var antiguo in antiguosEquipos)
        {
            antiguo.IdUsuarioActual = null;
            context.EquiposAutorizados.Update(antiguo);
        }

        // 2. Buscar si el PC actual ya existe en la lista de EquiposAutorizados
        var pcExistente = await context.EquiposAutorizados
            .FirstOrDefaultAsync(e => e.IPAsignada == request.DireccionIP);

        if (pcExistente != null)
        {
            pcExistente.IdUsuarioActual = request.StudentId;
            pcExistente.FechaAsignacion = DateTime.Now;
            if (!string.IsNullOrWhiteSpace(request.NombreDispositivo))
            {
                pcExistente.NombreEquipo = request.NombreDispositivo;
            }
            context.EquiposAutorizados.Update(pcExistente);
            await context.SaveChangesAsync();
            return Ok(new { success = true, message = $"Equipo '{pcExistente.NombreEquipo}' asignado con éxito a tu cuenta.", data = pcExistente });
        }
        else
        {
            var friendlyName = string.IsNullOrWhiteSpace(request.NombreDispositivo) ? $"PC-IP-{request.DireccionIP.Split('.').Last()}" : request.NombreDispositivo;
            var nuevoEquipo = new EquipoAutorizado
            {
                NombreEquipo = friendlyName,
                IPAsignada = request.DireccionIP,
                IdUsuarioActual = request.StudentId,
                FechaAsignacion = DateTime.Now
            };
            context.EquiposAutorizados.Add(nuevoEquipo);
            await context.SaveChangesAsync();
            return Created("", new { success = true, message = $"Equipo '{friendlyName}' registrado y asignado con éxito a tu cuenta.", data = nuevoEquipo });
        }
    }

    // PUT: api/attendance/equipos/{id}
    [HttpPut("equipos/{id:int}")]
    public async Task<IActionResult> UpdateEquipo(int id, [FromBody] EquipoCompatibilityDto dto)
    {
        if (dto == null || id != dto.Id)
        {
            return BadRequest(new { success = false, message = "Datos de dispositivo no válidos." });
        }

        var dbEquipo = await context.EquiposAutorizados.FindAsync(id);
        if (dbEquipo == null)
        {
            return NotFound(new { success = false, message = "Dispositivo no encontrado." });
        }

        dbEquipo.NombreEquipo = dto.NombreDispositivo;
        dbEquipo.IPAsignada = dto.DireccionIP;
        dbEquipo.IdUsuarioActual = dto.StudentId;

        context.EquiposAutorizados.Update(dbEquipo);
        await context.SaveChangesAsync();
        return Ok(dto);
    }

    // DELETE: api/attendance/equipos/{id}
    [HttpDelete("equipos/{id:int}")]
    public async Task<IActionResult> DeleteEquipo(int id)
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
    // ADMIN / MANUAL ATTENDANCE ENDPOINTS
    // ==========================================

    // POST: /api/admin/asistencia-manual
    [HttpPost("/api/admin/asistencia-manual")]
    public async Task<IActionResult> RegistrarAsistenciaManual([FromBody] AsistenciaManualRequest request)
    {
        if (request == null || request.StudentId <= 0 || request.SessionId <= 0)
        {
            return BadRequest(new { success = false, message = "Los campos studentId y sessionId son obligatorios." });
        }

        var session = await context.Sesiones.FindAsync(request.SessionId);
        if (session == null)
        {
            return NotFound(new { error = "La sesión de clase especificada no existe." });
        }

        // Normalizar y mapear el tipo de asistencia
        var typeMapped = "Presente";
        if (!string.IsNullOrWhiteSpace(request.Type))
        {
            var rawType = request.Type.ToLower();
            if (rawType.Contains("falta") || rawType.Contains("abs")) typeMapped = "Falta";
            else if (rawType.Contains("retra") || rawType.Contains("delay")) typeMapped = "Retraso";
            else typeMapped = "Presente";
        }

        // Buscar si ya existe una asistencia para la combinación Sesión + Alumno
        var existing = await context.Asistencias
            .FirstOrDefaultAsync(a => a.IdSesion == request.SessionId && a.IdUsuario == request.StudentId);

        if (existing != null)
        {
            existing.EstadoAsistencia = typeMapped;
            existing.Justificacion = request.Text ?? $"Registro manual ({typeMapped}) por profesor.";
            existing.HoraFichaje = DateTime.Now;
            if (!string.IsNullOrWhiteSpace(request.NombreUsuario))
            {
                existing.NombreUsuario = request.NombreUsuario;
            }
            context.Asistencias.Update(existing);
        }
        else
        {
            var newAsis = new Asistencia
            {
                IdSesion = request.SessionId,
                IdUsuario = request.StudentId,
                NombreUsuario = !string.IsNullOrWhiteSpace(request.NombreUsuario) ? request.NombreUsuario : GetStudentNameLocal(request.StudentId),
                HoraFichaje = DateTime.Now,
                IPUtilizada = "Manual_Profesor",
                EstadoAsistencia = typeMapped,
                Justificacion = request.Text ?? $"Registro manual ({typeMapped}) por profesor.",
                EstaJustificada = false
            };
            context.Asistencias.Add(newAsis);
        }

        await context.SaveChangesAsync();
        return Ok(new { mensaje = "Fichaje manual registrado por el profesor con éxito.", id = request.StudentId.ToString() });
    }

    // GET: api/attendance/diario
    [HttpGet("diario")]
    public async Task<IActionResult> GetReporteDiario([FromQuery] DateTime? date)
    {
        var targetDate = (date ?? DateTime.Today).Date;

        var asistencias = await context.Asistencias
            .Include(a => a.Sesion)
            .Where(a => a.HoraFichaje.Date == targetDate || (a.Sesion != null && a.Sesion.Fecha == targetDate))
            .ToListAsync();

        return Ok(new
        {
            logs = asistencias
                .Where(a => a.EstadoAsistencia == "Presente" || a.EstadoAsistencia == "Retraso")
                .Select(a => new
                {
                    id = a.IdAsistencia,
                    studentId = a.IdUsuario,
                    studentName = a.NombreUsuario,
                    type = a.EstadoAsistencia == "Presente" ? "Entrada" : "Retraso",
                    subject = a.Sesion != null ? $"Asistencia ({a.Sesion.TipoSesion})" : "Asistencia Clase",
                    time = a.HoraFichaje.ToString("HH:mm"),
                    minutes = a.EstadoAsistencia == "Retraso" ? 15 : 0,
                    text = a.Justificacion,
                    justificacion = a.Justificacion,
                    estaJustificada = a.EstaJustificada
                }),
            absences = asistencias
                .Where(a => a.EstadoAsistencia == "Falta")
                .Select(a => new
                {
                    id = a.IdAsistencia,
                    studentId = a.IdUsuario,
                    studentName = a.NombreUsuario,
                    subject = a.Sesion != null ? $"Asistencia ({a.Sesion.TipoSesion})" : "Asistencia Clase",
                    time = a.HoraFichaje.ToString("HH:mm"),
                    justificacion = a.Justificacion,
                    estaJustificada = a.EstaJustificada
                })
        });
    }

    // GET: api/attendance/rondas/{sessionId}/asistentes
    [HttpGet("rondas/{sessionId:int}/asistentes")]
    public async Task<IActionResult> GetAsistentesPorSesion(int sessionId)
    {
        var session = await context.Sesiones.FindAsync(sessionId);
        if (session == null)
        {
            return NotFound(new { success = false, message = "Sesión no encontrada." });
        }

        var asistencias = await context.Asistencias
            .Where(a => a.IdSesion == sessionId)
            .ToListAsync();

        var studentIds = asistencias.Select(a => a.IdUsuario).Distinct().ToList();
        var equipos = await context.EquiposAutorizados
            .Where(e => e.IdUsuarioActual != null && studentIds.Contains(e.IdUsuarioActual.Value))
            .ToListAsync();

        var asistentes = asistencias
            .Select(a => new
            {
                id = a.IdAsistencia,
                studentId = a.IdUsuario,
                studentName = a.NombreUsuario,
                fechaHora = a.HoraFichaje,
                ultimaActividad = a.HoraFichaje,
                metodo = a.IPUtilizada == "Manual_Profesor" ? "Manual_Profesor" : "Automatico_Alumno",
                ip = a.IPUtilizada ?? "-",
                hostname = a.IPUtilizada == "Manual_Profesor" ? "Casa/Manual" : "Dispositivo del Alumno",
                source = "Fichaje",
                totalRegistros = 1,
                tipo = a.EstadoAsistencia == "Presente" ? "Entrada" : a.EstadoAsistencia, // Map for UI compatibility
                subject = "Clase",
                text = a.Justificacion,
                estaJustificada = a.EstaJustificada,
                equipo = equipos.FirstOrDefault(e => e.IdUsuarioActual == a.IdUsuario)
            })
            .OrderByDescending(x => x.fechaHora)
            .ToList();

        return Ok(new { success = true, session = sessionId, date = session.Fecha, attendees = asistentes });
    }

    // DELETE: api/attendance/diario/{studentId:int}
    [HttpDelete("diario/{studentId:int}")]
    public async Task<IActionResult> ClearDiario(int studentId, [FromQuery] DateTime? date)
    {
        var targetDate = (date ?? DateTime.Today).Date;

        var asistencias = await context.Asistencias
            .Include(a => a.Sesion)
            .Where(a => a.IdUsuario == studentId && (a.HoraFichaje.Date == targetDate || (a.Sesion != null && a.Sesion.Fecha == targetDate)))
            .ToListAsync();

        if (asistencias.Any())
        {
            context.Asistencias.RemoveRange(asistencias);
            await context.SaveChangesAsync();
        }

        return Ok(new { success = true, mensaje = $"Registros del alumno ID {studentId} para el día {targetDate:yyyy-MM-dd} eliminados con éxito." });
    }

    // ==========================================
    // UTILITIES
    // ==========================================

    private string GetStudentNameLocal(int studentId)
    {
        return studentId switch
        {
            1 => "Raúl García",
            2 => "Sofia Martín",
            3 => "Carlos Gomez",
            4 => "Ana Belén Ortiz",
            101 => "Estudiante Tajamar (Pruebas)",
            _ => $"Estudiante #{studentId}"
        };
    }

    private string GetClientIpAddress()
    {
        string rawIp = "";
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedHeader))
        {
            var ipList = forwardedHeader.ToString().Split(',', StringSplitOptions.RemoveEmptyEntries);
            if (ipList.Length > 0)
            {
                rawIp = ipList[0].Trim();
            }
        }

        if (string.IsNullOrWhiteSpace(rawIp) && Request.Headers.TryGetValue("X-Real-IP", out var realIpHeader))
        {
            rawIp = realIpHeader.ToString().Trim();
        }

        if (string.IsNullOrWhiteSpace(rawIp))
        {
            rawIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        }

        var clientIp = NormalizeIpAddress(rawIp);

        if (clientIp == "127.0.0.1" || clientIp == "::1" || clientIp == "localhost")
        {
            clientIp = GetPhysicalNetworkIpAddress();
        }

        return clientIp;
    }

    private string NormalizeIpAddress(string ip)
    {
        if (ip == "::1") return "127.0.0.1";
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

    // POST: api/attendance/absences/{id:int}/justify
    [HttpPost("absences/{id:int}/justify")]
    public async Task<IActionResult> JustificarFalta(int id, [FromBody] JustificarFaltaRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Justificacion))
        {
            return BadRequest(new { success = false, message = "La justificación es requerida." });
        }

        var asistencia = await context.Asistencias.FindAsync(id);
        if (asistencia == null)
        {
            return NotFound(new { success = false, message = "Asistencia no encontrada." });
        }

        asistencia.Justificacion = request.Justificacion;
        asistencia.EstaJustificada = false; // Se marca como pendiente (no justificada aún)

        context.Asistencias.Update(asistencia);
        await context.SaveChangesAsync();

        return Ok(new { success = true, message = "Justificación registrada. Pendiente de aprobación por el profesor." });
    }

    // POST: api/attendance/absences/{id:int}/review-justification
    [HttpPost("absences/{id:int}/review-justification")]
    public async Task<IActionResult> ReviewJustification(int id, [FromBody] ReviewJustificacionRequest request)
    {
        var asistencia = await context.Asistencias.FindAsync(id);
        if (asistencia == null)
        {
            return NotFound(new { success = false, message = "Asistencia no encontrada." });
        }

        asistencia.EstaJustificada = request.Aceptar;

        context.Asistencias.Update(asistencia);
        await context.SaveChangesAsync();

        return Ok(new { success = true, message = request.Aceptar ? "Justificación aceptada." : "Justificación rechazada." });
    }

    // POST: api/attendance/absences/{id:int}/justify-teacher
    [HttpPost("absences/{id:int}/justify-teacher")]
    public async Task<IActionResult> JustificarFaltaTeacher(int id, [FromBody] JustificarFaltaRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Justificacion))
        {
            return BadRequest(new { success = false, message = "La justificación es requerida." });
        }

        var asistencia = await context.Asistencias.FindAsync(id);
        if (asistencia == null)
        {
            return NotFound(new { success = false, message = "Asistencia no encontrada." });
        }

        asistencia.Justificacion = request.Justificacion;
        asistencia.EstaJustificada = true; // El profesor lo justifica directamente, por lo que queda aprobada automáticamente.

        context.Asistencias.Update(asistencia);
        await context.SaveChangesAsync();

        return Ok(new { success = true, message = "Falta justificada con éxito por el profesor." });
    }
}

// ==========================================
// DTOs AND REQUEST MODELS
// ==========================================

public sealed class RondasRequest
{
    public string TipoClase { get; set; } = string.Empty; // "Presencial" o "Casa" (Virtual)
    public int CursoId { get; set; } = 1;
    public bool PermitirCambioPC { get; set; } = false; // EsRondaCambio
    public bool DesvincularTodos { get; set; } = false;
    public bool EliminarEquipos { get; set; } = false;
}

public sealed class FichajeAlumnoRequest
{
    public int StudentId { get; set; }
    public string? NombreUsuario { get; set; }
    public string Type { get; set; } = string.Empty; // "Entrada" o "Salida"
    public string? DevHostname { get; set; }
}

public sealed class RegistrarEquipoAlumnoRequest
{
    public int StudentId { get; set; }
    public string? NombreDispositivo { get; set; }
    public string DireccionIP { get; set; } = string.Empty;
}

public sealed class AsistenciaManualRequest
{
    public int StudentId { get; set; }
    public string? NombreUsuario { get; set; }
    public int SessionId { get; set; }
    public string? Type { get; set; } // "Presente", "Retraso", "Falta"
    public int? Minutes { get; set; }
    public string? Text { get; set; } // Justificacion
}

public sealed class EquipoCompatibilityDto
{
    public int Id { get; set; }
    public string NombreDispositivo { get; set; } = string.Empty;
    public string DireccionIP { get; set; } = string.Empty;
    public int? StudentId { get; set; }
}

public class JustificarFaltaRequest
{
    public string Justificacion { get; set; } = string.Empty;
}

public class ReviewJustificacionRequest
{
    public bool Aceptar { get; set; }
}
