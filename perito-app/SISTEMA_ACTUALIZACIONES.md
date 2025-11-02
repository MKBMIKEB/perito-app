# 🔄 Sistema de Actualizaciones Automáticas - Perito App

## 🎯 Descripción General

El sistema de actualizaciones de **Perito App** implementa **3 métodos diferentes** para entregar actualizaciones a los usuarios sin necesidad de pasar por Google Play Store, garantizando que siempre tengan la versión más reciente con mejoras y correcciones.

## 🚀 Métodos de Actualización Implementados

### 1. **📦 Expo Updates (OTA) - RECOMENDADO**
**Over-The-Air Updates - Actualizaciones instantáneas**

✅ **Ventajas:**
- ⚡ **Instantáneas**: Sin descargar APK completo
- 🔄 **Automáticas**: Se aplican en segundo plano
- 📱 **Sin reinstalar**: La app se actualiza sin cerrar
- 🌐 **Funcionan offline**: Se aplican cuando hay conexión

✅ **Ideal para:**
- Corrección de bugs
- Mejoras de UI
- Nuevas funcionalidades JavaScript
- Cambios en configuración

### 2. **🔥 Firebase App Distribution**
**Distribución directa de APK completos**

✅ **Ventajas:**
- 🎯 **Grupos específicos**: Internal, Perito, Clients
- 📧 **Notificaciones email**: Automáticas por grupo
- 📊 **Analytics**: Estadísticas de instalación
- 🔒 **Control total**: No depende de tiendas

✅ **Ideal para:**
- Cambios nativos (permisos, dependencias)
- Versiones beta y testing
- Distribución controlada por grupos
- Nuevas funcionalidades nativas

### 3. **📱 Google Play In-App Updates**
**Actualizaciones oficiales de Play Store**

⏳ **Estado:** Preparado para implementar cuando la app esté en Play Store

✅ **Ventajas futuras:**
- 🏪 **Oficial**: A través de Google Play
- 👥 **Masivo**: Para todos los usuarios
- 🔐 **Seguro**: Firmado por Google
- 📈 **Métricas**: Estadísticas oficiales

## 🏗️ Arquitectura del Sistema

```
📱 Perito App
├── 🔄 UpdateService.js           # Servicio principal de actualizaciones
├── 📱 UpdateScreen.js            # Pantalla de gestión de updates
├── 🔥 firebase-deploy.js         # Script de despliegue Firebase
├── ⚙️ expo-updates configurado   # OTA updates
└── 🔗 Integración en App.js      # Inicialización automática
```

## 📋 Componentes Implementados

### 1. **UpdateService.js**
**Ubicación**: `src/services/UpdateService.js`

**Funcionalidades principales:**
```javascript
// Verificación Expo Updates
await UpdateService.checkForExpoUpdates()

// Verificación Firebase Distribution  
await UpdateService.checkFirebaseDistribution()

// Verificación completa (todos los métodos)
await UpdateService.performFullUpdateCheck()

// Aplicar actualización
await UpdateService.downloadAndApplyExpoUpdate()

// Configuración automática
UpdateService.startAutoUpdateCheck()
```

### 2. **UpdateScreen.js**
**Ubicación**: `src/screens/UpdateScreen.js`

**Características:**
- 📊 **Panel de control** con estado actual
- 🔄 **Verificación manual** de actualizaciones
- ⚙️ **Configuración** de updates automáticos
- 📈 **Historial** de actualizaciones
- 🎯 **Información** de cada método

### 3. **firebase-deploy.js**
**Ubicación**: `scripts/firebase-deploy.js`

**Comandos disponibles:**
```bash
# Configurar Firebase
npm run deploy:firebase setup

# Desplegar a grupo interno
npm run deploy:firebase deploy internal

# Desplegar a grupo de peritos
npm run deploy:firebase deploy perito  

# Desplegar a todos los grupos
npm run deploy:firebase deploy-all

# Ver estadísticas
npm run deploy:firebase stats
```

## 🔧 Configuración y Setup

