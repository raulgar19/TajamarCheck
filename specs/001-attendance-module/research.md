# Research: Attendance Module

## Decision 1: EF Core code-first with SQL Server
- Decision: Use a dedicated `ApplicationDbContext` under `TajamarCheckApi/TajamarCheckApi/Data/` with EF Core migrations against SQL Server.
- Rationale: The repository already targets ASP.NET Core Web API and declares no persistence layer yet; EF Core provides the fastest path to strongly typed entities, GUID keys, and future migrations.
- Alternatives considered: Dapper or raw SQL were rejected because they would duplicate repository logic and make the layered architecture harder to maintain.

## Decision 2: Repository + service layering
- Decision: Keep the controller thin, route all local attendance operations through `IAttendanceRepository`/`AttendanceRepository`, and isolate orchestration in service layers when needed.
- Rationale: This matches the constitution and gives the middleware and controller a stable contract boundary.
- Alternatives considered: Direct DbContext access from controllers was rejected because it bypasses the architecture rule and makes the attendance flow harder to test.

## Decision 3: External identity validation
- Decision: Add `ExternalUserService` as the backend integration point for the external identity API and use it to validate authentication data before attendance is committed.
- Rationale: The feature explicitly forbids local user or student tables and requires identity data to come from a separate API.
- Alternatives considered: Storing users locally was rejected because it violates the data rule and duplicates identity ownership.

## Decision 4: Network validation via middleware
- Decision: Implement `NetworkValidationMiddleware` to validate student attendance requests using the request IP and a controlled hostname value.
- Rationale: The user explicitly requires middleware interception before the controller and database-backed validation of the device identity.
- Alternatives considered: Controller-level validation was rejected because it would allow requests to reach business logic before security checks.

## Decision 5: Hostname transport strategy
- Decision: Carry the hostname through a controlled request header or request field supplied by the attendance UI and validate it against the authorized device record.
- Rationale: A browser SPA cannot reliably read the workstation hostname on its own; the middleware still enforces the check centrally.
- Alternatives considered: Trying to resolve the hostname exclusively in the browser was rejected because it is not dependable in standard web runtime conditions.

## Decision 6: Scalar API Reference in development
- Decision: Wire Scalar into `Program.cs` for development-time endpoint exploration and testing.
- Rationale: The feature spec requires API documentation and testability without introducing a separate documentation site.
- Alternatives considered: Swashbuckle/OpenAPI-only documentation was rejected because Scalar is the requested reference and testing surface.

## Decision 7: Angular service-first API access
- Decision: Add `AttendanceService` and keep HTTP calls out of components.
- Rationale: The constitution requires dedicated services and the feature needs separate student and teacher UI flows.
- Alternatives considered: Direct `HttpClient` usage in components was rejected because it couples presentation and transport concerns.

## Decision 8: pnpm as the only frontend installer
- Decision: All quickstart and setup commands will use `pnpm` explicitly.
- Rationale: This is a project-wide rule and matches the current package manager metadata in the frontend project.
- Alternatives considered: npm was rejected by constitution.
