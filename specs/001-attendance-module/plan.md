# Implementation Plan: Attendance Module

**Branch**: `001-attendance-module` | **Date**: 2026-05-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-attendance-module/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement the central Attendance module for CheckingTajamar as a full-stack
increment: SQL Server-backed domain entities, repository/service/controller
layers in .NET 10, a network validation middleware for autonomous student
check-ins, Scalar API Reference, an Angular 21.2.12 frontend with a service
and two role-based components, and an external identity integration via
`ExternalUserService`.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: C# on .NET 10; TypeScript strict on Angular 21.2.12  
**Primary Dependencies**: ASP.NET Core Web API, Entity Framework Core, SQL Server,
Scalar API Reference, Angular HttpClient, external identity API client  
**Storage**: SQL Server with EF Core migrations  
**Testing**: Backend API and repository tests plus Angular component/service tests; build validation for both apps  
**Target Platform**: Full-stack web application with browser SPA and HTTPS API  
**Project Type**: Web application with separate backend and frontend projects  
**Performance Goals**: Autonomous check-in should complete in under 30 seconds end-to-end; middleware validation should stay lightweight  
**Constraints**: GUID primary keys, controller-service-repository layering, AddTransient for stateless repositories, Spanish UI/API text, English code and database names, pnpm only for frontend installs, no local user/student tables  
**Scale/Scope**: School attendance workflow for a bounded academic deployment, with student autonomous check-ins and teacher manual entries

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The plan MUST satisfy these constitution gates before proceeding:

- Backend architecture follows Controller -> Service -> Repository with explicit interfaces.
- Stateless repositories are registered with `AddTransient` and never accessed directly from controllers.
- Angular consumes the API only through dedicated `HttpClient` services.
- SQL Server and Entity Framework Core are the persistence baseline, and all primary keys use GUID/UUID.
- Scalar API Reference is included for API documentation and testing.
- The autonomous on-site check-in middleware validates both IP and hostname.
- Code, database identifiers, and technical artifacts remain in English; UI text and API responses remain in Spanish.
- `pnpm` is the only allowed package manager for the frontend.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
TajamarCheckApi/TajamarCheckApi/
├── Controllers/
│   └── AttendanceController.cs
├── Data/
│   └── ApplicationDbContext.cs
├── Middlewares/
│   └── NetworkValidationMiddleware.cs
├── Models/
│   ├── Attendance.cs
│   ├── AuthorizedDevice.cs
│   └── Session.cs
├── Repositories/
│   ├── IAttendanceRepository.cs
│   └── AttendanceRepository.cs
├── Services/
│   ├── ExternalUserService.cs
│   ├── IAttendanceService.cs
│   └── AttendanceService.cs
└── Program.cs

tajamarcheck/src/app/
├── attendance/
│   ├── attendance.service.ts
│   ├── attendance.models.ts
│   ├── student-attendance/
│   │   ├── student-attendance.component.ts
│   │   ├── student-attendance.component.html
│   │   └── student-attendance.component.css
│   └── teacher-attendance/
│       ├── teacher-attendance.component.ts
│       ├── teacher-attendance.component.html
│       └── teacher-attendance.component.css
├── app-module.ts
├── app.routes.ts
├── app.ts
└── app.html
```

**Structure Decision**: Keep the existing split backend/frontend workspace.
The backend will gain the API, persistence, repository, and middleware layers in
`TajamarCheckApi/TajamarCheckApi/`. The Angular app will add a dedicated
attendance feature folder under `tajamarcheck/src/app/` and a root route file.

## Research and Design Notes

- The browser SPA cannot reliably read the machine hostname by itself, so the
  student attendance flow will carry hostname data through a controlled request
  field/header that the middleware validates against `AuthorizedDevice`.
- There is no local user or student table; the controller must call an external
  identity API through `ExternalUserService` before committing attendance.
- `Attendance.ExternalStudentId` is the only student identifier stored locally;
  no foreign key to any user or student table will be created.
- `ApplicationDbContext` will be introduced under `Data/` because the current
  backend project has only the default Web SDK and no persistence layer.
- Scalar will be wired into the API startup in development so the attendance
  endpoints can be explored and exercised without adding a separate docs site.
- The frontend will use Angular route-driven navigation with a dedicated
  attendance service rather than coupling HTTP calls into the components.

## Backend File Plan

### Models

- `TajamarCheckApi/TajamarCheckApi/Models/Attendance.cs`
- `TajamarCheckApi/TajamarCheckApi/Models/AuthorizedDevice.cs`
- `TajamarCheckApi/TajamarCheckApi/Models/Session.cs`

### Repositories

- `TajamarCheckApi/TajamarCheckApi/Repositories/IAttendanceRepository.cs`
- `TajamarCheckApi/TajamarCheckApi/Repositories/AttendanceRepository.cs`

### Services

- `TajamarCheckApi/TajamarCheckApi/Services/ExternalUserService.cs`
- `TajamarCheckApi/TajamarCheckApi/Services/IAttendanceService.cs`
- `TajamarCheckApi/TajamarCheckApi/Services/AttendanceService.cs`

### Controllers

- `TajamarCheckApi/TajamarCheckApi/Controllers/AttendanceController.cs`

### Middlewares

- `TajamarCheckApi/TajamarCheckApi/Middlewares/NetworkValidationMiddleware.cs`

## Frontend File Plan

### Attendance Feature

- `tajamarcheck/src/app/attendance/attendance.service.ts`
- `tajamarcheck/src/app/attendance/attendance.models.ts`
- `tajamarcheck/src/app/attendance/student-attendance/student-attendance.component.ts`
- `tajamarcheck/src/app/attendance/student-attendance/student-attendance.component.html`
- `tajamarcheck/src/app/attendance/student-attendance/student-attendance.component.css`
- `tajamarcheck/src/app/attendance/teacher-attendance/teacher-attendance.component.ts`
- `tajamarcheck/src/app/attendance/teacher-attendance/teacher-attendance.component.html`
- `tajamarcheck/src/app/attendance/teacher-attendance/teacher-attendance.component.css`

### Root Angular Wiring

- `tajamarcheck/src/app/app.routes.ts`
- `tajamarcheck/src/app/app.html` (root template equivalent to app.component.html in this workspace)
- `tajamarcheck/src/app/app-module.ts`

## Program.cs Integration Plan

### DbContext and EF Core

- Register `ApplicationDbContext` with SQL Server using the app connection string.
- Configure EF Core for the attendance entities only: `Attendance`, `AuthorizedDevice`, and `Session`.
- Explicitly omit any `User` or `Student` entity set because the domain uses external identity data only.

### Repository and Service DI

- Register `IAttendanceRepository` with `AddTransient`.
- Register `IAttendanceService` with the lifetime required by the chosen orchestration pattern.
- Register `ExternalUserService` through `AddHttpClient` so the external API client is typed and centrally configured.

### Middleware and API Reference

- Add `NetworkValidationMiddleware` into the pipeline before the attendance controller endpoints are reached.
- Configure Scalar API Reference in development to document and test the attendance endpoints.
- Keep `MapControllers()` and the attendance routes enabled after the middleware pipeline.

## Complexity Tracking

No constitution violations require justification for this increment.
