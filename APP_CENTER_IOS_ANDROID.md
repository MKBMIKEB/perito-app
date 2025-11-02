# 📱 APP CENTER - COMPILACIÓN iOS Y ANDROID

## ✅ VENTAJAS DE APP CENTER:

### **Para ANDROID:**
- ✅ Genera APK directamente
- ✅ No necesitas Google Play Store
- ✅ Distribución inmediata a testers

### **Para iOS:**
- ✅ Genera IPA (archivo de instalación iOS)
- ✅ NO necesitas Mac para compilar
- ✅ Distribución vía TestFlight o instalación directa
- ✅ Maneja certificados y provisioning profiles

---

## 🚀 CONFIGURACIÓN PASO A PASO

### **1. Crear Apps en App Center**

Ve a: https://appcenter.ms

#### **App Android:**
1. Click **"Add new" → "Add new app"**
2. Nombre: `Perito-App-Android`
3. OS: **Android**
4. Platform: **React Native**

#### **App iOS:**
1. Click **"Add new" → "Add new app"**
2. Nombre: `Perito-App-iOS`
3. OS: **iOS**
4. Platform: **React Native**

---

### **2. Configurar Build - ANDROID**

1. En tu app Android, ve a **"Build"**
2. Click **"Configure build"**
3. **Source:** Sube tu código o conecta GitHub
4. **Branch:** `main`
5. **Build configuration:**
   ```
   Node.js version: 18.x
   Build variant: release
   Build scripts:
     cd android && ./gradlew assembleRelease
   ```
6. **Sign builds:** Sube tu keystore (o genera uno nuevo)
7. **Save & Build**

---

### **3. Configurar Build - iOS**

1. En tu app iOS, ve a **"Build"**
2. Click **"Configure build"**
3. **Source:** Sube tu código o conecta GitHub
4. **Branch:** `main`
5. **Xcode version:** Latest stable
6. **Build configuration:**
   ```
   Scheme: peritoapp (o tu esquema)
   Configuration: Release
   Node.js version: 18.x
   ```
7. **Signing:**
   - **Opción A:** Usa certificados automáticos de App Center
   - **Opción B:** Sube tu Apple Developer certificate + provisioning profile
8. **Save & Build**

---

## 🎯 REQUISITOS ESPECÍFICOS

### **Para iOS necesitas:**

1. **Cuenta Apple Developer** ($99/año)
   - Registrate en: https://developer.apple.com

2. **Certificados iOS:**
   - App Center puede **generarlos automáticamente** por ti
   - O subes tus propios certificados

3. **Bundle ID único:**
   - Ejemplo: `com.ingenierialegal.peritoapp`
   - Ya lo tienes configurado en `app.json`

### **Para Android necesitas:**

1. **Keystore (signing key):**
   - App Center puede generarlo
   - O usa el que ya tienes

---

## 📦 DISTRIBUCIÓN

### **Android (APK):**

Una vez compilado:
1. Ve a **"Distribute" → "Releases"**
2. Click en la versión
3. Copia el **Install link**
4. Ábrelo en tu móvil Android
5. Instala directamente

### **iOS (IPA):**

Tienes 3 opciones:

#### **Opción A: TestFlight (RECOMENDADO)**
1. En App Center, configura conexión con App Store Connect
2. La app se sube automáticamente a TestFlight
3. Invita testers por email
4. Instalan desde TestFlight app

#### **Opción B: Ad-Hoc Distribution**
1. Registra los UDIDs de los iPhones de tus testers
2. App Center genera IPA con esos UDIDs
3. Distribuye el link de instalación

#### **Opción C: Enterprise Distribution**
1. Necesitas cuenta Apple Enterprise ($299/año)
2. Instalación sin límite de dispositivos
3. Sin App Store

---

## 🔐 CONFIGURAR MICROSOFT MSAL EN iOS

Actualiza tu `Info.plist` (iOS):

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>msauth.com.ingenierialegal.peritoapp</string>
    </array>
  </dict>
</array>

<key>LSApplicationQueriesSchemes</key>
<array>
  <string>msauthv2</string>
  <string>msauthv3</string>
</array>
```

App Center lo hace automáticamente si usas `expo prebuild`.

---

## 📊 CONFIGURACIÓN UNIFICADA (iOS + Android)

Actualiza `app.json`:

```json
{
  "expo": {
    "name": "Perito App",
    "slug": "perito-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.ingenierialegal.peritoapp",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["msauth.com.ingenierialegal.peritoapp"]
          }
        ],
        "LSApplicationQueriesSchemes": ["msauthv2", "msauthv3"],
        "NSLocationWhenInUseUsageDescription": "Necesitamos tu ubicación para verificar coordenadas",
        "NSCameraUsageDescription": "Necesitamos la cámara para capturar evidencias"
      }
    },
    "android": {
      "package": "com.ingenierialegal.peritoapp",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA"
      ]
    }
  }
}
```

---

## 🚀 COMANDOS RÁPIDOS

### **Preparar proyecto para App Center:**

```bash
cd "C:\Users\MichaelRamirez\OneDrive - INGENIERIA LEGAL SAS\Documentos\perito-app\perito-app"

# Generar archivos nativos
npx expo prebuild --clean

# Comprimir proyecto para subir a App Center
tar -czf perito-app.tar.gz .
```

---

## 📱 COMPARACIÓN: Android vs iOS en App Center

| Característica | Android | iOS |
|----------------|---------|-----|
| **Compilación en nube** | ✅ Sí | ✅ Sí |
| **Necesita hardware Mac** | ❌ No | ❌ No (App Center lo maneja) |
| **Certificados necesarios** | Keystore | Apple Developer |
| **Distribución directa** | ✅ APK directo | ⚠️ Vía TestFlight o Ad-Hoc |
| **Costo** | Gratis | $99/año (Apple Developer) |
| **Tiempo de compilación** | 5-10 min | 10-15 min |

---

## 🎯 ESTRATEGIA RECOMENDADA

### **Fase 1: Desarrollo y Testing**
1. Compila **Android APK** en App Center (es más rápido)
2. Distribuye a testers Android
3. Prueba todas las funcionalidades

### **Fase 2: Expansión a iOS**
1. Registra cuenta Apple Developer
2. Configura iOS build en App Center
3. Distribuye vía TestFlight

---

## 💡 VENTAJA CLAVE DE APP CENTER

**App Center es ÚNICO porque:**

✅ Compila iOS **SIN necesitar Mac**
- Otros servicios (EAS, Bitrise) requieren Mac o son caros
- App Center usa MacOS virtual en Azure

✅ Mismo ecosistema Microsoft
- Integración perfecta con Azure AD
- Mismo login para todo
- Backend y app en la misma plataforma

---

## 📞 PRÓXIMO PASO INMEDIATO

**AHORA MISMO:**

1. Ve a: **https://appcenter.ms**
2. Inicia sesión con tu cuenta Microsoft
3. Crea 2 apps:
   - `Perito-App-Android`
   - `Perito-App-iOS`
4. Sube tu código
5. ¡Compila ambas versiones!

---

## 🆘 AYUDA

Si necesitas ayuda con:
- **Certificados iOS:** App Center los genera automáticamente
- **Keystore Android:** App Center lo genera automáticamente
- **TestFlight:** Guía en: https://docs.microsoft.com/en-us/appcenter/distribution/testflight

---

**App Center = Solución Microsoft completa para iOS + Android** 🚀
