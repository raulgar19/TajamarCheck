# Implementation Plan: Attendance and Checking Module

**Branch**: `001-attendance-module` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-attendance-module/spec.md`

## Summary

The Attendance and Checking Module implements a secure system for tracking student attendance. It features a centralized login screen using the external Azure API, routing users to their designated roles: Alumnos see a rich dashboard with metrics, an all-month navigable calendar showing daily statuses, and an incidents history list, plus a dedicated check-in/out view; Profesores see a round management interface to toggle between "Presencial" (Classroom) and "Casa" (Home) sessions. Classroom check-ins are verified by custom backend middleware against whitelisted hostnames/IPs, while home check-ins are disabled for students and handled manually by the professor. New tables will use GUIDs for their Primary Keys, while integrating with the existing SQL Server schema using `INT` for legacy student identifiers.

## Technical Context

**Language/Version**: .NET 10 (C# 14) for backend, Angular 21.2 for frontend.  
**Primary Dependencies**: `Microsoft.EntityFrameworkCore.SqlServer`, `Scalar.AspNetCore` (backend) / `HttpClient` (frontend Angular).  
**Storage**: SQL Server via Entity Framework Core.  
**Testing**: Vitest for frontend, xUnit for backend.  
**Target Platform**: Multi-platform web application (SPA + Web API).  
**Project Type**: Web Service (REST API) + Frontend Single Page Application (Angular).  
**Performance Goals**: API response times < 200ms, student check-in time < 5 seconds.  
**Constraints**: All new database primary keys MUST be GUIDs; `StudentId` MUST be an `INT` to align with the legacy DB schema; package management on frontend is strictly `pnpm`.  
**Scale/Scope**: ~30 students per class, whitelisted classroom device administration.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The plan satisfies all constitution gates:

- **Architecture Layering**: Backend will follow the `Controller -> Service -> Repository` pattern with explicit interfaces. (✅ Satisfied)
- **Stateless Repositories**: Repositories will be registered as `AddTransient` in the .NET DI container and never consumed directly by controllers. (✅ Satisfied)
- **Frontend Services**: Angular will access the API solely via dedicated `HttpClient` services. (✅ Satisfied)
- **Database PKs**: SQL Server + EF Core with all NEW primary keys as `GUID/UNIQUEIDENTIFIER`. (✅ Satisfied)
- **Scalar API Docs**: Scalar is mapped in `Program.cs` and will document all new endpoints. (✅ Satisfied)
- **Double-Factor Validation**: Custom middleware will inspect and match IP & Hostname (`X-Client-Hostname`). (✅ Satisfied)
- **Language / Translation**: Source code, technical structures in English; UI and response strings in Spanish. (✅ Satisfied)
- **Package Manager**: `pnpm` used exclusively for frontend. (✅ Satisfied)

## Project Structure

### Documentation (this feature)

```text
specs/001-attendance-module/
├── plan.md              # This file
├── research.md          # Research summary (Phase 0)
├── data-model.md        # Database schema design (Phase 1)
├── quickstart.md        # Verification details (Phase 1)
├── contracts/           # API contract specifications (Phase 1)
│   └── api-contracts.md # Endpoints and JSON payload schemas
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
TajamarCheckApi/
├── TajamarCheckApi.slnx
└── TajamarCheckApi/
    ├── Controllers/
    │   ├── AttendanceController.cs     # Endpoints for check-in/out, professor roll call, and round management
    │   └── WhitelistController.cs      # CRUD for authorized devices
    ├── Data/
    │   └── ApplicationDbContext.cs     # Entity Framework Context with new DbSets (EquiposAutorizados, Sesiones)
    ├── Models/
    │   ├── EquipoAutorizado.cs         # Whitelisted device model (GUID PK)
    │   └── Sesion.cs                   # Class session/round model (GUID PK)
    └── Program.cs                      # OpenApi & Scalar configuration

tajamarcheck/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login.component.ts      # Main Login view connecting to Azure API with role routing
│   │   │   └── login.component.html
│   │   ├── home/
│   │   │   ├── home.component.ts       # Unified dashboard: Alumno (metrics, multi-month calendar, lists) and Profesor (round panel)
│   │   │   └── home.component.html
│   │   ├── student-checkin/
│   │   │   ├── student-checkin.component.ts # Dedicated screen for Alumno check-in and check-out
│   │   │   └── student-checkin.component.html
│   │   └── app.routes.ts
└── pnpm-lock.yaml
```

**Structure Decision**: Web application (Option 2) matches the existing repository layout with the backend API project in `TajamarCheckApi` and the frontend Angular app in `tajamarcheck`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| StudentId uses INT instead of GUID PK | Legacy system compatibility with existing `Absences` and `AttendanceLogs` databases. | Breaking the legacy database structure would require refactoring the entire legacy student management system. |
