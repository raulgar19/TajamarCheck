using Microsoft.EntityFrameworkCore;
using TajamarCheckApi.Data;
using TajamarCheckApi.Models;

namespace TajamarCheckApi.Repositories;

public sealed class AttendanceRepository(ApplicationDbContext context) : IAttendanceRepository
{
    public async Task<Attendance?> GetAttendanceByIdAsync(Guid attendanceId, CancellationToken cancellationToken = default)
    {
        return await context.Attendances
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == attendanceId, cancellationToken);
    }

    public async Task<bool> AttendanceExistsAsync(Guid externalStudentId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        return await context.Attendances
            .AsNoTracking()
            .AnyAsync(x => x.ExternalStudentId == externalStudentId && x.SessionId == sessionId, cancellationToken);
    }

    public async Task<Session?> GetSessionByIdAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        return await context.Sessions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == sessionId, cancellationToken);
    }

    public async Task<Session?> GetOpenSessionByIdAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        return await context.Sessions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == sessionId && x.IsOpen, cancellationToken);
    }

    public async Task<AuthorizedDevice?> GetAuthorizedDeviceAsync(string ipAddress, string hostname, CancellationToken cancellationToken = default)
    {
        return await context.AuthorizedDevices
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.IsActive && x.IpAddress == ipAddress && x.Hostname == hostname,
                cancellationToken);
    }

    public async Task AddAttendanceAsync(Attendance attendance, CancellationToken cancellationToken = default)
    {
        await context.Attendances.AddAsync(attendance, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return context.SaveChangesAsync(cancellationToken);
    }
}