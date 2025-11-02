-- Script de Creación de Base de Datos para PeritoApp
-- Azure SQL Database
-- Ejecutar este script en Azure Portal → Query Editor

-- ============================================
-- Tabla: Casos
-- ============================================
IF OBJECT_ID('Casos', 'U') IS NOT NULL
    DROP TABLE Casos;
GO

CREATE TABLE Casos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    direccion VARCHAR(500) NOT NULL,
    ciudad VARCHAR(100),
    barrio VARCHAR(100),
    tipoInmueble VARCHAR(50),
    estado VARCHAR(50) DEFAULT 'pendiente',
    prioridad VARCHAR(20) DEFAULT 'media',
    peritoId VARCHAR(100),
    peritoNombre VARCHAR(200),
    coordinadorId VARCHAR(100),
    fechaCreacion DATETIME2 DEFAULT GETDATE(),
    fechaActualizacion DATETIME2 DEFAULT GETDATE(),
    fechaAsignacion DATETIME2,
    observaciones NVARCHAR(MAX)
);
GO

CREATE INDEX idx_casos_codigo ON Casos(codigo);
CREATE INDEX idx_casos_peritoId ON Casos(peritoId);
CREATE INDEX idx_casos_estado ON Casos(estado);
CREATE INDEX idx_casos_fechaCreacion ON Casos(fechaCreacion DESC);
GO

-- ============================================
-- Tabla: Archivos
-- ============================================
IF OBJECT_ID('Archivos', 'U') IS NOT NULL
    DROP TABLE Archivos;
GO

CREATE TABLE Archivos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    casoId INT NOT NULL,
    codigoCaso VARCHAR(50) NOT NULL,
    nombreArchivo VARCHAR(500) NOT NULL,
    tipoArchivo VARCHAR(50) NOT NULL, -- 'foto' o 'formulario'
    tamañoBytes BIGINT,
    mimeType VARCHAR(100),
    onedriveFileId VARCHAR(200),
    onedriveUrl VARCHAR(1000),
    onedriveUrlDescarga VARCHAR(1000),
    rutaOnedrive VARCHAR(1000),
    usuarioId VARCHAR(100),
    usuarioNombre VARCHAR(200),
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    fechaSubida DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (casoId) REFERENCES Casos(id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_archivos_casoId ON Archivos(casoId);
CREATE INDEX idx_archivos_tipoArchivo ON Archivos(tipoArchivo);
CREATE INDEX idx_archivos_fechaSubida ON Archivos(fechaSubida DESC);
GO

-- ============================================
-- Tabla: Formularios
-- ============================================
IF OBJECT_ID('Formularios', 'U') IS NOT NULL
    DROP TABLE Formularios;
GO

CREATE TABLE Formularios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    casoId INT NOT NULL,
    codigoCaso VARCHAR(50) NOT NULL,
    peritoId VARCHAR(100) NOT NULL,
    peritoNombre VARCHAR(200),
    datosJson NVARCHAR(MAX), -- JSON con todos los datos del formulario
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    fechaCreacion DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (casoId) REFERENCES Casos(id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_formularios_casoId ON Formularios(casoId);
CREATE INDEX idx_formularios_peritoId ON Formularios(peritoId);
CREATE INDEX idx_formularios_fechaCreacion ON Formularios(fechaCreacion DESC);
GO

-- ============================================
-- Datos de Prueba
-- ============================================

-- Insertar casos de prueba
INSERT INTO Casos (codigo, direccion, ciudad, barrio, tipoInmueble, estado, prioridad, coordinadorId)
VALUES
('CASO-001', 'Calle 123 #45-67', 'Bogotá', 'Chapinero', 'Apartamento', 'pendiente', 'alta', 'admin'),
('CASO-002', 'Carrera 7 #32-16', 'Bogotá', 'Teusaquillo', 'Casa', 'pendiente', 'media', 'admin'),
('CASO-003', 'Avenida 68 #98-23', 'Bogotá', 'Suba', 'Local Comercial', 'pendiente', 'baja', 'admin');
GO

-- Verificar que todo se creó correctamente
SELECT 'Casos creados:' AS Tabla, COUNT(*) AS Total FROM Casos
UNION ALL
SELECT 'Archivos creados:', COUNT(*) FROM Archivos
UNION ALL
SELECT 'Formularios creados:', COUNT(*) FROM Formularios;
GO

PRINT '✅ Base de datos creada exitosamente';
PRINT '✅ 3 casos de prueba insertados';
PRINT '';
PRINT '🎯 Siguiente paso: Ejecuta "npm run dev" en el backend';
GO
