namespace TajamarCheckApi.Middlewares;

public sealed class NetworkValidationMiddleware(RequestDelegate next, ILogger<NetworkValidationMiddleware> logger)
{
    public const string ClientIpItemKey = "AttendanceClientIp";
    public const string ClientHostnameItemKey = "AttendanceClientHostname";
    private const string ClientHostnameHeaderName = "X-Client-Hostname";

    public async Task InvokeAsync(HttpContext context)
    {
        var clientIp = GetClientIpAddress(context);
        var clientHostname = GetClientHostname(context);

        context.Items[ClientIpItemKey] = clientIp;
        context.Items[ClientHostnameItemKey] = clientHostname;

        logger.LogInformation("Attendance request captured from {ClientIp} / {ClientHostname}", clientIp, clientHostname);

        await next(context);
    }

    private static string GetClientIpAddress(HttpContext context)
    {
        return context.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0";
    }

    private static string GetClientHostname(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue(ClientHostnameHeaderName, out var hostnameValues) && !string.IsNullOrWhiteSpace(hostnameValues.ToString()))
        {
            return hostnameValues.ToString();
        }

        // Try reverse DNS lookup from the remote IP as a best-effort fallback
        try
        {
            var ip = context.Connection.RemoteIpAddress?.ToString();
            if (!string.IsNullOrWhiteSpace(ip))
            {
                var entry = System.Net.Dns.GetHostEntryAsync(ip).GetAwaiter().GetResult();
                if (!string.IsNullOrWhiteSpace(entry.HostName))
                {
                    return entry.HostName;
                }
            }
        }
        catch
        {
            // ignore DNS failures and fall back to request host
        }

        return context.Request.Host.Host;
    }
}