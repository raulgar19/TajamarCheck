<!--
SYNC IMPACT REPORT
==================
Version change: 1.1.0 → 1.2.0
Modified principles:
  - I. Arquitectura Desacoplada y Stack Tecnológico (added routing views details)
  - III. Seguridad y Autenticación de Sesiones → III. Seguridad, Autenticación y Enrutamiento de Roles
  - V. Validación por Red y Hardware (Middleware de Fichaje) (integrated rounds control)
  - VI. Control de Modalidad de Fichaje → VI. Gestión de Rondas Diarias (Presencial vs. Casa)
Added principles:
  - VIII. Calendario Multi-Mensual e Historial
Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated)
  - .specify/templates/spec-template.md (✅ updated)
  - .specify/templates/tasks-template.md (✅ updated)
Follow-up TODOs: None
-->
# CheckingTajamar Constitution

## Core Principles

### I. Arquitectura Desacoplada y Stack Tecnológico
La solución se compone de dos proyectos independientes: un backend API REST implementado en .NET 10 y un frontend SPA con Angular. La comunicación es estrictamente desacoplada a través de peticiones HTTP en servicios dedicados de Angular que utilizan `HttpClient`. El gestor de paquetes exclusivo para el frontend es `pnpm`. El frontend maneja de forma inteligente la segregación de vistas y enrutamiento por roles para Alumnos y Profesores.

### II. Lenguaje e Idioma de Desarrollo
Todo el código fuente (nombres de variables, clases, métodos, propiedades, identificadores y nombres de bases de datos), la documentación técnica y los artefactos del sistema deben estar estrictamente en inglés. No obstante, las interfaces de usuario (Angular) y todos los mensajes de error, confirmación o respuestas explicativas enviadas por el servidor REST al cliente deben mostrarse en español.

### III. Seguridad, Autenticación y Enrutamiento de Roles
El sistema expone un portal de inicio de sesión único donde las credenciales se validan contra la API externa de Azure. La aplicación SPA identifica inmediatamente el rol del usuario (Profesor si el nombre de usuario/correo contiene `profe` o `admin`, y Alumno para el resto) y redirige de forma segura a su correspondiente panel de control (`/home` de Alumno o `/home` de Profesor). Las cabeceras JWT y la validez de la sesión se controlan a nivel global.

### IV. Identificación Robusta mediante GUIDs (UUID)
Para garantizar la máxima seguridad, robustez y evitar la enumeración predecible de recursos, todas las tablas de la base de datos (SQL Server con Entity Framework Core) deben utilizar GUID (UUID) como Clave Primaria (PK) no secuencial en lugar de enteros autoincrementales, excepto los identificadores de alumnos que se mantienen como enteros (`StudentId INT`) para fines de compatibilidad con el sistema legacy.

### V. Validación por Red y Hardware (Middleware de Fichaje)
El fichaje autónomo de los alumnos está regulado de forma estricta por el tipo de ronda diaria activa. Si la ronda está configurada como "desde clase" (Presencial), el fichaje requiere validación obligatoria en dos factores: la Dirección IP y el Hostname (NombreDispositivo) del PC del aula, contrastados contra la tabla `EquiposAutorizados`. Cualquier discrepancia entre estos datos y el origen de la petición denegará inmediatamente el fichaje.

### VI. Gestión de Rondas Diarias (Presencial vs. Casa)
El sistema implementa un control dinámico diario administrado exclusivamente por el profesor:
- **Ronda desde Clase (Presencial)**: Los alumnos pueden fichar de manera autónoma desde equipos autorizados en el aula tras pasar las validaciones de IP y Hostname.
- **Ronda desde Casa (Casa)**: El fichaje autónomo para alumnos queda estrictamente bloqueado en el backend con un código de estado HTTP `403 Forbidden`. En este escenario, el profesor es el único responsable de registrar manualmente la asistencia, faltas o retrasos de los alumnos.

### VII. Documentación y Pruebas con Scalar API Reference
Toda la interfaz del backend debe estar expuesta, documentada e integrada con `Scalar API Reference` para facilitar la inspección, pruebas interactivas de endpoints y el mantenimiento ágil de los contratos API.

### VIII. Calendario Multi-Mensual e Historial
La interfaz del alumno debe exponer un cuadro de mando con sus estadísticas acumuladas de faltas, retrasos y porcentaje de asistencia. Incorporará obligatoriamente un calendario dinámico con controles de navegación para visualizar cualquier mes del año escolar, mostrando de forma visual los días con faltas (rojo) y retrasos (amarillo), acompañado de un desglose histórico estructurado por meses.

## Estándares de Base de Datos y Persistencia
El backend de la solución utiliza SQL Server mediante Entity Framework Core como motor de base de datos relacional. El modelo principal cuenta con las siguientes tablas:
- `EquiposAutorizados` para almacenar los PCs habilitados de cada aula (Id GUID, NombreDispositivo string, DireccionIP string, Activo bool).
- `Sesiones` (o Rondas) para guardar el estado del fichaje del día (Id GUID, TipoClase string, Fecha datetime, CursoId INT).
- `Fichajes` y registros legacy (`Absences` y `AttendanceLogs`) para persistir la asistencia (Id GUID o INT, StudentId INT, FechaHora/Date, EquipoId GUID nullable, Metodo/Type, IpDetectada string, HostnameDetectado string).

## Arquitectura del Backend y Patrones
El backend debe seguir de manera estricta la arquitectura de tres capas: Controller -> Service -> Repository con interfaces explícitas. Todos los repositorios deben ser stateless y registrarse mediante `AddTransient` en el contenedor de dependencias, estando estrictamente prohibido su consumo directo en controladores (deben pasar siempre por la capa de servicio).

## Governance
Toda contribución de código, modificación en el esquema de base de datos o en los endpoints API debe estar sujeta a esta constitución. Los cambios en los principios fundamentales requieren justificación documentada y aprobación para garantizar la escalabilidad y seguridad de la aplicación.

**Version**: 1.2.0 | **Ratified**: 2026-05-26 | **Last Amended**: 2026-05-27
