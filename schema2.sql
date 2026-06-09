-- 0. El endpoint de usuario devuelve el siguiente JSON
/*
{
  "usuario": {
    "idUsuario": 000,
    "nombre": "Alumno 1",
    "apellidos": "Apellido1 Apellido2",
    "email": "email@email.com",
    "estadoUsuario": true,
    "imagen": "https://cdn.pixabay.com/photo/2017/11/10/05/48/user-2935527_640.png",
    "idRole": 2,
    "role": "ALUMNO",
    "idCurso": 1111,
    "curso": "Master",
    "idCursoUsuario": 1111
  },
  "charlas": []
}
*/

-- 1. Tabla de Equipos (El PC del aula es la entidad principal)
CREATE TABLE EquiposAutorizados (
    IdEquipo INT IDENTITY(1,1) PRIMARY KEY,
    NombreEquipo NVARCHAR(100) NOT NULL, -- Ej: 'PC-Aula-101-A'
    IPAsignada VARCHAR(45) NOT NULL UNIQUE,
    IdUsuarioActual INT NULL, -- Clave foránea lógica hacia el endpoint externo. NULL si el PC está libre.
    FechaAsignacion DATETIME NOT NULL DEFAULT GETDATE()
);

-- 2. Tabla de Sesiones (Ahora con tipo de asistencia)
CREATE TABLE Sesiones (
    IdSesion INT IDENTITY(1,1) PRIMARY KEY,
    IdCurso INT NOT NULL,
    Fecha DATE NOT NULL DEFAULT GETDATE(),
    HoraApertura DATETIME NOT NULL DEFAULT GETDATE(),
    HoraCierre DATETIME NULL,
    TipoSesion NVARCHAR(20) NOT NULL DEFAULT 'Presencial' CHECK (TipoSesion IN ('Presencial', 'Virtual')),
    EsRondaCambio BIT NOT NULL DEFAULT 0,
    Estado NVARCHAR(20) NOT NULL DEFAULT 'Abierta' CHECK (Estado IN ('Abierta', 'Cerrada'))
);

-- 3. Tabla de Asistencias (Con justificaciones y adaptada a pases de lista manuales)
CREATE TABLE Asistencias (
    IdAsistencia INT IDENTITY(1,1) PRIMARY KEY,
    IdSesion INT NOT NULL,
    IdUsuario INT NOT NULL,
    NombreUsuario NVARCHAR(100) NOT NULL,
    HoraFichaje DATETIME NOT NULL DEFAULT GETDATE(),
    IPUtilizada VARCHAR(45) NULL, -- Permite NULL porque en 'Virtual' manual no hay IP de validación
    EstadoAsistencia NVARCHAR(20) NOT NULL CHECK (EstadoAsistencia IN ('Presente', 'Retraso', 'Falta')),
    
    -- Nuevos campos para la gestión de justificaciones
    Justificacion NVARCHAR(500) NULL, -- El texto o motivo que aporta el alumno/profesor
    EstaJustificada BIT NOT NULL DEFAULT 0, -- 1 = El profesor ha aceptado la justificación
    
    -- Claves foráneas
    CONSTRAINT FK_Asistencias_Sesiones FOREIGN KEY (IdSesion) REFERENCES Sesiones(IdSesion),
    
    -- Restricción: Un alumno solo tiene un registro por sesión
    CONSTRAINT UQ_Asistencia_SesionUsuario UNIQUE (IdSesion, IdUsuario)
);