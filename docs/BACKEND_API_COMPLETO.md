# 🚀 Backend API Completo - PeritoApp

Documentación completa del backend con Node.js, Microsoft Graph API y Azure SQL.

---

## 📦 Resumen de Lo Creado

### ✅ Estructura del Proyecto

```
backend/
├── server.js                    # Servidor Express principal
├── package.json                 # Dependencias
├── .env.example                 # Variables de entorno
│
├── middlewares/
│   ├── auth.js                  # Autenticación con Azure AD
│   ├── errorHandler.js          # Manejo centralizado de errores
│   └── logger.js                # Logging con Winston
│
├── services/
│   ├── graphService.js          # Cliente Microsoft Graph API
│   ├── onedriveService.js       # Operaciones con OneDrive
│   └── sqlService.js            # Conexión con Azure SQL
│
├── routes/
│   ├── auth.js                  # Rutas de autenticación
│   ├── casos.js                 # CRUD de casos
│   ├── upload.js                # Subida de archivos
│   ├── onedrive.js              # Gestión OneDrive
│   └── peritos.js               # Gestión de peritos
│
└── logs/
    ├── error.log                # Logs de errores
    └── combined.log             # Todos los logs
```

---

## 🔧 Instalación y Configuración

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

### 2. Configurar Variables de Entorno

Copia `.env.example` a `.env` y completa con tus credenciales:

```env
# Azure AD
AZURE_AD_TENANT_ID=tu-tenant-id
AZURE_AD_CLIENT_ID=tu-client-id
AZURE_AD_CLIENT_SECRET=tu-client-secret

# Azure SQL
DB_SERVER=tu-server.database.windows.net
DB_DATABASE=PeritoAppDB
DB_USER=sqladmin
DB_PASSWORD=tu-password
DB_ENCRYPT=true

# OneDrive
ONEDRIVE_FOLDER_ROOT=DatosPeritos

# Application Insights
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...

# Server
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

### 3. Crear Base de Datos

Ejecuta este script SQL en Azure SQL Database:

```sql
-- Tabla de Casos
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
    INDEX idx_codigo (codigo),
    INDEX idx_peritoId (peritoId),
    INDEX idx_estado (estado)
);

-- Tabla de Archivos
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
    FOREIGN KEY (casoId) REFERENCES Casos(id),
    INDEX idx_casoId (casoId),
    INDEX idx_tipoArchivo (tipoArchivo)
);

-- Tabla de Formularios
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
    FOREIGN KEY (casoId) REFERENCES Casos(id),
    INDEX idx_casoId (casoId),
    INDEX idx_peritoId (peritoId)
);
```

### 4. Iniciar Servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

---

## 📡 Endpoints de la API

### 🔐 Autenticación

#### POST `/api/auth/login`

Login con token de Azure AD.

**Request:**
```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "abc123...",
    "email": "juan.perez@empresa.com",
    "displayName": "Juan Pérez",
    "givenName": "Juan",
    "surname": "Pérez",
    "jobTitle": "Perito",
    "officeLocation": "Bogotá"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### GET `/api/auth/me`

