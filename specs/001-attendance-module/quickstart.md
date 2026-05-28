# Quickstart Guide: Attendance and Checking Module

This guide provides steps for setting up, running, and manually testing the Attendance and Checking Module locally for both backend and frontend development.

---

## 1. Backend Setup & Run

### Step 1: Database Migration
Apply the migrations using EF Core Tools:
```powershell
# Navigate to the API project folder
cd TajamarCheckApi/TajamarCheckApi

# Add EF Core migration for the new tables
dotnet ef migrations add AddAttendanceModule

# Apply migrations to SQL Server
dotnet ef database update
```

### Step 2: Running the API Backend
Run the dev server:
```powershell
dotnet run
```
Once launched, access the **Scalar API Reference** in your browser at:
* **Interactive Docs**: `https://localhost:7296/scalar/v1` (or local port specified in your console output)

---

## 2. Seed Whitelist Data for Local Testing

Insert a local whitelisted PC inside the `EquiposAutorizados` table in SQL Server so you can test the autonomous check-in flow:

```sql
INSERT INTO EquiposAutorizados (Id, NombreDispositivo, DireccionIP, Activo)
VALUES (NEWID(), 'AULA-LOCAL-PC', '127.0.0.1', 1);
```

---

## 3. Testing Client Check-ins via cURL / Postman

To simulate a student check-in, send a POST request with the gateway proxy header:

```bash
curl -X POST https://localhost:7296/api/fichaje/alumno \
     -H "Content-Type: application/json" \
     -H "X-Client-Hostname: AULA-LOCAL-PC" \
     -d "{\"studentId\": 142}"
```

**Expected Responses**:
* If `AULA-LOCAL-PC` is active and request comes from `127.0.0.1` (or matching IP): `200 OK` (Fichaje realizado con éxito).
* If Hostname is mismatch or device inactive: `403 Forbidden` (Acceso denegado).

---

## 4. Frontend Setup & Run (Angular)

### Step 1: Install Dependencies
Open a shell in the Angular workspace and run:
```powershell
cd tajamarcheck
pnpm install
```

### Step 2: Launch the SPA Application
Start the Angular dev server:
```powershell
pnpm run dev --open
```
Open `http://localhost:4200/` to interact with the frontend:
* **Student View**: Dynamic button "Fichar".
* **Teacher View**: Modal selector to toggle "Presencial / Casa" class mode, and student list for manual roll call.
* **Device Management View**: CRUD tables for adding and deactivating Whitelisted PCs.
