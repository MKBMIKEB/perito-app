# 🚀 GUÍA DE DESPLIEGUE CON MICROSOFT APP CENTER

## ✅ VENTAJAS DE APP CENTER:

1. ✅ **Herramienta oficial de Microsoft**
2. ✅ Compilación en la nube (no necesitas Android Studio)
3. ✅ Distribución automática a testers
4. ✅ Analytics integrado
5. ✅ Integración con Azure AD
6. ✅ Crashlytics y diagnósticos

---

## 📝 PASOS PARA CONFIGURAR:

### **1. Crear cuenta en App Center**

Ve a: https://appcenter.ms

- Inicia sesión con tu cuenta Microsoft
- Es **GRATIS** para proyectos pequeños

### **2. Crear nueva app**

1. Click en **"Add new" → "Add new app"**
2. Nombre: `Perito App`
3. OS: **Android**
4. Platform: **React Native**
5. Click **"Add new app"**

### **3. Obtener tu API Token**

1. Ve a **Account Settings** (tu perfil, esquina superior derecha)
2. Click en **API Tokens**
3. Click **"New API Token"**
4. Nombre: `CLI Token`
5. Permisos: **Full Access**
6. Copia el token (lo usarás en el siguiente paso)

---

## 🔧 COMANDOS PARA EJECUTAR:

Abre tu terminal y ejecuta:

```bash
# 1. Autenticarte con App Center
appcenter login

# Te pedirá el token que copiaste arriba
# Pégalo y presiona Enter

# 2. Ir a tu proyecto
cd "C:\Users\MichaelRamirez\OneDrive - INGENIERIA LEGAL SAS\Documentos\perito-app\perito-app"

# 3. Configurar App Center para el proyecto
appcenter apps set-current <TU_ORGANIZACION>/Perito-App

# Ejemplo si tu usuario es mkb_r:
# appcenter apps set-current mkb_r/Perito-App
```

---

## 📦 COMPILAR Y DISTRIBUIR:

### **Opción A: Configurar build automático (RECOMENDADO)**

1. En App Center web, ve a tu app
2. Click en **"Build"**
3. Conecta tu repositorio (GitHub/Azure DevOps)
4. Selecciona la rama (ej: `main`)
5. Configura:
   - Build Variant: `release`
   - Node version: `18.x`
   - Build scripts:
     ```bash
     cd android && ./gradlew assembleRelease
     ```
6. **Guarda y ejecuta build**

### **Opción B: Build manual desde terminal**

```bash
cd "C:\Users\MichaelRamirez\OneDrive - INGENIERIA LEGAL SAS\Documentos\perito-app\perito-app"

# Compilar APK
cd android
gradlew assembleRelease

# El APK estará en:
# android/app/build/outputs/apk/release/app-release.apk

# Subir a App Center
appcenter distribute release \
  --app mkb_r/Perito-App \
  --file android/app/build/outputs/apk/release/app-release.apk \
  --group Collaborators \
  --release-notes "Build con Microsoft MSAL"
```

---

## 📱 DISTRIBUIR A TU MÓVIL:

### **Método 1: Link directo**

1. En App Center, ve a **"Distribute" → "Releases"**
2. Click en la última versión
3. Copia el **Install link**
4. Ábrelo en tu móvil Android
5. ¡Instala!

### **Método 2: App Center app**

1. Descarga **"App Center"** de Play Store
2. Inicia sesión con tu cuenta Microsoft
3. Verás "Perito App" disponible
4. Click **Install**

---

## 🔐 CONFIGURAR MICROSOFT AUTHENTICATION:

En App Center puedes configurar:

1. **Analytics** para ver uso de la app
2. **Diagnostics** para crashlogs
3. **Push Notifications** integrado con Azure
4. **CodePush** para updates over-the-air

### Agregar App Center SDK (opcional):

```bash
npm install appcenter appcenter-analytics appcenter-crashes --save
```

En `App.js`:
```javascript
import AppCenter from 'appcenter';
import Analytics from 'appcenter-analytics';
import Crashes from 'appcenter-crashes';

AppCenter.start({
  appSecret: "TU_APP_SECRET_AQUI",
  appName: "Perito-App",
});
```

---

## 🎯 VENTAJAS ESPECÍFICAS PARA TU CASO:

### ✅ **Integración con Azure AD**
- App Center está en el mismo ecosistema Azure
- Fácil integración con tu backend Azure
- Misma cuenta Microsoft para todo

### ✅ **Distribución Enterprise**
- Puedes distribuir a grupos de usuarios
- No necesitas Google Play Store
- Perfecto para apps internas

### ✅ **CI/CD Automático**
- Cada push a GitHub = build automático
- Tests automáticos
- Distribución automática a testers

---

## 📊 MONITOREO Y ANALYTICS:

Una vez instalada la app, App Center te muestra:

- 📱 Cantidad de instalaciones
- 👥 Usuarios activos
- 💥 Crashes y errores
- 📈 Uso por pantalla
- 🌍 Ubicaciones de usuarios

---

## 🚀 SIGUIENTE PASO INMEDIATO:

**EJECUTA ESTO AHORA:**

```bash
# 1. Login en App Center
appcenter login

# 2. Crear la app
appcenter apps create -d "Perito App" -o Android -p "React-Native"

# 3. Ver tus apps
appcenter apps list
```

---

## 🆘 SI TIENES PROBLEMAS:

### Error: "gradlew not found"
```bash
cd android
chmod +x gradlew  # En Linux/Mac
# En Windows debería funcionar directamente
```

### Error: "Android SDK not found"
- Necesitas instalar Android Studio
- O configurar build en App Center web (sin SDK local)

---

## 📞 RECURSOS:

- **Docs App Center:** https://docs.microsoft.com/en-us/appcenter/
- **React Native Guide:** https://docs.microsoft.com/en-us/appcenter/sdk/getting-started/react-native
- **Distribution:** https://docs.microsoft.com/en-us/appcenter/distribution/

---

**VENTAJA CLAVE:** Con App Center, Microsoft maneja toda la infraestructura de compilación. Tú solo subes el código y ellos compilan el APK. ¡Perfecto para tu caso! 🎉
