using System.Net.Http.Json;

namespace TajamarCheckApi.Services;

public sealed class ExternalUserService(HttpClient httpClient)
{
    public async Task<bool> ValidateExternalStudentAsync(Guid externalStudentId, CancellationToken cancellationToken = default)
    {
        var externalStudent = await GetExternalStudentAsync(externalStudentId, cancellationToken);
        return externalStudent is not null && externalStudent.IsActive;
    }

    public async Task<ExternalStudentProfile?> GetExternalStudentAsync(Guid externalStudentId, CancellationToken cancellationToken = default)
    {
        if (httpClient.BaseAddress is null)
        {
            return null;
        }

        using var response = await httpClient.GetAsync($"api/students/{externalStudentId}", cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        return await response.Content.ReadFromJsonAsync<ExternalStudentProfile>(cancellationToken: cancellationToken);
    }

    public sealed record ExternalStudentProfile(Guid Id, string FullName, bool IsActive);
}