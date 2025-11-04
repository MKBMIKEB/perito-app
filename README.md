# 🏗️ **Perito App - Sistema Completo PMV**

Sistema integral de gestión de casos de avalúos inmobiliarios compuesto por una app móvil (Expo + SQLite) y una app web coordinadora (React/Node/Express), integradas con Microsoft 365 y OneDrive para sincronización automática de datos.

---

## 📋 **Tabla de Contenidos**

- [Descripción General](#descripción-general)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Componentes Principales](#componentes-principales)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso y Deployment](#uso-y-deployment)
- [Flujos Principales](#flujos-principales)
- [API Endpoints](#api-endpoints)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Solución de Problemas](#solución-de-problemas)

---

## 🎯 **Descripción General**

**Perito App** es un sistema diseñado para optimizar el proceso de avalúos inmobiliarios, permitiendo:

- ✅ **Gestión de casos** desde web (coordinadores)
- ✅ **Asignación de casos** a peritos
- ✅ **Captura de datos en campo** (app móvil)
- ✅ **Modo offline** con sincronización automática
- ✅ **Almacenamiento en OneDrive** con estructura automatizada
- ✅ **Base de datos compartida** (Azure SQL + SQLite local)
- ✅ **Autenticación Microsoft Azure AD**

---

## 🏛️ **Arquitectura del Sistema**

```
┌─────────────────────────────────────────────────────────────────┐
│                     MICROSOFT 365 CLOUD                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Azure AD    │  │  OneDrive    │  │  Azure SQL   │         │
│  │ (Auth)       │  │ (Storage)    │  │ (Database)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                             ▲
                             │ Microsoft Graph API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API REST                                                 │  │
│  │  • /api/auth      - Autenticación                       │  │
│  │  • /api/casos     - CRUD de casos                       │  │
│  │  • /api/sync      - Sincronización móvil ⭐             │  │
│  │  • /api/upload    - Subida de archivos                  │  │
│  │  • /api/onedrive  - Gestión OneDrive                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         ▲                                    ▲
         │                                    │
         │ HTTP/REST                          │ HTTP/REST
         ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────────┐
│   WEB COORDINADOR    │          │     APP MÓVIL (EXPO)     │
│   (React/HTML/JS)    │          │                          │
│                      │          │  ┌────────────────────┐  │
│  • Crear casos       │          │  │   SQLite Local     │  │
│  • Asignar peritos   │          │  │   (Modo Offline)   │  │
│  • Ver progreso      │          │  └────────────────────┘  │
│  • Gestionar datos   │          │                          │
└──────────────────────┘          │  • Captura de fotos     │
                                  │  • Formularios campo    │
                                  │  • Sincronización auto  │
                                  └──────────────────────────┘
```

---

## 🔧 **Componentes Principales**

### 1. **Backend (Node.js/Express)**
- **Ubicación:** `/backend`
- **Puerto:** `3000` (configurable)
- **Servicios:**
  - `graphService.js` - Integración Microsoft Graph API
  - `onedriveService.js` - Gestión automática de carpetas OneDrive
  - `sqlService.js` - Conexión Azure SQL Database
  - **⭐ NUEVO:** `sync.js` - Endpoint unificado de sincronización

### 2. **App Móvil (Expo + React Native)**
- **Ubicación:** `/perito-app`
- **Base de datos:** SQLite (offline-first)
- **Servicios:**
  - `SyncService.js` - Sincronización automática con detección de conectividad
  - `DatabaseService-native.js` - Gestión SQLite local
  - `OneDriveService.js` - Upload de fotos con cola offline

### 3. **App Web Coordinador**
- **Ubicación:** `/web-coordinador`
- **Tecnología:** HTML/CSS/JavaScript + Azure AD
- **Funcionalidad:** Gestión de casos y asignación de peritos

---

## 📦 **Requisitos Previos**

### Herramientas Necesarias
- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **EAS CLI** (para builds)
- **Expo Go** (para testing en desarrollo)

### Cuentas y Servicios
- **Microsoft 365** con OneDrive
- **Azure AD** (App Registration configurada)
- **Azure SQL Database** (opcional, puede usar SQL local)

### Sistema Operativo
- Windows 10/11 o macOS
- Android Studio (para emulador Android)

---

## 🚀 **Instalación**

### 1. Clonar el Repositorio
```bash
git clone <repo-url>
cd perito-app
```

### 2. Instalar Dependencias del Backend
```bash
cd backend
npm install
```

### 3. Instalar Dependencias de la App Móvil
```bash
cd ../perito-app
npm install
```

### 4. Instalar EAS CLI (si no está instalado)
```bash
npm install -g eas-cli
```

---

## ⚙️ **Configuración**

### 1. Configurar Backend

Crea el archivo `.env` en `/backend`:

```env
# Azure SQL Database
DB_SERVER=tu-servidor.database.windows.net
DB_DATABASE=peritoapp_db
DB_USER=admin
DB_PASSWORD=TuPasswordSegura
DB_ENCRYPT=true

# Microsoft Azure AD
AZURE_CLIENT_ID=tu-client-id
AZURE_TENANT_ID=tu-tenant-id
AZURE_CLIENT_SECRET=tu-secret

# Application Insights (opcional)
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...

# API Configuration
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3000,https://tu-dominio.com

# OneDrive Configuration
ONEDRIVE_FOLDER_ROOT=DatosPeritos

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Configurar App Móvil

Edita `perito-app/src/config/peritoConfig.js`:

```javascript
export const PERITO_CONFIG = {
  API_BASE_URL: 'https://tu-backend.azurewebsites.net/api',  // URL del backend

  MICROSOFT_CONFIG: {
    CLIENT_ID: 'tu-client-id',
    TENANT_ID: 'tu-tenant-id',
    AUTHORITY: 'https://login.microsoftonline.com/tu-tenant-id',
    REDIRECT_URI: 'msauth.com.ingenierialegal.saviaapp://auth',
    SCOPES: [
      'https://graph.microsoft.com/Files.ReadWrite.All',
      'https://graph.microsoft.com/User.Read'
    ],
    GRAPH_BASE_URL: 'https://graph.microsoft.com/v1.0'
  }
};
```

### 3. Configurar Azure AD

1. Ve a [Azure Portal](https://portal.azure.com)
2. Registra una nueva aplicación en **Azure Active Directory**
3. Agrega permisos de Microsoft Graph:
   - `Files.ReadWrite.All`
   - `User.Read`
4. Configura URI de redirección:
   - `msauth.com.ingenierialegal.saviaapp://auth`
5. Genera un **Client Secret** y guárdalo

---

## 🎬 **Uso y Deployment**

### Opción 1: Verificación Rápida del Sistema

```bash
# Windows
.\scripts\verify-system.bat

# Linux/Mac
bash scripts/verify-system.sh
```

Este script verifica:
- ✅ Herramientas instaladas
- ✅ Estructura de directorios
- ✅ Archivos de configuración
- ✅ Servicios principales
- ✅ Dependencias

### Opción 2: Build Completo del APK

```bash
# Windows
.\scripts\build-apk.bat

# Linux/Mac
bash scripts/build-apk.sh
```

El script realiza:
1. Instalación de dependencias
2. Verificación de EAS CLI
3. Build del APK con perfil seleccionado
4. Generación de enlace de descarga

### Opción 3: Desarrollo Local

#### Iniciar Backend
```bash
cd backend
npm start
```

#### Iniciar App Móvil
```bash
cd perito-app
npm start
```

Escanea el QR con **Expo Go** en tu dispositivo Android.

---

## 🔄 **Flujos Principales**

### Flujo 1: Crear Caso y Asignar Perito

```
1. Coordinador → Web App
   ├─ Crear nuevo caso (código, dirección, tipo)
   ├─ POST /api/casos
   └─ OneDrive crea carpeta automáticamente:
      /DatosPeritos/CASO_XXX/Fotos
      /DatosPeritos/CASO_XXX/Formularios

2. Coordinador asigna perito
   ├─ PUT /api/casos/:id (peritoId, peritoNombre)
   └─ Estado del caso → "asignado"

3. Perito recibe notificación en app móvil
   ├─ SyncService descarga asignaciones
   └─ POST /api/sync/asignaciones
```

### Flujo 2: Captura de Datos en Campo (Offline)

```
1. Perito abre caso asignado
   └─ Datos cargados desde SQLite local

2. Captura fotos con cámara
   ├─ Fotos guardadas localmente con watermark
   ├─ Metadata (GPS, timestamp) registrada
   └─ Agregadas a cola de sincronización

3. Completa formulario de campo
   ├─ Datos guardados en SQLite (estado: borrador)
   └─ Agregado a cola de sincronización

4. SyncService detecta conectividad
   ├─ Listener de NetInfo activo
   └─ Al recuperar conexión → syncAll()
```

### Flujo 3: Sincronización Automática

```
SyncService.syncAll()
   │
   ├─ 1. Descargar asignaciones actualizadas
   │     └─ POST /api/sync/asignaciones
   │
   └─ 2. Subir datos pendientes
         ├─ Leer formularios de SQLite (sincronizado=0)
         ├─ Leer evidencias de sync_queue
         ├─ Convertir fotos a base64
         ├─ POST /api/sync/datos
         │     └─ Backend procesa:
         │           ├─ Guardar formularios en Azure SQL
         │           ├─ Subir fotos a OneDrive
         │           └─ Registrar archivos en BD
         └─ Marcar como sincronizados en SQLite
```

---

## 📡 **API Endpoints**

### Autenticación

#### `POST /api/auth/login`
Autenticación con token de Azure AD.

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
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "Usuario Demo"
  },
  "token": "access-token"
}
```

### Casos

#### `GET /api/casos`
Listar todos los casos (con filtros opcionales).

**Query Params:**
- `estado` - pendiente, asignado, en_proceso, completado
- `peritoId` - ID del perito
- `ciudad` - Ciudad del caso

#### `POST /api/casos`
Crear nuevo caso (**automáticamente crea carpetas en OneDrive**).

**Request:**
```json
{
  "codigo": "CASO_2025_001",
  "direccion": "Calle 123 #45-67",
  "ciudad": "Bogotá",
  "tipoInmueble": "Apartamento",
  "prioridad": "alta"
}
```

### **⭐ Sincronización (NUEVO)**

#### `POST /api/sync/datos`
Sincronización unificada de datos desde app móvil.

**Request:**
```json
{
  "peritoId": "demo-perito-123",
  "formularios": [
    {
      "id": "FORM_123",
      "asignacionId": "1",
      "direccion": "Calle 123",
      "areaTerreno": 120.5,
      "coordenadas": {
        "latitude": 4.6097,
        "longitude": -74.0817
      }
    }
  ],
  "evidencias": [
    {
      "id": "EVD_456",
      "asignacionId": "1",
      "fileName": "foto_fachada.jpg",
      "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      "coordenadas": {
        "latitude": 4.6097,
        "longitude": -74.0817
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "formularios": {
    "sincronizados": 1,
    "fallidos": 0,
    "errores": []
  },
  "evidencias": {
    "sincronizados": 1,
    "fallidos": 0,
    "errores": []
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### `POST /api/sync/asignaciones`
Descargar asignaciones actualizadas para un perito.

**Request:**
```json
{
  "peritoId": "demo-perito-123",
  "ultimaActualizacion": "2025-01-14T00:00:00.000Z"
}
```

---

## 📁 **Estructura del Proyecto**

```
perito-app/
│
├── backend/                          # Backend Node.js/Express
│   ├── routes/
│   │   ├── auth.js                  # Autenticación Azure AD
│   │   ├── casos.js                 # CRUD de casos
│   │   ├── sync.js                  # ⭐ Sincronización unificada
│   │   ├── upload.js                # Subida de archivos
│   │   └── onedrive.js              # Gestión OneDrive
│   ├── services/
│   │   ├── graphService.js          # Microsoft Graph API
│   │   ├── onedriveService.js       # OneDrive automático
│   │   └── sqlService.js            # Azure SQL Database
│   ├── middlewares/
│   │   ├── auth.js                  # Middleware autenticación
│   │   ├── errorHandler.js          # Manejo de errores
│   │   └── logger.js                # Logging de peticiones
│   ├── server.js                    # Entrada principal
│   ├── package.json
│   └── .env.example
│
├── perito-app/                       # App Móvil (Expo)
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.js
│   │   │   ├── AsignacionesScreen.js
│   │   │   ├── CameraScreen.js
│   │   │   └── FormularioCampoScreen.js
│   │   ├── services/
│   │   │   ├── SyncService.js       # ⭐ Sincronización automática
│   │   │   ├── DatabaseService-native.js  # SQLite offline
│   │   │   ├── OneDriveService.js   # Upload fotos
│   │   │   └── AzureAuthService.js  # Autenticación
│   │   ├── config/
│   │   │   └── peritoConfig.js      # Configuración app
│   │   └── constants/
│   │       └── index.js
│   ├── android/                     # Configuración Android
│   │   └── app/src/main/AndroidManifest.xml
│   ├── App.js                       # ⭐ Inicialización SyncService
│   ├── eas.json                     # Configuración EAS Build
│   ├── app.json
│   └── package.json
│
├── web-coordinador/                  # App Web
│   ├── index-azure.html             # Interfaz principal
│   ├── login-azure.html             # Login Azure AD
│   ├── js/
│   │   └── app-azure.js             # Lógica app
│   └── styles/
│       └── main.css
│
├── scripts/                          # Scripts de deployment
│   ├── build-apk.bat                # Build Windows
│   ├── build-apk.sh                 # Build Linux/Mac
│   └── verify-system.bat            # Verificación sistema
│
└── README.md                         # Este archivo
```

---

## 🐛 **Solución de Problemas**

### Problema: Error de autenticación con Azure AD

**Solución:**
1. Verifica que `CLIENT_ID` y `TENANT_ID` sean correctos
2. Asegúrate de que los permisos de Microsoft Graph estén habilitados
3. Revisa que el URI de redirección esté configurado en Azure AD

### Problema: Fotos no se sincronizan

**Solución:**
1. Verifica conectividad: `SyncService.isOnline`
2. Revisa cola de sincronización: `DatabaseService.getSyncQueue()`
3. Verifica token de OneDrive válido
4. Revisa logs en consola de la app

### Problema: Build de APK falla con EAS

**Solución:**
```bash
# Limpiar caché y reinstalar
cd perito-app
rm -rf node_modules
npm install
eas build:configure
eas build --platform android --profile preview
```

### Problema: Backend no conecta a Azure SQL

**Solución:**
1. Verifica firewall de Azure SQL (permite tu IP)
2. Revisa credenciales en `.env`
3. Prueba conexión manual:
```bash
cd backend
node -e "require('./services/sqlService').connect()"
```

---

## 📞 **Soporte y Contacto**

Para problemas o preguntas:
- 📧 Email: soporte@ingenierialegal.com
- 📱 WhatsApp: +57 XXX XXX XXXX
- 🌐 Portal: https://peritoapp.com

---

## 📄 **Licencia**

© 2025 Ingeniería Legal SAS. Todos los derechos reservados.

---

## 🚀 **Próximas Mejoras**

- [ ] Notificaciones push
- [ ] Reportes PDF automáticos
- [ ] Dashboard analytics
- [ ] Integración con catastro
- [ ] Modo oscuro
- [ ] Soporte iOS

---

**✅ Sistema listo para producción - PMV completado**
