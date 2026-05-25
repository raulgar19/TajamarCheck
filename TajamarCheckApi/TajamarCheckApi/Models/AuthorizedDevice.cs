namespace TajamarCheckApi.Models;

public sealed class AuthorizedDevice
{
    public Guid Id { get; set; }

    public string IpAddress { get; set; } = string.Empty;

    public string Hostname { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }
}