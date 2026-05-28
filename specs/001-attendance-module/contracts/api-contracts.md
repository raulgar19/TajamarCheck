# API Contracts: Attendance and Checking Module

This document outlines the REST API endpoints, HTTP request/response payloads, headers, and status codes designed for the TajamarCheck Attendance and Checking Module.

---

## Student Endpoints

### 1. Register Autonomous Check-in
- **Endpoint**: `POST /api/fichaje/alumno`
- **Authentication**: Required (Student Session JWT/Bearer Token)
- **Headers**:
  - `Content-Type: application/json`
  - `X-Client-Hostname: <Injected-by-gateway>` (Required for hardware validation)
- **Request Body**:
  ```json
  {
    "studentId": 142
  }
  ```
- **Responses**:
  - **`200 OK`** (Success):
    ```json
    {
      "mensaje": "Fichaje realizado con éxito.",
      "id": "e0b4a45a-c0b7-4cbe-827c-faad7b70743b"
    }
    ```
  - **`400 Bad Request`** (Invalid parameters or missing headers):
    ```json
    {
      "mensaje": "La dirección IP o el Hostname del dispositivo no pudieron ser determinados."
    }
    ```
  - **`403 Forbidden`** (IP/Hostname mismatch, inactive device, or "Casa" mode active):
    ```json
    {
      "mensaje": "Acceso denegado: El fichaje autónomo no está habilitado para clases desde casa o este dispositivo no está autorizado."
    }
    ```

---

## Professor & Administrator Endpoints

### 2. Register Manual Check-in (Professor Roll Call)
- **Endpoint**: `POST /api/admin/asistencia-manual`
- **Authentication**: Required (Role: Professor/Admin)
- **Request Body**:
  ```json
  {
    "studentId": 142,
    "sessionId": "b3e0c0f9-2bda-42c2-b36d-d1ef1068df6d"
  }
  ```
- **Responses**:
  - **`200 OK`**:
    ```json
    {
      "mensaje": "Fichaje manual registrado por el profesor con éxito.",
      "id": "a9089f2a-d98f-4ba6-8f3a-18f1fbd920be"
    }
    ```
  - **`404 Not Found`** (Session or Student not found):
    ```json
    {
      "error": "La sesión de clase especificada no existe."
    }
    ```

---

### 3. Whitelisted Devices CRUD

#### GET /api/admin/equipos
- **Description**: Returns all whitelisted devices.
- **Response `200 OK`**:
  ```json
  [
    {
      "id": "7ac2e69f-3660-496a-a28a-8671bbbc6e58",
      "nombreDispositivo": "AULA-02-PC-12",
      "direccionIP": "192.168.12.112",
      "activo": true
    }
  ]
  ```

#### POST /api/admin/equipos
- **Description**: Add a new PC to the whitelist.
- **Request Body**:
  ```json
  {
    "nombreDispositivo": "AULA-02-PC-13",
    "direccionIP": "192.168.12.113",
    "activo": true
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "id": "9dcf6b8f-3dae-4ad2-a38f-41271ee9d76c",
    "nombreDispositivo": "AULA-02-PC-13",
    "direccionIP": "192.168.12.113",
    "activo": true
  }
  ```

#### PUT /api/admin/equipos/{id}
- **Description**: Update a PC configuration or toggle active status.
- **Request Body**:
  ```json
  {
    "nombreDispositivo": "AULA-02-PC-13-ALT",
    "direccionIP": "192.168.12.113",
    "activo": false
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "id": "9dcf6b8f-3dae-4ad2-a38f-41271ee9d76c",
    "nombreDispositivo": "AULA-02-PC-13-ALT",
    "direccionIP": "192.168.12.113",
    "activo": false
  }
  ```

#### DELETE /api/admin/equipos/{id}
- **Description**: Remove a device from the whitelist.
- **Response `204 No Content`**

---

### 4. Export Reports
- **Endpoint**: `GET /api/reportes/excel`
- **Authentication**: Required (Role: Professor/Admin)
- **Response `200 OK`**:
  - **Headers**: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename=reporte-asistencia.xlsx`
  - **Payload**: Binary spreadsheet stream.
