# Quickstart: Attendance Module

## Prerequisites

- .NET 10 SDK
- SQL Server instance available for local development
- Node.js installed only as a runtime for the Angular workspace
- `pnpm` installed globally or available through Corepack

## Backend setup

1. Restore and build the API project.
2. Configure the SQL Server connection string in `appsettings.Development.json`.
3. Apply EF Core migrations after the new data model is added.
4. Configure the external identity API base URL and credentials used by `ExternalUserService`.
5. Run the API and verify that Scalar is available in development.

### Expected backend files to add

- `TajamarCheckApi/TajamarCheckApi/Data/ApplicationDbContext.cs`
- `TajamarCheckApi/TajamarCheckApi/Models/Attendance.cs`
- `TajamarCheckApi/TajamarCheckApi/Models/AuthorizedDevice.cs`
- `TajamarCheckApi/TajamarCheckApi/Models/Session.cs`
- `TajamarCheckApi/TajamarCheckApi/Repositories/IAttendanceRepository.cs`
- `TajamarCheckApi/TajamarCheckApi/Repositories/AttendanceRepository.cs`
- `TajamarCheckApi/TajamarCheckApi/Services/ExternalUserService.cs`
- `TajamarCheckApi/TajamarCheckApi/Services/IAttendanceService.cs`
- `TajamarCheckApi/TajamarCheckApi/Services/AttendanceService.cs`
- `TajamarCheckApi/TajamarCheckApi/Controllers/AttendanceController.cs`
- `TajamarCheckApi/TajamarCheckApi/Middlewares/NetworkValidationMiddleware.cs`

### Program.cs changes

- Register `ApplicationDbContext` with SQL Server.
- Register `IAttendanceRepository` with `AddTransient`.
- Register the external identity `HttpClient` and `ExternalUserService` with `AddHttpClient`.
- Add `NetworkValidationMiddleware` into the HTTP pipeline.
- Map Scalar API Reference in development.

## Frontend setup

1. Install dependencies with `pnpm install` from the Angular workspace.
2. Start the SPA with `pnpm start`.
3. Verify that routes render the student and teacher attendance components.

### Expected frontend files to add

- `tajamarcheck/src/app/attendance/attendance.service.ts`
- `tajamarcheck/src/app/attendance/attendance.models.ts`
- `tajamarcheck/src/app/attendance/student-attendance/student-attendance.component.ts`
- `tajamarcheck/src/app/attendance/student-attendance/student-attendance.component.html`
- `tajamarcheck/src/app/attendance/student-attendance/student-attendance.component.css`
- `tajamarcheck/src/app/attendance/teacher-attendance/teacher-attendance.component.ts`
- `tajamarcheck/src/app/attendance/teacher-attendance/teacher-attendance.component.html`
- `tajamarcheck/src/app/attendance/teacher-attendance/teacher-attendance.component.css`
- `tajamarcheck/src/app/app-module.ts`
- `tajamarcheck/src/app/app.routes.ts`
- `tajamarcheck/src/app/app.html`

## Validation checklist

- Student autonomous check-in works only from an authorized IP and hostname.
- Teacher manual attendance works from the admin flow.
- API responses to the browser are in Spanish.
- Code identifiers and entity names remain in English.
- No local user or student entities are created in the backend.
- `pnpm` is the only package manager used for frontend dependency installation.

## Final run commands (quick)

Start backend (from repo root):

```bash
cd TajamarCheckApi/TajamarCheckApi
dotnet restore
dotnet build
dotnet run
```

Start frontend (from repo root):

```bash
cd tajamarcheck
pnpm install
pnpm start
```

The frontend will be available at `http://localhost:4200` and the API at `http://localhost:5081` by default.

Notes:

- Configure the SQL Server connection string in `appsettings.Development.json` or set the `AttendanceDb` environment variable before running migrations.
- Apply EF Core migrations from the API project folder:

```bash
cd TajamarCheckApi/TajamarCheckApi
dotnet ef migrations add InitialAttendance
dotnet ef database update
```

- Ensure `ExternalUsers:BaseUrl` is configured for `ExternalUserService` (e.g., in `appsettings.Development.json`).
- If ports change, update `TajamarCheckApi.http` and any frontend proxies accordingly.
