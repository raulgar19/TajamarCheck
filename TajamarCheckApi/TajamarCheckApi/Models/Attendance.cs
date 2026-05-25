namespace TajamarCheckApi.Models;

public sealed class Attendance
{
    public Guid Id { get; set; }

    public Guid ExternalStudentId { get; set; }

    public Guid SessionId { get; set; }

    public string AttendanceType { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }

    public string CreatedBy { get; set; } = string.Empty;

    public string? Reason { get; set; }

    public string? IpAddress { get; set; }

    public string? Hostname { get; set; }

    public Session? Session { get; set; }
}