# 📷 Sistema Fotográfico Perito App

## 🎯 Descripción General

El sistema fotográfico de **Perito App** permite capturar fotos con **marca de agua automática** que incluye coordenadas GPS, fecha, hora e información del perito. Las fotos se almacenan localmente y se sincronizan automáticamente con **Microsoft OneDrive** usando rutas específicas por cada perito.

## 🌟 Características Principales

### ✅ Marca de Agua Automática
- **📍 Coordenadas GPS**: Latitud y longitud con 6 decimales
- **📅 Fecha y Hora**: Formato local español
- **👤 Información del Perito**: Nombre y cédula
- **🏷️ ID de Asignación**: Identificador del trabajo

### ✅ Gestión de Ubicación GPS
- Permisos automáticos de ubicación
- Alta precisión GPS
- Indicador visual del estado GPS
- Fallback sin GPS disponible

### ✅ Almacenamiento Inteligente
- **Local**: Guardado inmediato en el dispositivo
- **Microsoft OneDrive**: Sincronización automática por carpetas de perito
- **Metadatos**: Archivo JSON con información completa
- **Respaldo**: Funciona sin conexión

## 🏗️ Arquitectura del Sistema

```
📱 Perito App
├── 📷 CameraScreen.js          # Pantalla principal de cámara
├── 🗄️ OneDriveService.js       # Servicio de sincronización
├── ⚙️ OneDriveConfigScreen.js   # Configuración de peritos
└── 🏠 HomeScreen.js            # Navegación integrada
```

## 🔧 Componentes Implementados

### 1. **CameraScreen.js**
**Ubicación**: `src/screens/CameraScreen.js`

**Funcionalidades**:
- Cámara en tiempo real con controles táctiles
- Overlay de marca de agua en vivo
- Captura con procesamiento automático
- Navegación integrada desde asignaciones

**Parámetros de entrada**:
```javascript
{
  asignacionId: 'PER001',  // ID del trabajo
  peritoId: '12345678'     // Cédula del perito
}
```

### 2. **OneDriveService.js**
**Ubicación**: `src/services/OneDriveService.js`

**Funcionalidades**:
- Gestión de carpetas por perito
- Subida automática a OneDrive
- Fallback a almacenamiento local
- Sincronización de archivos pendientes

**Configuración de carpetas**:
```javascript
peritoFolders = {
  '12345678': '/Perito_Juan_Perez',
  '87654321': '/Perito_Maria_Garcia',
  '11223344': '/Perito_Carlos_Rodriguez'
}
```

### 3. **OneDriveConfigScreen.js**
**Ubicación**: `src/screens/OneDriveConfigScreen.js`

**Funcionalidades**:
- Gestión de peritos y carpetas
- Configuración de OneDrive
- Estadísticas de almacenamiento
- Sincronización manual

## 📋 Flujo de Trabajo

### 1. **Acceso a la Cámara**
```
HomeScreen → Botón "Tomar Foto" → CameraScreen
     ↓
Asignación → Botón "Continuar" → CameraScreen
```

### 2. **Captura de Foto**
```
1. Usuario presiona botón captura
2. Sistema obtiene coordenadas GPS actuales  
3. Genera marca de agua con datos completos
4. Procesa y guarda foto con metadata
5. Intenta subir a OneDrive
6. Confirma éxito al usuario
```

### 3. **Estructura de Datos**

**Metadata de Foto**:
```json
{
  "fileName": "PERITO_PER001_2025-09-04T15-30-45.jpg",
  "timestamp": "2025-09-04T15:30:45.123Z",
  "location": {
    "coords": {
      "latitude": 4.609732,
      "longitude": -74.081749,
      "accuracy": 5.0
    }
  },
  "watermark": {
    "line1": "📍 4.609732, -74.081749",
    "line2": "📅 04/09/2025 - ⏰ 15:30:45",
    "line3": "👤 Juan Pérez - CC: 12345678", 
    "line4": "🏷️ PER001"
  },
  "perito": {
    "nombre": "Juan Pérez",
    "cedula": "12345678"
  },
  "asignacion": "PER001"
}
```

## 🗂️ Estructura de Carpetas

### **Almacenamiento Local**
```
📱 Dispositivo
└── DocumentDirectory/
    └── perito_photos/
        ├── PERITO_PER001_2025-09-04T15-30-45.jpg
        ├── PERITO_PER001_2025-09-04T15-30-45.jpg.json
        ├── PERITO_PER002_2025-09-04T16-15-20.jpg
        └── PERITO_PER002_2025-09-04T16-15-20.jpg.json
```

