# Tasks: Attendance and Checking Module

**Input**: Design documents from `specs/001-attendance-module/`
**Prerequisites**: plan.md (required), spec.md (required)

**Tests**: Vitest for frontend and xUnit for backend. Tests are optional and run alongside standard code validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initial project setup and layout configuration.

- [x] T001 Initialize branch feature workspace and verify Angular and .NET project configuration
- [x] T002 Configure client-side routes for authentication and home layout in `tajamarcheck/src/app/app.routes.ts`
- [x] T003 Setup pnpm package dependencies and ensure Tailwind config is loaded in `tajamarcheck/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schemas and migrations. Must be completed before any user story can start.

- [x] T004 [P] Createwhitelisted device model `EquipoAutorizado.cs` in `TajamarCheckApi/TajamarCheckApi/Models/`
- [x] T005 [P] Create class session round model `Sesion.cs` in `TajamarCheckApi/TajamarCheckApi/Models/`
- [x] T006 Add new DbSets for `EquiposAutorizados` and `Sesiones` inside `TajamarCheckApi/TajamarCheckApi/Data/ApplicationDbContext.cs`
- [x] T007 Execute EF Core migrations to create new tables and update database in `TajamarCheckApi/TajamarCheckApi/`

**Checkpoint**: Foundation ready - database structures and schemas are successfully deployed.

---

## Phase 3: User Story 1 - Login & Role-Based Navigation (Priority: P1) 🎯 MVP

**Goal**: Authenticate users against Azure API and route them based on their Alumno or Profesor role.

**Independent Test**: Log in with student credentials to see Student dashboard, log in with teacher credentials to see Teacher panel.

### Implementation for User Story 1

- [x] T008 [P] [US1] Create centralized authentication state service in `tajamarcheck/src/app/auth/auth.service.ts` to manage token storage and parse role rules
- [x] T009 [US1] Implement role-based navigation logic inside component class `tajamarcheck/src/app/auth/login.component.ts`
- [x] T010 [US1] Customize login interactive template form in `tajamarcheck/src/app/auth/login.component.html`

**Checkpoint**: Centralized login is fully functional and successfully segregates routes by role.

---

## Phase 4: User Story 2 - Student Dashboard & Multi-Month Calendar (Priority: P1) 🎯 MVP

**Goal**: Enable students to view metric statistics and dynamically navigate any month on the calendar to see absences/delays.

**Independent Test**: Load student home dashboard, navigate months on calendar, and verify occurrences list update.

### Implementation for User Story 2

- [x] T011 [P] [US2] Expose GET endpoints to fetch absences and logs by student ID in `TajamarCheckApi/TajamarCheckApi/Controllers/AttendanceController.cs`
- [x] T012 [P] [US2] Create student attendance service in `tajamarcheck/src/app/home/student.service.ts` to fetch raw records from the API
- [x] T013 [US2] Implement navigable calendar logic supporting all months in component class `tajamarcheck/src/app/home/home.component.ts`
- [x] T014 [US2] Code metrics dashboard, multi-month calendar, and incidents list UI in `tajamarcheck/src/app/home/home.component.html`

**Checkpoint**: Student dashboard dynamically displays complete navigable attendance records for any selected month.

---

## Phase 5: User Story 3 - Student Check-In & Check-Out (Priority: P1) 🎯 MVP

**Goal**: Let students autonomously register their entry and exit via double-factor validation during physical rounds.

**Independent Test**: Click Check-in button from authorized PC to succeed, click from home PC to receive network block.

### Implementation for User Story 3

- [x] T015 [P] [US3] Add autonomous student check-in/out controller action `POST /api/fichaje/alumno` in `TajamarCheckApi/TajamarCheckApi/Controllers/AttendanceController.cs`
- [x] T016 [US3] Implement custom request filter/middleware to validate IP and `X-Client-Hostname` headers against whitelisted devices in `TajamarCheckApi/TajamarCheckApi/Controllers/AttendanceController.cs`
- [x] T017 [US3] Code student check-in/out view class in `tajamarcheck/src/app/student-checkin/student-checkin.component.ts`
- [x] T018 [US3] Design student check-in layout with responsive status alerts in `tajamarcheck/src/app/student-checkin/student-checkin.component.html`

**Checkpoint**: Student check-in/out screen is fully integrated and securely validates classroom hardware constraints.

---

## Phase 6: User Story 4 - Teacher Round Management (Priority: P1) 🎯 MVP

**Goal**: Let professors open daily rounds (Classroom/Home) and perform manual student roll calls.

**Independent Test**: Toggle round mode as teacher, verify autonomous student block in Home mode, and add a manual attendance entry.

### Implementation for User Story 4

- [x] T019 [P] [US4] Add active round status endpoints `GET /api/rondas/estado` and `POST /api/rondas/abrir` in `TajamarCheckApi/TajamarCheckApi/Controllers/AttendanceController.cs`
- [x] T020 [P] [US4] Implement whitelist CRUD controllers for whitelisted PCs management in `TajamarCheckApi/TajamarCheckApi/Controllers/AttendanceController.cs`
- [x] T021 [US4] Code teacher round controls, device CRUD panel, and manual student roll call in `tajamarcheck/src/app/home/home.component.ts`
- [x] T022 [US4] Design teacher round management dashboard and list layout in `tajamarcheck/src/app/home/home.component.html`

**Checkpoint**: Teacher dashboard is completely integrated, enabling dynamic daily round configuration and manual roll calls.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Responsive layouts refinement and validation.

- [x] T023 Refine premium visual cards and glassmorphism styles across views in `tajamarcheck/src/app/app.css`
- [x] T024 Perform complete integration testing across login, student, and teacher dashboard flows

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. Blocks all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion. Can be worked on in parallel or sequentially.
- **Polish (Final Phase)**: Depends on all user stories completion.

### Parallel Opportunities

- Models setup T004, T005, T006 can run in parallel.
- Frontend services T008, T012 can be implemented in parallel.
- CRUD API controllers T020 and round states T019 can run in parallel.
