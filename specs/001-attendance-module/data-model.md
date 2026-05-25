# Data Model: Attendance Module

## Attendance

Represents a single attendance event for an externally identified student.

### Fields
- `Id: Guid` - Primary key.
- `ExternalStudentId: Guid` - External identity for the student who checked in.
- `SessionId: Guid` - References the active attendance session.
- `AttendanceType: string` - Indicates autonomous or manual attendance.
- `Status: string` - Indicates accepted, rejected, or pending.
- `CreatedAtUtc: DateTime` - Timestamp for the record.
- `CreatedBy: string` - Technical identifier for the actor or system source.
- `Reason: string?` - Optional explanation for rejection or manual notes.
- `IpAddress: string?` - Remote IP captured for the autonomous flow.
- `Hostname: string?` - Hostname captured for the autonomous flow.

### Rules
- Uses a GUID primary key.
- Must be stored in SQL Server through EF Core.
- Must keep technical names in English.
- Must not define any local foreign key or local user/student relationship.
- Must preserve traceability for both accepted and rejected attempts.

## AuthorizedDevice

Represents a workstation or device approved for autonomous student check-in.

### Fields
- `Id: Guid` - Primary key.
- `IpAddress: string` - Authorized remote IP.
- `Hostname: string` - Authorized workstation hostname.
- `IsActive: bool` - Indicates whether the device is currently allowed.
- `CreatedAtUtc: DateTime` - Creation timestamp.
- `UpdatedAtUtc: DateTime?` - Last update timestamp.

### Rules
- Uses a GUID primary key.
- The IP and hostname pair must match the incoming student request.
- Inactive devices must fail validation.

## Session

Represents an attendance window or active class session.

### Fields
- `Id: Guid` - Primary key.
- `Name: string` - Friendly session name.
- `StartUtc: DateTime` - Start time.
- `EndUtc: DateTime?` - End time.
- `IsOpen: bool` - Indicates whether the session accepts attendance.
- `TeacherId: Guid?` - Optional link to the teacher who owns the session.
- `CreatedAtUtc: DateTime` - Creation timestamp.

### Rules
- Uses a GUID primary key.
- Student check-ins must resolve to an open session.
- Manual attendance should target the intended session or create the needed correction context.

## Relationships

- `Session` has many `Attendance` records.
- `AuthorizedDevice` is validated independently and is not a direct parent of `Attendance`.
- `Attendance` belongs to one `Session` and one `ExternalStudentId` value.

## State Notes

- `Attendance.Status` can transition from `Pending` to `Accepted` or `Rejected`.
- Manual attendance can create an `Accepted` record directly when authorized by the teacher flow.
- Rejected autonomous attempts should still be auditable.