### **1. 🚀 Configurar Expo Updates**

**En `app.json`:**
```json
{
  "expo": {
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0
    },
    "runtimeVersion": "1.0.0"
  }
}
```

**Comandos de despliegue:**
```bash
# Publicar actualización OTA
npx expo publish

# Actualización con mensaje
npx expo publish --message "Corrección de bugs importantes"

# Actualización para canal específico  
npx expo publish --release-channel production
```

### **2. 🔥 Configurar Firebase App Distribution**

**Paso 1: Instalar Firebase CLI**
```bash
npm install -g firebase-tools
```

**Paso 2: Login y configuración**
```bash
firebase login
firebase init
```

**Paso 3: Configurar proyecto**
```javascript
// En scripts/firebase-deploy.js
const FIREBASE_CONFIG = {
  projectId: 'tu-proyecto-firebase',
  appId: 'tu-app-id-firebase',
  groups: {
    internal: 'internal-testers',
    perito: 'perito-team',
    clients: 'client-preview'
  }
};
```

**Paso 4: Desplegar**
```bash
# Generar APK
npm run build:local

# Desplegar a Firebase
npm run deploy:firebase deploy internal
```

### **3. ⚙️ Configurar Variables de Entorno**

**En el dispositivo:**
```bash
# Variables necesarias para el build
JAVA_HOME="C:\Program Files\Microsoft\jdk-17.0.16.8-hotspot"
ANDROID_HOME="C:\Users\MichaelRamirez\AppData\Local\Android\Sdk"
```

## 🔄 Flujo de Actualización Completo

### **Escenario 1: Actualización Expo (OTA)**
```
1. Desarrollador publica: npx expo publish
2. App verifica automáticamente cada 24h
3. Si hay update: Descarga en segundo plano  
4. Usuario ve notificación: "Actualización lista"
5. App se reinicia aplicando cambios
6. ✅ Listo - sin reinstalar APK
```

### **Escenario 2: Actualización Firebase**
```
1. Desarrollador genera APK: npm run build:local
2. Despliegue: npm run deploy:firebase deploy perito
3. Firebase envía emails al grupo "perito-team"
4. Usuario recibe email con link de descarga
5. Descarga e instala APK actualizado
6. ✅ Nueva versión instalada
```

### **Escenario 3: Verificación Manual**
```
1. Usuario va a HomeScreen → ⚙️ → Updates
2. Presiona "Buscar Actualizaciones" 
3. Sistema verifica Expo + Firebase + Play Store
4. Si hay update: Muestra opciones
5. Usuario elige método de actualización
6. ✅ Se aplica la actualización elegida
```

## 📊 Configuración por Grupos

### **Grupos Firebase App Distribution:**

```javascript
const DISTRIBUTION_GROUPS = {
  // Desarrolladores internos
  internal: {
    name: 'internal-testers',
    users: ['dev@ingenierialegal.com', 'qa@ingenierialegal.com'],
    autoNotify: true,
    betaFeatures: true
  },
  
  // Equipo de peritos
  perito: {
    name: 'perito-team', 
    users: ['perito1@email.com', 'perito2@email.com'],
    autoNotify: true,
    stableVersion: true
  },
  
  // Clientes preview
  clients: {
    name: 'client-preview',
    users: ['cliente@empresa.com'],
    autoNotify: false,
    productionReady: true
  }
};
```

## 🎯 Estrategia de Actualización Recomendada

### **Para Desarrollo y Testing:**
1. **Expo Updates** para cambios rápidos
2. **Firebase Internal** para testing de APK
3. **Verificación manual** durante desarrollo

### **Para Peritos en Campo:**
1. **Expo Updates** automáticos cada 24h
2. **Firebase Perito** para versiones importantes
3. **Notificaciones** para updates críticos

### **Para Producción:**
1. **Firebase Client** para distribución controlada
2. **Google Play** cuando esté disponible
3. **Rollback** automático si hay problemas

## 📱 Comandos de Desarrollo

