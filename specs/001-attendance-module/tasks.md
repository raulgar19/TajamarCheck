# Tasks: Attendance Module

**Input**: Design documents from `/specs/001-attendance-module/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests were not explicitly requested, so this task list focuses on implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 [P] Create the backend attendance folder scaffold in `TajamarCheckApi/TajamarCheckApi/Controllers`, `TajamarCheckApi/TajamarCheckApi/Data`, `TajamarCheckApi/TajamarCheckApi/Middlewares`, `TajamarCheckApi/TajamarCheckApi/Models`, `TajamarCheckApi/TajamarCheckApi/Repositories`, and `TajamarCheckApi/TajamarCheckApi/Services`
- [X] T002 [P] Create the frontend attendance folder scaffold in `tajamarcheck/src/app/attendance`, `tajamarcheck/src/app/attendance/student-attendance`, and `tajamarcheck/src/app/attendance/teacher-attendance`
- [X] T003 Add the required backend package references for EF Core SQL Server and Scalar API Reference in `TajamarCheckApi/TajamarCheckApi/TajamarCheckApi.csproj`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create `TajamarCheckApi/TajamarCheckApi/Data/ApplicationDbContext.cs` with `DbSet<Attendance>`, `DbSet<AuthorizedDevice>`, and `DbSet<Session>` plus EF Core configuration for GUID primary keys
- [X] T005 [P] Create `TajamarCheckApi/TajamarCheckApi/Models/Attendance.cs` with GUID key, session linkage, timestamps, status, origin, and traceability fields
- [X] T006 [P] Create `TajamarCheckApi/TajamarCheckApi/Models/AuthorizedDevice.cs` with GUID key, IP address, hostname, activity flag, and timestamps
- [X] T007 [P] Create `TajamarCheckApi/TajamarCheckApi/Models/Session.cs` with GUID key, time window, open-state flag, and teacher linkage
- [X] T008 Create `TajamarCheckApi/TajamarCheckApi/Repositories/IAttendanceRepository.cs` with contracts for attendance persistence, session lookup, and device authorization lookup
- [X] T009 Create `TajamarCheckApi/TajamarCheckApi/Services/ExternalUserService.cs` with `HttpClient` integration to the external identity API and authentication validation helpers
- [X] T010 Create `TajamarCheckApi/TajamarCheckApi/Services/IAttendanceService.cs` and `TajamarCheckApi/TajamarCheckApi/Services/AttendanceService.cs` with application use-case boundaries for autonomous and manual attendance
- [X] T011 Create `TajamarCheckApi/TajamarCheckApi/Middlewares/NetworkValidationMiddleware.cs` scaffold with request IP and hostname extraction helpers
- [X] T012 Create `tajamarcheck/src/app/attendance/attendance.models.ts` and `tajamarcheck/src/app/attendance/attendance.service.ts` with typed request/response contracts and `HttpClient` wiring
- [X] T013 Create `tajamarcheck/src/app/app.routes.ts` and update `tajamarcheck/src/app/app-module.ts` so Angular routing is available for the attendance views
- [X] T014 Update `tajamarcheck/src/app/app.html` to host the main attendance navigation shell and router outlet
- [X] T015 Update `TajamarCheckApi/TajamarCheckApi/Program.cs` to register `ApplicationDbContext`, `IAttendanceRepository` with `AddTransient`, `ExternalUserService` via `HttpClient`, `IAttendanceService`, controllers, `NetworkValidationMiddleware`, and Scalar API Reference

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Fichaje autónomo del alumno (Priority: P1) 🎯 MVP

**Goal**: Allow a student to register attendance autonomously from an authorized device and receive a Spanish confirmation or rejection message.

**Independent Test**: A valid request from an authorized IP and hostname records attendance successfully and shows the result in Spanish.

 [X] T016 [P] [US1] Implement autonomous attendance persistence and session checks in `TajamarCheckApi/TajamarCheckApi/Repositories/AttendanceRepository.cs`
 [X] T017 [US1] Implement the autonomous check-in workflow in `TajamarCheckApi/TajamarCheckApi/Services/AttendanceService.cs` with duplicate-session prevention, `ExternalStudentId`, and Spanish result messages
 [X] T018 [US1] Implement `POST /api/attendance/student` in `TajamarCheckApi/TajamarCheckApi/Controllers/AttendanceController.cs` orchestrating `IAttendanceRepository` and `ExternalUserService`
 [X] T019 [US1] Build `tajamarcheck/src/app/attendance/student-attendance/student-attendance.component.ts`, `tajamarcheck/src/app/attendance/student-attendance/student-attendance.component.html`, and `tajamarcheck/src/app/attendance/student-attendance/student-attendance.component.css` with a dynamic check-in button, loading state, and Spanish error handling
 [X] T020 [US1] Add the student route entry and navigation link in `tajamarcheck/src/app/app.routes.ts` and `tajamarcheck/src/app/app.html`

**Checkpoint**: User Story 1 should now be fully functional and independently testable

---

## Phase 4: User Story 2 - Fichaje manual del profesor (Priority: P2)

**Goal**: Allow a teacher to register manual attendance entries for incidents or special cases with Spanish feedback.

**Independent Test**: A teacher request creates a manual attendance record and returns a Spanish confirmation or validation error.

- [X] T021 [P] [US2] Implement manual attendance persistence and teacher-session lookup in `TajamarCheckApi/TajamarCheckApi/Repositories/AttendanceRepository.cs`
- [X] T022 [US2] Implement the manual attendance workflow in `TajamarCheckApi/TajamarCheckApi/Services/AttendanceService.cs` with professor validation, `ExternalStudentId`, and Spanish feedback
- [X] T023 [US2] Implement `POST /api/admin/attendance-manual` in `TajamarCheckApi/TajamarCheckApi/Controllers/AttendanceController.cs` orchestrating `IAttendanceRepository` and `ExternalUserService`
- [X] T024 [US2] Build `tajamarcheck/src/app/attendance/teacher-attendance/teacher-attendance.component.ts`, `tajamarcheck/src/app/attendance/teacher-attendance/teacher-attendance.component.html`, and `tajamarcheck/src/app/attendance/teacher-attendance/teacher-attendance.component.css` for the manual attendance workflow
- [X] T025 [US2] Add the teacher route entry and navigation link in `tajamarcheck/src/app/app.routes.ts` and `tajamarcheck/src/app/app.html`

**Checkpoint**: User Stories 1 and 2 should both be functional and independently testable

---

## Phase 5: User Story 3 - Validación de dispositivo autorizado (Priority: P3)

**Goal**: Reject autonomous attendance requests that do not come from an authorized IP and hostname pair.

**Independent Test**: A request from an unauthorized device is blocked before the controller handles it and returns a Spanish error.

- [ ] T026 [P] [US3] Implement authorized-device lookup and IP/hostname matching in `TajamarCheckApi/TajamarCheckApi/Repositories/AttendanceRepository.cs`
- [ ] T027 [US3] Complete `TajamarCheckApi/TajamarCheckApi/Middlewares/NetworkValidationMiddleware.cs` to capture the request IP, resolve the hostname, and pass the request along for controller orchestration
- [ ] T028 [US3] Update `TajamarCheckApi/TajamarCheckApi/Services/AttendanceService.cs` and `TajamarCheckApi/TajamarCheckApi/Controllers/AttendanceController.cs` so rejection paths return Spanish messages, preserve traceability, and consult `ExternalUserService`
 - [X] T026 [P] [US3] Implement authorized-device lookup and IP/hostname matching in `TajamarCheckApi/TajamarCheckApi/Repositories/AttendanceRepository.cs`
 - [X] T027 [US3] Complete `TajamarCheckApi/TajamarCheckApi/Middlewares/NetworkValidationMiddleware.cs` to capture the request IP, resolve the hostname, and pass the request along for controller orchestration
 - [X] T028 [US3] Update `TajamarCheckApi/TajamarCheckApi/Services/AttendanceService.cs` and `TajamarCheckApi/TajamarCheckApi/Controllers/AttendanceController.cs` so rejection paths return Spanish messages, preserve traceability, and consult `ExternalUserService`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T029 [P] Update `specs/001-attendance-module/quickstart.md` with the final run commands, backend startup notes, and `pnpm`-based frontend installation steps
- [ ] T030 Update `TajamarCheckApi/TajamarCheckApi/TajamarCheckApi.http` with sample requests for the student and teacher attendance endpoints
- [ ] T031 Verify language consistency across `TajamarCheckApi/TajamarCheckApi/Controllers/AttendanceController.cs`, `TajamarCheckApi/TajamarCheckApi/Services/AttendanceService.cs`, `TajamarCheckApi/TajamarCheckApi/Services/ExternalUserService.cs`, and `tajamarcheck/src/app/attendance/*` so code stays in English and user-facing messages stay in Spanish

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May reuse the same repository and service layer but remains independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Hardens the student flow without changing the teacher flow

### Within Each User Story

- Shared contracts and infrastructure before feature-specific endpoints and components
- Repository methods before service use cases
- Service logic before controller actions
- Controller actions before UI wiring
- Shared navigation updates after the route targets exist

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel because they touch different folders or files
- Foundational model files marked [P] can run in parallel
- User Story 1 repository work and UI work can be split once the foundational contracts are in place
- User Story 2 repository work and UI work can be split once the foundational contracts are in place
- User Story 3 repository lookup work can run in parallel with the middleware completion task once the contracts exist

---

## Parallel Example: User Story 1

```bash
Task: "Implement autonomous attendance persistence and session checks in TajamarCheckApi/TajamarCheckApi/Repositories/AttendanceRepository.cs"
Task: "Build tajamarcheck/src/app/attendance/student-attendance/student-attendance.component.ts, tajamarcheck/src/app/attendance/student-attendance/student-attendance.component.html, and tajamarcheck/src/app/attendance/student-attendance/student-attendance.component.css with a dynamic check-in button, loading state, and Spanish error handling"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify the student autonomous check-in flow independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 backend and controller work
   - Developer B: User Story 1 frontend component work
   - Developer C: User Story 2 preparation or User Story 3 middleware hardening
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence