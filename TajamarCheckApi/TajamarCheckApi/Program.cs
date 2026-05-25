using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using TajamarCheckApi.Data;
using TajamarCheckApi.Middlewares;
using TajamarCheckApi.Repositories;
using TajamarCheckApi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("AttendanceDb")
        ?? "Server=(localdb)\\mssqllocaldb;Database=CheckingTajamarAttendance;Trusted_Connection=True;TrustServerCertificate=True";

    options.UseSqlServer(connectionString);
});

builder.Services.AddTransient<IAttendanceRepository, AttendanceRepository>();
builder.Services.AddTransient<IAttendanceService, AttendanceService>();
builder.Services.AddHttpClient<ExternalUserService>(client =>
{
    var baseUrl = builder.Configuration["ExternalUsers:BaseUrl"] ?? "https://external-users.example.com/";
    client.BaseAddress = new Uri(baseUrl);
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference().AllowAnonymous();
}

app.UseHttpsRedirection();
app.UseMiddleware<NetworkValidationMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();