### **OneDrive por Perito**
```
☁️ OneDrive
├── /Perito_Juan_Perez/
│   ├── PERITO_PER001_2025-09-04T15-30-45.jpg
│   └── PERITO_PER001_2025-09-04T15-30-45.jpg.json
├── /Perito_Maria_Garcia/
│   ├── PERITO_PER002_2025-09-04T16-15-20.jpg
│   └── PERITO_PER002_2025-09-04T16-15-20.jpg.json
└── /General/
    └── (fotos sin asignación específica)
```

## ⚙️ Configuración y Uso

### **1. Configurar Perito**
```javascript
// Desde OneDriveConfigScreen o programáticamente
OneDriveService.setPeritoFolder('12345678', '/Perito_Juan_Perez');
```

### **2. Tomar Foto desde Asignación**
```javascript
// Desde HomeScreen
navigation.navigate('Camera', { 
  asignacionId: 'PER001',
  peritoId: '12345678' 
});
```

### **3. Tomar Foto General**
```javascript
// Desde acciones rápidas
navigation.navigate('Camera', { 
  asignacionId: null,
  peritoId: '12345678' 
});
```

### **4. Sincronización Manual**
```javascript
await OneDriveService.syncLocalPhotos();
```

## 🔐 Permisos Requeridos

### **Android (app.json)**
```json
{
  "permissions": [
    "android.permission.CAMERA",
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.WRITE_EXTERNAL_STORAGE"
  ]
}
```

### **Dependencias NPM**
```json
{
  "expo-camera": "~14.1.3",
  "expo-location": "~16.5.0", 
  "expo-file-system": "~16.0.0"
}
```

## 🚀 Funcionalidades Avanzadas

### **1. Marca de Agua Personalizable**
- Información del perito desde AuthService
- Formato de fecha/hora localizado
- Coordenadas con precisión configurable
- Diseño visual profesional

### **2. Gestión de Errores**
- Fallback sin GPS disponible
- Almacenamiento local cuando OneDrive falla
- Reintentos automáticos de sincronización
- Validación de permisos

### **3. Optimización de Rendimiento**
- Compresión de imágenes configurable
- Procesamiento asíncrono
- Cache de ubicación GPS
- Carga diferida de recursos

## 📊 Estadísticas y Monitoreo

### **Información Disponible**
- Número de fotos locales
- Tamaño total de almacenamiento
- Estado de conexión OneDrive
- Errores de sincronización

```javascript
const stats = await OneDriveService.getStorageStats();
console.log(stats);
// {
//   localPhotos: 25,
//   localSizeMB: "45.67",
//   oneDriveConnected: true
// }
```

## 🔄 Sincronización y Respaldo

### **Estrategia Híbrida**
1. **Inmediato**: Guardado local instantáneo
2. **Automático**: Subida a OneDrive en segundo plano  
3. **Manual**: Sincronización completa disponible
4. **Fallback**: Funcionamiento sin conexión garantizado

### **Resolución de Conflictos**
- Archivos locales tienen prioridad
- Timestamp en nombre de archivo evita duplicados
- Metadata completo para trazabilidad

## 🎨 Interfaz de Usuario

### **CameraScreen**
- **Header**: Navegación + información de asignación
- **Overlay**: Marca de agua en tiempo real
- **Controls**: Botones de captura, cambio de cámara
- **Status**: Indicador GPS y estado

### **OneDriveConfigScreen** 
- **Estado**: Conexión y estadísticas
- **Peritos**: Lista con activación individual
- **Configuración**: Agregar/eliminar peritos
- **Sincronización**: Control manual

## 🐛 Solución de Problemas

### **Sin Permisos de Cámara**
```
❌ Problema: "Sin acceso a la cámara"
✅ Solución: Ir a Configuración → Aplicaciones → Perito App → Permisos
```

### **Sin GPS**
```
❌ Problema: "GPS no disponible" 
✅ Solución: Verificar ubicación habilitada, funciona sin GPS
```

### **Falla OneDrive**
```
❌ Problema: Error subiendo archivos
✅ Solución: Fotos se guardan localmente, sincronizar después
```

## 📱 Instalación y Configuración

### **1. Instalar Dependencias**
```bash
npm install expo-camera expo-location expo-file-system
```

### **2. Configurar Permisos**
```bash
# Actualizar app.json con permisos requeridos
```

### **3. Configurar OneDrive**
```bash
# Obtener credenciales Microsoft Graph API
# Configurar en OneDriveService.js
```

### **4. Inicializar Peritos**
```bash
# Usar OneDriveConfigScreen o código directo
```

## 🎉 ¡Sistema Listo!

El sistema fotográfico está **completamente implementado** y listo para usar:

✅ **Cámara con marca de agua GPS**  
✅ **Almacenamiento local + OneDrive**  
✅ **Gestión de peritos por carpetas**  
✅ **Navegación integrada**  
✅ **Configuración completa**  

**Para usar**: Ir a HomeScreen → "Tomar Foto" o "Continuar" en asignación activa.

---

*Documentación generada para Perito App v1.0 - Sistema Fotográfico*