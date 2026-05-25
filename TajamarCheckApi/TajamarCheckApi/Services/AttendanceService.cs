using TajamarCheckApi.Models;
using TajamarCheckApi.Repositories;

namespace TajamarCheckApi.Services;

public sealed class AttendanceService(IAttendanceRepository attendanceRepository, ExternalUserService externalUserService) : IAttendanceService
{
    public async Task<Attendance> RegisterStudentAttendanceAsync(Guid externalStudentId, Guid sessionId, string ipAddress, string hostname, CancellationToken cancellationToken = default)
    {
        await EnsureExternalStudentExistsAsync(externalStudentId, cancellationToken);
        await EnsureSessionIsOpenAsync(sessionId, cancellationToken);
        await EnsureAuthorizedDeviceAsync(ipAddress, hostname, cancellationToken);
        await EnsureAttendanceDoesNotExistAsync(externalStudentId, sessionId, cancellationToken);

        var attendance = CreateAttendance(externalStudentId, sessionId, "Autonomous", "Accepted", "system", ipAddress, hostname, null);
        await attendanceRepository.AddAttendanceAsync(attendance, cancellationToken);
        await attendanceRepository.SaveChangesAsync(cancellationToken);

        return attendance;
    }

    public async Task<Attendance> RegisterManualAttendanceAsync(Guid externalStudentId, Guid sessionId, string reason, CancellationToken cancellationToken = default)
    {
        await EnsureExternalStudentExistsAsync(externalStudentId, cancellationToken);
        await EnsureSessionIsOpenAsync(sessionId, cancellationToken);
        await EnsureAttendanceDoesNotExistAsync(externalStudentId, sessionId, cancellationToken);

        var attendance = CreateAttendance(externalStudentId, sessionId, "Manual", "Accepted", "teacher", null, null, reason);
        await attendanceRepository.AddAttendanceAsync(attendance, cancellationToken);
        await attendanceRepository.SaveChangesAsync(cancellationToken);

        return attendance;
    }

    private async Task EnsureExternalStudentExistsAsync(Guid externalStudentId, CancellationToken cancellationToken)
    {
        if (!await externalUserService.ValidateExternalStudentAsync(externalStudentId, cancellationToken))
        {
            throw new InvalidOperationException("El usuario externo no pudo validarse.");
        }
    }

    private async Task EnsureSessionIsOpenAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        var session = await attendanceRepository.GetOpenSessionByIdAsync(sessionId, cancellationToken);
        if (session is null)
        {
            throw new InvalidOperationException("La sesión no está abierta.");
        }
    }

    private async Task EnsureAuthorizedDeviceAsync(string ipAddress, string hostname, CancellationToken cancellationToken)
    {
        var authorizedDevice = await attendanceRepository.GetAuthorizedDeviceAsync(ipAddress, hostname, cancellationToken);
        if (authorizedDevice is null)
        {
            throw new InvalidOperationException("El dispositivo no está autorizado para fichar.");
        }
    }

    private async Task EnsureAttendanceDoesNotExistAsync(Guid externalStudentId, Guid sessionId, CancellationToken cancellationToken)
    {
        if (await attendanceRepository.AttendanceExistsAsync(externalStudentId, sessionId, cancellationToken))
        {
            throw new InvalidOperationException("Ya existe un fichaje registrado para esta sesión.");
        }
    }

    private static Attendance CreateAttendance(Guid externalStudentId, Guid sessionId, string attendanceType, string status, string createdBy, string? ipAddress, string? hostname, string? reason)
    {
        return new Attendance
        {
            Id = Guid.NewGuid(),
            ExternalStudentId = externalStudentId,
            SessionId = sessionId,
            AttendanceType = attendanceType,
            Status = status,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = createdBy,
            IpAddress = ipAddress,
            Hostname = hostname,
            Reason = reason
        };
    }
}