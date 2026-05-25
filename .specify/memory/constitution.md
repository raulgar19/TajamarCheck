<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles: Arquitectura Desacoplada; Lenguaje e Idioma; Datos y Claves; Seguridad de Fichaje; Documentación y Calidad
Added sections: Restricciones de Plataforma y Herramientas; Flujo de Desarrollo y Validación
Removed sections: none
Templates requiring updates: ✅ updated .specify/templates/plan-template.md; ✅ updated .specify/templates/spec-template.md; ✅ updated .specify/templates/tasks-template.md
Follow-up TODOs: none
-->

# CheckingTajamar Constitution

## Core Principles

### I. Arquitectura Desacoplada
La solución MUST mantener el backend como una API REST en capas con el flujo
Controlador -> Servicio -> Repositorio y contratos explícitos por interfaz. Los
controladores no acceden a datos ni lógica de negocio directamente; los servicios
encapsulan reglas; los repositorios encapsulan persistencia. Los repositorios sin
estado MUST registrarse con `AddTransient`. El frontend Angular MUST consumir la
API solo a través de servicios dedicados con `HttpClient`.

### II. Lenguaje e Idioma
El código fuente MUST estar en inglés con C# moderno en el backend y TypeScript
estricto en el frontend. Los identificadores de dominio, la base de datos y los
contratos técnicos MUST permanecer en inglés. La interfaz de usuario en Angular y
los mensajes de respuesta de la API MUST estar en español. El gestor de paquetes
oficial MUST ser `pnpm`; usar `npm` para instalar dependencias está prohibido.
Los comentarios pueden incluir humor sarcástico breve, pero MUST seguir siendo
claros, útiles y no deben ocultar la intención del código.

### III. Datos y Claves
La persistencia MUST usar SQL Server con Entity Framework Core. Todas las
entidades MUST usar GUID/UUID como clave primaria para mejorar seguridad y
escalabilidad. Los modelos, migraciones y relaciones MUST preservarse con
tipado fuerte y nombres en inglés. No se permite acceso directo a la base de
datos desde controladores o vistas; toda lectura y escritura pasa por servicios
y repositorios.

### IV. Seguridad de Fichaje
La API MUST incluir un middleware que valide el fichaje autónomo presencial con
doble factor de identidad de hardware: dirección IP y hostname del PC. Si uno de
los dos valores no coincide con la política definida, la operación MUST ser
rechazada y registrada. Esta validación protege los flujos de asistencia y no
puede ser omitida por la capa de presentación.

### V. Documentación y Calidad
La API MUST exponer Scalar API Reference para explorar y probar los endpoints.
Cada cambio relevante MUST conservar trazabilidad mediante pruebas, validación de
inyección de dependencias y manejo consistente de errores. La documentación y los
contratos técnicos MUST reflejar el comportamiento real del sistema antes de
considerar listo cualquier incremento.

## Restricciones de Plataforma y Herramientas

La plataforma objetivo del backend MUST ser .NET 10 y la SPA MUST construirse con
Angular 21.2.12. El backend debe exponer una API REST; no se permiten atajos que
mezclen vista y controlador. El frontend MUST utilizar servicios dedicados para
todo acceso remoto. La estructura de despliegue y desarrollo MUST mantenerse en
inglés para código y datos, con idioma español reservado a UI y respuestas de la
API.

## Flujo de Desarrollo y Validación

Todo trabajo MUST respetar el patrón Controlador -> Servicio -> Repositorio,
con interfaces explícitas y registro por DI acorde al tipo de dependencia. Los
repositorios sin estado MUST ser `AddTransient`; cualquier desviación requiere
justificación formal en la planificación. Antes de cerrar un cambio, el equipo
MUST validar que la API siga documentada con Scalar, que los mensajes sigan en
español, que los identificadores sigan en inglés y que el middleware de fichaje
continúe activo en los endpoints afectados.

## Governance
La constitución prevalece sobre cualquier práctica local, plantilla o preferencia
personal cuando exista conflicto. Cualquier enmienda MUST incluir motivo,
impacto en versiones y actualización de los artefactos dependientes. Cada PR o
revisión MUST verificar cumplimiento con esta constitución antes de aprobarse;
si una excepción es necesaria, debe quedar documentada explícitamente y con fecha
de expiración.

El versionado MUST seguir semver. Cambios incompatibles o redefiniciones de
principio requieren incremento MAJOR; nuevas reglas o expansión material,
MINOR; aclaraciones no semánticas, PATCH. La fecha de ratificación fija el inicio
formal de este marco y la fecha de última enmienda MUST reflejar la edición más
reciente.

**Version**: 1.0.0 | **Ratified**: 2026-05-25 | **Last Amended**: 2026-05-25