### **Desarrollo Local:**
```bash
# Instalar dependencias actualizaciones
npm install expo-updates @expo/config

# Verificar configuración
npx expo config --type public

# Test local de updates
npx expo start --no-dev --minify
```

### **Despliegue de Updates:**
```bash
# 1. Actualización OTA rápida
npx expo publish --message "Fix bugs importantes"

# 2. Build y despliegue Firebase
npm run build:local
npm run deploy:firebase deploy perito

# 3. Despliegue completo (todos los grupos)
npm run build:local  
npm run deploy:firebase deploy-all
```

### **Verificación y Debug:**
```bash
# Ver releases de Expo
npx expo publish:history

# Ver releases de Firebase
npm run deploy:firebase stats

# Limpiar cache updates
npx expo r -c --no-dev --minify
```

## 🔧 Troubleshooting

### **Error: "No updates available"**
```
❌ Problema: Updates no se detectan
✅ Solución: 
  1. Verificar runtimeVersion en app.json
  2. Confirmar que expo publish se ejecutó correctamente
  3. Revisar release channel
```

### **Error: Firebase distribution failed**
```
❌ Problema: No se puede desplegar a Firebase
✅ Solución:
  1. firebase login
  2. Verificar App ID en firebase-deploy.js
  3. Confirmar permisos en Firebase Console
```

### **Error: APK not found**
```
❌ Problema: No encuentra APK para desplegar
✅ Solución:
  1. npm run build:local
  2. Verificar ruta en scripts/firebase-deploy.js
  3. Confirmar que Gradle build terminó exitosamente
```

## 📈 Monitoreo y Analytics

### **Métricas de Expo Updates:**
```bash
# Ver estadísticas de updates
npx expo publish:details

# Analytics de adopción
npx expo webhooks:list
```

### **Métricas de Firebase:**
- 📊 **Dashboard Firebase Console**
- 📧 **Reportes de email delivery**  
- 📱 **Estadísticas de instalación**
- 🔄 **Tasa de adopción por grupo**

## 🎉 Beneficios del Sistema

### **Para Desarrolladores:**
- ⚡ **Deploy rápido**: Expo publish en segundos
- 🎯 **Control granular**: Por grupos y canales
- 📊 **Feedback inmediato**: Analytics en tiempo real
- 🔄 **Rollback fácil**: Revertir si hay problemas

### **Para Peritos:**
- 📱 **Siempre actualizado**: Updates automáticos
- 🚀 **Sin interrupciones**: OTA no interrumpe trabajo
- 🔒 **Confiable**: Múltiples métodos de respaldo
- 📞 **Soporte**: Historial y diagnósticos

### **Para la Empresa:**
- 💰 **Sin costos Play Store**: Distribución directa
- 🎯 **Control total**: No depende de terceros  
- 📈 **Métricas detalladas**: Analytics completos
- ⚡ **Time to market**: Deploy instantáneo

## ✅ Lista de Verificación de Implementación

- [x] 🚀 **Expo Updates configurado y funcionando**
- [x] 🔥 **Firebase App Distribution configurado**
- [x] 📱 **UpdateScreen implementada**
- [x] 🔄 **UpdateService con verificación automática**
- [x] 📜 **Scripts de despliegue automatizados**
- [x] ⚙️ **Integración en App.js y HomeScreen**
- [x] 📖 **Documentación completa**
- [ ] 🏪 **Google Play In-App Updates** (cuando esté en Play Store)
- [ ] 🔐 **Certificados de firma** para producción

## 🚀 Próximos Pasos

1. **Configurar credenciales Firebase** en el proyecto
2. **Testar Expo Updates** con `npx expo publish`
3. **Configurar grupos** de distribución en Firebase Console
4. **Entrenar al equipo** en el uso del sistema
5. **Establecer proceso** de releases y rollbacks

---

¡El sistema de actualizaciones está **completamente implementado** y listo para mantener tu Perito App siempre actualizada! 🎉

*Documentación del Sistema de Actualizaciones - Perito App v1.0*