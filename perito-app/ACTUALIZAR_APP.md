# 🚀 Cómo Actualizar la App con las Nuevas Funcionalidades

## 📱 Dos Formas de Actualizar

### **🟢 OPCIÓN 1: Actualización OTA (Recomendado) - Sin reinstalar**
Para cambios de código JavaScript/React Native (como los que acabamos de hacer)

### **🔵 OPCIÓN 2: Nuevo Build APK - Reinstalar app**
Para cambios nativos o primera distribución

---

## 🟢 OPCIÓN 1: Actualización OTA (Over-The-Air) ⚡

### ✨ **Ventajas**
- ✅ **Instantáneo** - Los usuarios obtienen la actualización al abrir la app
- ✅ **No requiere reinstalar** la app
- ✅ **Más rápido** - Solo toma 2-3 minutos
- ✅ **Ideal para** cambios de código JS/React

### **Paso a Paso**

#### 1. Verificar que todo esté bien
```bash
cd "c:\Users\MichaelRamirez\OneDrive - INGENIERIA LEGAL SAS\Documentos\perito-app\perito-app"
node verify-setup.js
```

#### 2. Publicar actualización OTA
```bash
# Para el canal de desarrollo/testing
npx eas update --branch preview --message "Agregado sistema de fotos con GPS"

# O para producción
npx eas update --branch production --message "Agregado sistema de fotos con GPS"
```

#### 3. ¡Listo! 🎉
Los usuarios que tengan la app instalada recibirán la actualización automáticamente al abrir la app.

### **Verificar la actualización**
```bash
# Ver actualizaciones publicadas
npx eas update:list --branch preview
```

---

## 🔵 OPCIÓN 2: Nuevo Build APK (Para Firebase Distribution) 📦

### ✨ **Cuándo usar**
- 📦 Primera vez que distribuyes la app
- 🔧 Cambios en dependencias nativas
- 🆕 Nueva versión mayor
- 🎯 Quieres distribuir por Firebase App Distribution

### **Paso a Paso Completo**

#### 1. Actualizar versión en app.json
```bash
# Editar app.json y cambiar la versión
```

Abre `app.json` y actualiza:
```json
{
  "expo": {
    "version": "1.1.0",  // ← Cambiar de 1.0.0 a 1.1.0
    "android": {
      "versionCode": 2   // ← Incrementar de 1 a 2
    }
  }
}
```

#### 2. Instalar dependencias (si no lo has hecho)
```bash
npm install expo-image-manipulator
npm install
```

#### 3. Build APK para Firebase
```bash
# Opción A: Usando el perfil firebase-dist
npx eas build --platform android --profile firebase-dist

# Opción B: Usando el perfil preview
npx eas build --platform android --profile preview
```

Esto tomará **10-15 minutos** y al final te dará un link para descargar el APK.

#### 4. Descargar el APK
Una vez que el build termine, verás un mensaje como:
```
✔ Build finished
https://expo.dev/accounts/mkb_r/projects/perito-app/builds/xxxxx
```

Abre ese link y descarga el APK.

#### 5. Distribuir por Firebase App Distribution

##### Opción A: Manualmente desde la consola
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **App Distribution**
4. Toca **"Distribute app"**
5. Sube el APK descargado
6. Agrega testers (emails)
7. Agrega notas de la versión: "✨ Sistema de fotos con GPS agregado"
8. Toca **"Distribute"**

##### Opción B: Usando Firebase CLI
```bash
# Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# Login
firebase login

# Subir APK
firebase appdistribution:distribute path/to/app.apk \
  --app YOUR_FIREBASE_APP_ID \
  --release-notes "✨ Sistema de fotos con GPS
  📍 Captura automática de coordenadas
  📁 Organización por casos
  📤 Modo offline con sincronización"
```

#### 6. Los testers reciben notificación
Firebase enviará un email a todos los testers para descargar la nueva versión.

