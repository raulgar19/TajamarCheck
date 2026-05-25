# Attendance API Contract

## Base Path
`/api`

## POST /attendance/student

Registers an autonomous student attendance event.

### Request
```json
{
  "externalStudentId": "1d5f3d89-3a8f-4c1f-8b9d-8b5ce9d0a111",
  "sessionId": "7e6d0b2a-1f1d-43d6-8a4d-9f5b8f0b2222",
  "deviceHostname": "CLASSROOM-PC-01"
}
```

### Headers
- `Content-Type: application/json`
- `X-Client-Hostname: CLASSROOM-PC-01` or equivalent controlled hostname field when needed by the middleware flow

### Success Response
```json
{
  "success": true,
  "message": "Fichaje registrado correctamente.",
  "attendanceId": "3aa5b6c1-2d52-4b4f-9e68-123456789abc",
  "externalStudentId": "1d5f3d89-3a8f-4c1f-8b9d-8b5ce9d0a111"
}
```

### Error Response
```json
{
  "success": false,
  "message": "El dispositivo no está autorizado para fichar desde esta red."
}
```

## POST /admin/attendance-manual

Creates a manual attendance entry from the teacher flow.

### Request
```json
{
  "externalStudentId": "1d5f3d89-3a8f-4c1f-8b9d-8b5ce9d0a111",
  "sessionId": "7e6d0b2a-1f1d-43d6-8a4d-9f5b8f0b2222",
  "reason": "Fichaje manual por incidencia de acceso"
}
```

### Success Response
```json
{
  "success": true,
  "message": "Fichaje manual registrado correctamente.",
  "attendanceId": "4bb6c7d2-3e63-4c5f-a979-abcdef123456",
  "externalStudentId": "1d5f3d89-3a8f-4c1f-8b9d-8b5ce9d0a111"
}
```

## Shared rules

- All response messages must be in Spanish.
- All identifiers and DTO names remain in English.
- All primary keys use GUID values.
- No request or response should imply a local student table or local user entity.
- The API must be discoverable through Scalar in development.