Obtener información del usuario actual.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "abc123...",
    "displayName": "Juan Pérez",
    "userPrincipalName": "juan.perez@empresa.com",
    ...
  }
}
```

---

### 📋 Casos

#### GET `/api/casos`

Lista todos los casos (con filtros opcionales).

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `estado` (opcional): `pendiente`, `asignado`, `en_proceso`, `completado`
- `peritoId` (opcional): ID del perito
- `ciudad` (opcional): Ciudad

**Example:**
```
GET /api/casos?estado=pendiente&ciudad=Bogotá
```

**Response:**
```json
{
  "success": true,
  "casos": [
    {
      "id": 1,
      "codigo": "CASO-001",
      "direccion": "Calle 123 #45-67",
      "ciudad": "Bogotá",
      "barrio": "Chapinero",
      "tipoInmueble": "Apartamento",
      "estado": "pendiente",
      "prioridad": "alta",
      "peritoId": null,
      "peritoNombre": null,
      "fechaCreacion": "2025-11-01T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### POST `/api/casos`

Crear un nuevo caso.

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "codigo": "CASO-002",
  "direccion": "Carrera 7 #32-16",
  "ciudad": "Bogotá",
  "barrio": "Teusaquillo",
  "tipoInmueble": "Casa",
  "prioridad": "media",
  "coordinadorId": "coord-123"
}
```

**Response:**
```json
{
  "success": true,
  "caso": {
    "id": 2,
    "codigo": "CASO-002",
    "estado": "pendiente",
    ...
  }
}
```

#### GET `/api/casos/:id`

Obtener detalles de un caso específico.

**Response:**
```json
{
  "success": true,
  "caso": {
    "id": 1,
    "codigo": "CASO-001",
    ...
  },
  "archivos": {
    "fotos": 5,
    "formularios": 1
  }
}
```

#### PUT `/api/casos/:id`

Actualizar un caso.

**Request:**
```json
{
  "estado": "asignado",
  "peritoId": "perito-001",
  "peritoNombre": "Juan Pérez"
}
```

#### DELETE `/api/casos/:id`

Eliminar un caso.

---

### 📤 Upload (Subida de Archivos)

#### POST `/api/upload/foto`

Subir foto a OneDrive y registrar en base de datos.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "casoId": 1,
  "codigoCaso": "CASO-001",
  "tipoFoto": "fachada",
  "nombreArchivo": "fachada_001.jpg",
  "fotoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "coordenadas": {
    "latitud": 4.6097,
    "longitud": -74.0817
  }
}
```

**Response:**
```json
{
  "success": true,
  "archivo": {
    "id": 123,
    "nombreArchivo": "fachada_001.jpg",
    "onedriveUrl": "https://...",
    "onedriveUrlDescarga": "https://...",
    "tamañoBytes": 245678,
    "fechaSubida": "2025-11-01T10:30:00Z"
  },
  "message": "Foto subida exitosamente a OneDrive"
}
```

#### POST `/api/upload/formulario`

Subir formulario completo.

**Request:**
```json
{
  "casoId": 1,
  "codigoCaso": "CASO-001",
  "datos": {
    "informacionGeneral": {
      "propietario": "Juan García",
      "documento": "123456789",
      "telefono": "3001234567"
    },
    "caracteristicasFisicas": {
      "areaConstruida": 120,
      "areaTerreno": 150,
      "pisos": 2,
      "habitaciones": 3,
      "baños": 2
    },
    "serviciosPublicos": {
      "energia": true,
      "agua": true,
      "gas": true,
      "internet": true
    },
    "observaciones": "Inmueble en buen estado general"
  },
  "coordenadas": {
    "latitud": 4.6097,
    "longitud": -74.0817
  }
}
```

**Response:**
```json
{
  "success": true,
  "formulario": {
    "id": 45,
    "casoId": 1,
    "onedriveUrl": "https://...",
    "fechaCreacion": "2025-11-01T11:00:00Z"
  },
  "message": "Formulario guardado exitosamente"
}
```

---

### 📁 OneDrive

#### POST `/api/onedrive/crear-carpeta`

Crear estructura de carpetas para un caso.

**Request:**
```json
{
  "codigoCaso": "CASO-001"
}
```

**Response:**
```json
{
  "success": true,
  "estructura": {
    "raiz": {
      "id": "root-id",
      "name": "DatosPeritos"
    },
    "caso": {
      "id": "caso-folder-id",
      "name": "CASO-001"
    },
    "fotos": {
      "id": "fotos-folder-id",
      "name": "Fotos"
    },
    "formularios": {
      "id": "form-folder-id",
      "name": "Formularios"
    }
  },
  "paths": {
    "fotos": "DatosPeritos/CASO-001/Fotos",
    "formularios": "DatosPeritos/CASO-001/Formularios"
  }
}
```

#### GET `/api/onedrive/listar/:codigoCaso`

Listar todos los archivos de un caso.

**Response:**
```json
{
  "success": true,
  "codigoCaso": "CASO-001",
  "fotos": [
    {
      "id": "file-id-1",
      "nombre": "fachada_001.jpg",
      "tamaño": 245678,
      "fechaCreacion": "2025-11-01T10:30:00Z",
      "urlWeb": "https://...",
      "urlDescarga": "https://...",
      "mimeType": "image/jpeg"
    }
  ],
  "formularios": [
    {
      "id": "file-id-2",
      "nombre": "formulario_campo.json",
      "tamaño": 2456,
      "fechaCreacion": "2025-11-01T11:00:00Z",
      "urlWeb": "https://...",
      "urlDescarga": "https://..."
    }
  ],
  "total": 2
}
```

---

## 🔒 Seguridad

### Validación de Tokens

Todos los endpoints (excepto `/api/auth/login`) requieren token válido de Azure AD:

```javascript
// Middleware de autenticación automática
app.use('/api/casos', authenticateToken, casosRoutes);
```

### Roles y Permisos

Ejemplo de restricción por rol:

```javascript
router.delete('/casos/:id',
  authenticateToken,
  requireRole(['Administrador', 'Coordinador']),
  deleteCaso
);
```

### Rate Limiting

Límite de 100 requests por 15 minutos por IP:

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

---

## 📊 Monitoreo

### Application Insights

Todos los requests, errores y excepciones se envían automáticamente a Application Insights:

```javascript
// En server.js
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .start();
```

### Logs

Los logs se guardan en:
- `logs/error.log` - Solo errores
- `logs/combined.log` - Todos los logs

---

## 🚀 Deploy a Azure App Service

### 1. Crear App Service

```bash
az webapp create \
  --name perito-app-backend \
  --resource-group perito-app-rg \
  --plan perito-app-plan \
  --runtime "NODE|18-lts"
```

### 2. Configurar Variables de Entorno

```bash
az webapp config appsettings set \
  --name perito-app-backend \
  --resource-group perito-app-rg \
  --settings \
    AZURE_AD_TENANT_ID="..." \
    AZURE_AD_CLIENT_ID="..." \
    DB_SERVER="..." \
    DB_DATABASE="PeritoAppDB"
```

### 3. Deploy desde GitHub

Crear `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: |
        cd backend
        npm install

    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'perito-app-backend'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: ./backend
```

---

## 🧪 Testing

### Postman Collection

Importa esta colección en Postman:

```json
{
  "info": {
    "name": "PeritoApp API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth - Login",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"accessToken\": \"{{azureToken}}\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "login"]
        }
      }
    }
  ]
}
```

---

## 📞 Soporte

Para problemas o preguntas:
1. Revisar logs en Application Insights
2. Verificar variables de entorno
3. Comprobar permisos de Azure AD
4. Revisar firewall de Azure SQL

---

**¡Siguiente paso:** Integración con la app móvil React Native → Ver [MOBILE_INTEGRATION.md](./MOBILE_INTEGRATION.md)