---

## 🎯 **RECOMENDACIÓN: Usa OPCIÓN 1 (OTA)** ✨

Para estas actualizaciones que acabamos de hacer, **usa la Opción 1 (OTA)** porque:

✅ Solo cambiamos código JavaScript
✅ No agregamos dependencias nativas nuevas
✅ Es mucho más rápido (2 min vs 15 min)
✅ Los usuarios no necesitan reinstalar

### **Comando Rápido**
```bash
npx eas update --branch preview --message "Sistema de fotos GPS agregado"
```

---

## 📋 Comparación de Opciones

| Característica | OTA Update | Nuevo Build APK |
|----------------|------------|-----------------|
| **Tiempo** | 2-3 minutos | 10-15 minutos |
| **Requiere reinstalar** | ❌ No | ✅ Sí |
| **Para cambios JS** | ✅ Sí | ✅ Sí |
| **Para cambios nativos** | ❌ No | ✅ Sí |
| **Distribución** | Automática | Manual (Firebase) |
| **Ideal para** | Desarrollo rápido | Releases oficiales |

---

## 🔍 Verificar Estado de Actualizaciones

### Ver actualizaciones OTA publicadas
```bash
npx eas update:list --branch preview
npx eas update:list --branch production
```

### Ver builds APK
```bash
npx eas build:list --platform android
```

---

## 📝 Notas de la Versión (para incluir)

```
✨ Sistema de Captura de Fotos con GPS v1.1.0

Nuevas funcionalidades:
📍 Captura automática de coordenadas GPS
📅 Fecha y hora precisas en cada foto
👤 Datos del perito incluidos
🏷️ Organización por casos y asignaciones
💾 Modo offline con guardado local
🔄 Sincronización automática con OneDrive
📊 Gestión de fotos pendientes

Mejoras:
- Nueva pantalla "Mis Fotos"
- Sistema de colas de sincronización
- Metadatos JSON completos por foto
- Organización automática de archivos

Correcciones:
- Mejoras de estabilidad
- Optimización de rendimiento
```

---

## 🚨 Solución de Problemas

### Error: "No updates published"
```bash
# Asegúrate de estar publicando a la rama correcta
npx eas update --branch preview --message "Test"
```

### Error: "Build failed"
```bash
# Limpiar caché y reintentar
npm run clean
npm install
npx eas build --platform android --profile preview --clear-cache
```

### Usuarios no reciben actualización OTA
1. Verifica que la app esté configurada con `expo-updates`
2. Los usuarios deben cerrar y abrir la app completamente
3. Verifica que estén en la rama correcta (preview/production)

---

## ✅ Checklist de Actualización

### **Para OTA Update (Opción 1)**
- [ ] Verificar que todo funcione: `node verify-setup.js`
- [ ] Publicar update: `npx eas update --branch preview --message "..."`
- [ ] Verificar publicación: `npx eas update:list --branch preview`
- [ ] Notificar a testers que cierren/abran la app
- [ ] Verificar que reciban la actualización

### **Para Build APK (Opción 2)**
- [ ] Actualizar versión en `app.json`
- [ ] Instalar dependencias: `npm install expo-image-manipulator`
- [ ] Build: `npx eas build --platform android --profile firebase-dist`
- [ ] Descargar APK del link
- [ ] Subir a Firebase App Distribution
- [ ] Agregar notas de versión
- [ ] Distribuir a testers
- [ ] Verificar que reciban notificación

---

## 🎉 Recomendación Final

### **Para actualizar AHORA mismo:**

```bash
# 1. Verificar
node verify-setup.js

# 2. Publicar actualización OTA
npx eas update --branch preview --message "Sistema de fotos GPS agregado"

# 3. ¡Listo! Los usuarios la recibirán al abrir la app
```

**Toma solo 2-3 minutos y los usuarios obtienen las nuevas funcionalidades instantáneamente.** 🚀

