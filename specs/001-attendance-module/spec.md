# Feature Specification: Attendance and Checking Module

**Feature Branch**: `001-attendance-module`  
**Created**: 2026-05-27  
**Status**: Draft  
**Input**: User description: "A raíz de la constitución y los proyectos generame las especificaciones necesarias para la App de Faltas y Checking de Tajamar con flujo de roles de login, dashboard de alumnos con multi-calendario mensual y rondas de fichaje gestionadas por el profesor."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Login & Role-Based Navigation (Priority: P1) 🎯 MVP

**Description**: As a user (Student or Professor), I want to log in through a centralized login screen using my external Azure API credentials, so that I am automatically redirected to the correct home screen customized for my role.

**Why this priority**: Core security and routing prerequisite. The application must differentiate user views immediately after authentication.

**Independent Test**:
- A student logs in; the system authenticates against the external Azure API, detects the student role, and redirects to the Student Dashboard.
- A professor logs in; the system authenticates, detects the professor/admin role, and redirects to the Teacher Dashboard.

**Acceptance Scenarios**:
1. **Given** the login screen is loaded, **When** the user inputs valid student credentials, **Then** they are authenticated, their role is set to `alumno`, and they are navigated to the student home view.
2. **Given** the login screen is loaded, **When** the user inputs valid professor/admin credentials, **Then** they are authenticated, their role is set to `profesor`, and they are navigated to the teacher management dashboard.

---

### User Story 2 - Student Dashboard & Multi-Month Calendar (Priority: P1) 🎯 MVP

**Description**: As a student, I want to see a rich dashboard containing my attendance statistics (absences, delays, attendance percentage), a fully navigable monthly calendar (supporting all months), and a detailed monthly list of occurrences, so that I can monitor my attendance records for the entire school year.

**Why this priority**: Primary value proposition for students to track their educational standing and self-correct any issues.

**Independent Test**: A student accesses their home view and can see their dashboard, click previous/next buttons on a calendar to view any month's absences/delays, and view a structured list of historical incidents grouped by month.

**Acceptance Scenarios**:
1. **Given** a student is on their home view, **When** they load the dashboard, **Then** they see their total absences count, delays count, and overall attendance percentage calculated correctly.
2. **Given** the dashboard calendar is loaded, **When** the student navigates between different months using the calendar controls, **Then** the calendar dynamically displays the correct days of that month along with indicators for days with absences (red) and delays (yellow).
3. **Given** the occurrence list is loaded, **When** the student views the panel, **Then** the list shows the details (subject, date, time, duration of delay) of all attendance incidents grouped by month.

---

### User Story 3 - Student Check-In & Check-Out (Priority: P1) 🎯 MVP

**Description**: As a student, I want to have a dedicated screen where I can autonomously register my entry (entrada) and exit (salida) for the current day's class, so that my daily hours are accurately tracked.

**Why this priority**: Required for tracking active student classroom presence in real-time.

**Independent Test**: A student opens the check-in screen, clicks "Fichar Entrada" or "Fichar Salida", and receives immediate feedback on success or failure.

**Acceptance Scenarios**:
1. **Given** a student is on the check-in view, **When** they click "Fichar Entrada", **Then** the system registers an entry log in the database with the current timestamp.
2. **Given** a student has already registered their entry, **When** they click "Fichar Salida", **Then** the system registers an exit log in the database.

---

### User Story 4 - Teacher Round Management (Priority: P1) 🎯 MVP

**Description**: As a professor, I want to manage and open daily check-in "rounds" (rondas de fichaje por día) selecting whether the class is conducted in-class (desde clase) or from home (desde casa), so that student check-in rules are dynamically enforced.

**Why this priority**: Core compliance and security requirement to prevent students from fraudulently checking in when they are not physically present in class.

**Independent Test**: The professor opens the management panel, sets the round mode for today to "Presencial" or "Casa", and validates the client's behavior in each mode.

