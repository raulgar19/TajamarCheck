using TajamarCheckApi.Models;

namespace TajamarCheckApi.Repositories;

public interface IAttendanceRepository
{
    Task<Attendance?> GetAttendanceByIdAsync(Guid attendanceId, CancellationToken cancellationToken = default);

    Task<bool> AttendanceExistsAsync(Guid externalStudentId, Guid sessionId, CancellationToken cancellationToken = default);

    Task<Session?> GetSessionByIdAsync(Guid sessionId, CancellationToken cancellationToken = default);

    Task<Session?> GetOpenSessionByIdAsync(Guid sessionId, CancellationToken cancellationToken = default);

    Task<AuthorizedDevice?> GetAuthorizedDeviceAsync(string ipAddress, string hostname, CancellationToken cancellationToken = default);

    Task AddAttendanceAsync(Attendance attendance, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}