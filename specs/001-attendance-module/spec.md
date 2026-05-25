# Feature Specification: Attendance Module

**Feature Branch**: `[001-attendance-module]`  
**Created**: 2026-05-25  
**Status**: Draft  
**Input**: User description: "Diseña el módulo central de 'Fichajes (Attendance)' para CheckingTajamar."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fichaje autónomo del alumno (Priority: P1)

Como alumno, quiero registrar mi fichaje desde mi equipo autorizado para confirmar mi presencia de forma rápida y autónoma.

**Why this priority**: Es el flujo principal del módulo y aporta valor inmediato al control de asistencia diaria.

**Independent Test**: Puede verificarse creando un dispositivo autorizado, enviando una petición de fichaje desde una IP y un hostname válidos, y comprobando que el sistema registra la asistencia en español con éxito.

**Acceptance Scenarios**:

1. **Given** un alumno con un dispositivo autorizado, **When** envía un fichaje autónomo desde una IP y un hostname válidos, **Then** el sistema registra la asistencia y devuelve un mensaje de confirmación en español.
2. **Given** un alumno con un dispositivo autorizado, **When** intenta fichar dos veces en la misma sesión, **Then** el sistema rechaza el segundo fichaje y explica el motivo en español.

---

### User Story 2 - Fichaje manual del profesor (Priority: P2)

Como profesor, quiero registrar fichajes manuales para cubrir incidencias o casos especiales desde casa o desde administración.

**Why this priority**: Permite mantener continuidad operativa cuando el fichaje autónomo no está disponible o debe corregirse.

**Independent Test**: Puede verificarse enviando un fichaje manual al endpoint de profesor y comprobando que el registro queda asociado correctamente y con respuesta en español.

**Acceptance Scenarios**:

1. **Given** un profesor con permisos válidos, **When** registra un fichaje manual para un alumno, **Then** el sistema guarda el registro con origen manual y devuelve confirmación en español.
2. **Given** un profesor sin datos suficientes, **When** intenta registrar un fichaje manual incompleto, **Then** el sistema rechaza la operación con un mensaje descriptivo en español.

---

### User Story 3 - Validación de dispositivo autorizado (Priority: P3)

Como sistema, quiero validar cada petición de fichaje contra la base de datos usando IP y hostname para asegurar que solo se aceptan equipos autorizados.

**Why this priority**: Refuerza la seguridad del módulo y evita fichajes desde dispositivos no permitidos.

**Independent Test**: Puede verificarse enviando peticiones con IP u hostname no autorizados y confirmando que el middleware las bloquea antes de llegar al controlador.

**Acceptance Scenarios**:

1. **Given** una petición desde una IP o hostname no registrados, **When** pasa por el middleware de validación, **Then** el sistema bloquea la petición y devuelve un error en español.
2. **Given** una petición válida desde un dispositivo autorizado, **When** pasa por el middleware, **Then** la petición continúa hasta el controlador correspondiente.

---

### Edge Cases

- Qué ocurre cuando la IP se resuelve correctamente pero el hostname falta o no coincide.
- Qué ocurre cuando no existe una sesión activa para el alumno en el momento del fichaje.
- Qué ocurre cuando el mismo alumno intenta fichar más de una vez en una ventana de tiempo corta.
- Qué ocurre cuando la base de datos no responde durante la validación del dispositivo.
- Qué ocurre cuando el profesor registra un fichaje manual para un alumno inexistente o ya cerrado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define `Attendance`, `AuthorizedDevice`, and `Session` entities with GUID primary keys prepared for EF Core and SQL Server.
- **FR-002**: The `Attendance` entity MUST use `ExternalStudentId` as the only student identifier and MUST NOT create any local foreign key, table, entity, or repository for users or students.
- **FR-003**: The system MUST provide `IAttendanceRepository` and `AttendanceRepository` to store and retrieve attendance-related local data from the database.
- **FR-004**: The system MUST provide `ExternalUserService` to communicate with the external identity API through `HttpClient` and validate authentication data for attendance flows.
- **FR-005**: The system MUST validate autonomous student attendance through `NetworkValidationMiddleware` before the request reaches the controller.
- **FR-006**: The middleware MUST capture the request IP address and hostname and allow the flow to continue toward the controller for validation orchestration.
- **FR-007**: The system MUST expose `POST /api/attendance/student` for autonomous student check-in.
- **FR-008**: The system MUST expose `POST /api/admin/attendance-manual` for teacher-managed manual attendance.
- **FR-009**: The system MUST register stateless repositories with transient lifetime in dependency injection.
- **FR-010**: The system MUST register the external identity `HttpClient` and integrate Scalar API Reference for endpoint discovery and testing.
- **FR-011**: The frontend MUST include an `AttendanceService` that consumes the API through `HttpClient`.
- **FR-012**: The frontend MUST include `StudentAttendanceComponent` with a dynamic check-in button and clear error handling.
- **FR-013**: The frontend MUST include `TeacherAttendanceComponent` for manual attendance workflows.
- **FR-014**: The frontend installation instructions MUST explicitly use `pnpm`.
- **FR-015**: All code identifiers, entity names, and database artifacts MUST remain in English.
- **FR-016**: User-facing messages in the Angular UI and API responses MUST be in Spanish.
- **FR-017**: The system MUST record successful and rejected attendance attempts for traceability.

### Key Entities *(include if feature involves data)*

- **Attendance**: Represents an attendance record with external student identity, timestamp, origin, and outcome.
- **AuthorizedDevice**: Represents a device allowed to perform autonomous attendance, identified by IP address and hostname.
- **Session**: Represents an attendance session or time window in which records are accepted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can complete an autonomous check-in in under 30 seconds when using an authorized device.
- **SC-002**: At least 95% of valid autonomous attendance requests receive a success response and are stored correctly on the first attempt.
- **SC-003**: Unauthorized devices are rejected before the controller handles the request in 100% of tested cases.
- **SC-004**: Teachers can record a manual attendance entry in under 1 minute using the admin flow.
- **SC-005**: UI messages and API responses are consistently delivered in Spanish in all tested attendance flows.

## Assumptions

- The school already defines which devices are authorized for autonomous attendance.
- The hostname available to the system is stable enough to serve as a validation factor for classroom devices.
- Manual attendance is limited to teacher or admin usage and does not replace the autonomous student flow.
- The attendance session model already exists conceptually or will be created as part of the module.
- Angular installation and package management will use `pnpm` only.
- The API will return user-facing errors in Spanish, while source code and database naming remain in English.
- No local user or student table exists in this project; external identity data is obtained through an external API.