**Acceptance Scenarios**:
1. **Given** the professor has opened a round set to "desde clase" (Presencial), **When** a student attempts to check in autonomously, **Then** the backend validates that the request originates from a registered device in `EquiposAutorizados` (matching both Device Name and IP address), registering the check-in only on absolute match.
2. **Given** the professor has opened a round set to "desde clase" (Presencial), **When** a student attempts to check in from a non-registered device or mismatched IP, **Then** the backend rejects the request and returns a friendly error message in Spanish.
3. **Given** the professor has opened a round set to "desde casa" (Casa), **When** a student attempts to check in autonomously, **Then** the backend blocks the request (returning HTTP `403 Forbidden`) and the student is shown a block screen in Spanish. The professor is solely responsible for manually registering student absences or delays.

---

## Edge Cases

- **No Active Round Open**: If a student attempts to check in/out but no round has been opened by the teacher for that day, the backend must reject the request, prompting them to contact the teacher.
- **Multiple Login Roles**: If a user has a role that is not mapped to student or professor, the system defaults to a student view but restricts write access.
- **Dynamic Hostname and IP Mismatches**: If a classroom PC changes its IP via DHCP during a session, the student's check-in fails immediately, and they are prompted to report to the professor.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Centralized Login)**: The application MUST provide a main login screen that authenticates credentials using the external Azure API, storing the session token and username locally.
- **FR-002 (Role Detection & Routing)**: The Angular frontend MUST detect whether the authenticated user is a student or a professor (e.g. based on email domain or username mapping like `profe`/`admin`), routing them to their respective home dashboard layout.
- **FR-003 (Student Dashboard Metrics)**: The student home view MUST calculate and display the total absences count, delays count, and the overall attendance percentage.
- **FR-004 (All-Month Navigable Calendar)**: The student calendar MUST support rendering and navigating between all months of the year, showing red badges for absences and yellow badges for delays on the corresponding days.
- **FR-005 (Check-In/Out Interface)**: The student view MUST include a dedicated screen exposing clear buttons to register "Entrada" (Check-In) and "Salida" (Check-Out) autonomously.
- **FR-006 (Daily Round Management)**: The professor view MUST provide an interface to open and manage daily check-in rounds, selecting between "Presencial" (Classroom) and "Casa" (Home) modalities.
- **FR-007 (Classroom Device Validation)**: When a "Presencial" round is active, the backend API MUST enforce double-factor validation (Device Name + IP) against the whitelisted `EquiposAutorizados` list before recording autonomous check-ins.
- **FR-008 (Home Round Block)**: When a "Casa" round is active, the backend API MUST block all autonomous student check-ins (returning HTTP `403 Forbidden`), leaving the professor as the sole authority to log manual absences or tardies.
- **FR-009 (Language Standards)**: All database identifiers, variables, models, and classes MUST be written in English. UI screens and backend error messages returned to the client MUST be in Spanish.

---

### Key Entities

- **AuthorizedDevice (EquiposAutorizados)**:
  - Whitelisted classroom PC.
  - Attributes: `Id` (GUID PK), `NombreDispositivo` (unique string hostname), `DireccionIP` (string static IP), `Activo` (boolean).
- **ClassSession / Round (Sesiones)**:
  - Daily check-in round opened by the teacher.
  - Attributes: `Id` (GUID PK), `TipoClase` (Enum: `Presencial` / `Casa`), `Fecha` (DateTime), `CursoId` (INT FK).
- **CheckInLog (Fichajes)**:
  - Recorded attendance logs.
  - Attributes: `Id` (GUID PK), `StudentId` (INT legacy FK), `FechaHora` (DateTime), `EquipoId` (GUID FK, nullable), `Metodo` (Enum: `Automatico_Alumno` / `Manual_Profesor`), `IpDetectada` (string), `HostnameDetectado` (string).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Centralized login completes and correctly routes students and professors to their respective screens in under 2 seconds post-authentication.
- **SC-002**: Students can navigate their calendar between any of the 12 school year months instantly without lag or interface freeze.
- **SC-003**: 100% of autonomous check-in attempts from unauthorized hardware during "Presencial" rounds are safely blocked by the backend.
- **SC-004**: 100% of autonomous check-ins during "Casa" rounds are blocked, forcing the professor manual registration flow.
