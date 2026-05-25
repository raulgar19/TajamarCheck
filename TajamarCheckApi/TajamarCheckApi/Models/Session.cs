namespace TajamarCheckApi.Models;

public sealed class Session
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTime StartUtc { get; set; }

    public DateTime? EndUtc { get; set; }

    public bool IsOpen { get; set; }

    public Guid? TeacherId { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public ICollection<Attendance> Attendances { get; set; } = [];
}