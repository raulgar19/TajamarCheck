# Research Log: Attendance and Checking Module

This document outlines the technical research, architectural decisions, and design choices made to satisfy the feature requirements and project constitution.

---

## Technical Decisions

### Decision 1: Secure Client Hostname Capture

- **Decision**: Leverage network-level reverse proxy/gateway injection to append the `X-Client-Hostname` header based on active DHCP lease maps and local DNS resolvers.
- **Rationale**: standard web browsers restrict access to the client OS hostname due to sandbox security constraints. Relying on network-level injection is highly secure, tamper-proof, and requires zero software installation (local agents or browser extensions) on classroom PCs.
- **Alternatives considered**:
  - *Option A: Local Client Daemon*: A C# desktop agent on each machine. Rejected because of deployment and maintenance overhead.
  - *Option B: Manual Hostname Prompts*: Students type their PC hostname. Rejected because it is highly vulnerable to spoofing.

---

### Decision 2: Legacy Database Integration (Student IDs)

- **Decision**: Keep `StudentId` as an `INT` data type in the `Fichajes` table while ensuring all *new* primary keys (`Id` in `EquiposAutorizados`, `Sesiones`, `Fichajes`) use `GUID/UNIQUEIDENTIFIER`.
- **Rationale**: Aligns perfectly with the legacy SQL database structure (`Absences` and `AttendanceLogs` both identify students via `StudentId INT NOT NULL`). This ensures clean querying, direct compatibility, and logical/physical foreign keys without forcing a breaking rewrite of the existing system.
- **Alternatives considered**:
  - *Converting Student IDs to GUIDs*: Rejected because it requires refactoring the entire pre-existing database tables and the school's general legacy user registry.

---

### Decision 3: API Layer Network Validation Middleware

- **Decision**: Implement the double-factor hardware check within a custom ASP.NET Core Middleware/Filter (`OnSiteAttendanceFilter`) attached to the student check-in endpoint.
- **Rationale**: Centralizing the extraction and DB cross-reference of the client IP and `X-Client-Hostname` header in a filter ensures clean controller actions, prevents code duplication, and guarantees that unauthorized network traffic is blocked immediately at the framework boundary (returning `403 Forbidden` in Spanish).
- **Alternatives considered**:
  - *Validation inside Controller Actions*: Rejected because it pollutes the presentation layer and violates the Controller-Service separation of concerns.

---

## Technology Best Practices & Guidelines

### Backend (.NET 10 & EF Core)
- Use Entity Framework Fluent API in `ApplicationDbContext` to configure the GUID PKs and set defaults (e.g., `NEWID()` or `NEWSEQUENTIALID()`).
- Follow the explicit interface architecture: Controller calls Service; Service implements business validation; Service calls Repository; Repository performs database queries.
- Register all repositories via `builder.Services.AddTransient<IInterface, Implementation>()` to guarantee stateless, thread-safe database scopes.

### Frontend (Angular & pnpm)
- Use Angular's `HttpClient` inside dedicated services (`AttendanceService` and `WhitelistService`) to query REST endpoints.
- Manage local states cleanly, providing localized messages in Spanish to students upon successful check-in or specific network blocks.
