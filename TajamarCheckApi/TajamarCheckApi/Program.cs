using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using TajamarCheckApi.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Register the DbContext for SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("AttendanceDb")
        ?? "Server=(localdb)\\mssqllocaldb;Database=CheckingTajamarAttendance;Trusted_Connection=True;TrustServerCertificate=True";

    options.UseSqlServer(connectionString);
});

// Configure CORS to allow Angular Spa connections
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference().AllowAnonymous();
}

app.UseHttpsRedirection();

// Enable CORS
app.UseCors();

app.UseAuthorization();

app.MapControllers();

app.Run();
