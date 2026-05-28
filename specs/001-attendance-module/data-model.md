# Data Model: Attendance and Checking Module

This document defines the database schemas, entity definitions, and SQL migrations required to support the new attendance module in SQL Server using Entity Framework Core.

---

## Entity Schema Mapping

All new tables utilize `UNIQUEIDENTIFIER` (GUID) as primary keys, configured to generate values automatically via EF Core and SQL Server's `NEWID()`. Student references use the standard legacy `INT` type.

### 1. `EquiposAutorizados` (Authorized Devices)
- **Table Name**: `EquiposAutorizados`
- **Purpose**: Whitelist of devices authorized for students' autonomous check-ins.

| Property | Type | DB Column Type | Nullable | Constraints / Details |
| :--- | :--- | :--- | :--- | :--- |
| `Id` | `Guid` | `UNIQUEIDENTIFIER` | No | Primary Key, default `NEWID()` |
| `NombreDispositivo` | `string` | `NVARCHAR(150)` | No | Hostname of the classroom PC (Unique Index) |
| `DireccionIP` | `string` | `NVARCHAR(50)` | No | Whitelisted static IP |
| `Activo` | `bool` | `BIT` | No | Flag indicating if whitelist entry is active (Default: `1`) |

---

### 2. `Sesiones` (Class Sessions)
- **Table Name**: `Sesiones`
- **Purpose**: Defines active class sessions, restricting or permitting student autonomy.

| Property | Type | DB Column Type | Nullable | Constraints / Details |
| :--- | :--- | :--- | :--- | :--- |
| `Id` | `Guid` | `UNIQUEIDENTIFIER` | No | Primary Key, default `NEWID()` |
| `TipoClase` | `TipoClase` (Enum) | `INT` | No | 1 = `Presencial`, 2 = `Casa` |
| `Fecha` | `DateTime` | `DATETIME2` | No | Session date and time |
| `CursoId` | `int` | `INT` | No | Logical reference to the target Course |

---

### 3. `Fichajes` (Attendance Logs)
- **Table Name**: `Fichajes`
- **Purpose**: Records individual attendance registrations.

| Property | Type | DB Column Type | Nullable | Constraints / Details |
| :--- | :--- | :--- | :--- | :--- |
| `Id` | `Guid` | `UNIQUEIDENTIFIER` | No | Primary Key, default `NEWID()` |
| `StudentId` | `int` | `INT` | No | References legacy students table |
| `FechaHora` | `DateTime` | `DATETIME2` | No | Timestamp of check-in registration |
| `EquipoId` | `Guid?` | `UNIQUEIDENTIFIER` | Yes | Foreign Key to `EquiposAutorizados` |
| `Metodo` | `MetodoFichaje` (Enum) | `INT` | No | 1 = `Automatico_Alumno`, 2 = `Manual_Profesor` |
| `IpDetectada` | `string` | `NVARCHAR(50)` | No | The client IP detected during the request |
| `HostnameDetectado` | `string` | `NVARCHAR(150)` | No | Hostname header detected during the request |

---

## SQL Script (DDL)

The following DDL script generates the SQL Server database schema:

```sql
-- DDL Migration for TajamarCheck new attendance tables

CREATE TABLE EquiposAutorizados (
    Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    NombreDispositivo NVARCHAR(150) NOT NULL UNIQUE,
    DireccionIP NVARCHAR(50) NOT NULL,
    Activo BIT NOT NULL DEFAULT 1
);

CREATE TABLE Sesiones (
    Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    TipoClase INT NOT NULL CHECK (TipoClase IN (1, 2)), -- 1 = Presencial, 2 = Casa
    Fecha DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CursoId INT NOT NULL
);

CREATE TABLE Fichajes (
    Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    StudentId INT NOT NULL,
    FechaHora DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    EquipoId UNIQUEIDENTIFIER NULL,
    Metodo INT NOT NULL CHECK (Metodo IN (1, 2)), -- 1 = Automatico_Alumno, 2 = Manual_Profesor
    IpDetectada NVARCHAR(50) NOT NULL,
    HostnameDetectado NVARCHAR(150) NOT NULL,
    CONSTRAINT FK_Fichajes_Equipos FOREIGN KEY (EquipoId) REFERENCES EquiposAutorizados(Id)
);
```
