using TajamarCheckApi.Models;

namespace TajamarCheckApi.Services;

public interface IAttendanceService
{
    Task<Attendance> RegisterStudentAttendanceAsync(Guid externalStudentId, Guid sessionId, string ipAddress, string hostname, CancellationToken cancellationToken = default);

    Task<Attendance> RegisterManualAttendanceAsync(Guid externalStudentId, Guid sessionId, string reason, CancellationToken cancellationToken = default);
}