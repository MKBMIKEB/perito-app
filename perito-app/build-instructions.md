# 🏗️ Instrucciones de Build Local

## 📦 Requisitos previos (ejecutar en orden):

### 1. ☕ Instalar Java JDK 11
```bash
# Opción 1: Descarga manual
https://www.oracle.com/java/technologies/downloads/#java11-windows

# Opción 2: Con Chocolatey (si lo tienes)
choco install openjdk11

# Opción 3: Con Winget
winget install Microsoft.OpenJDK.11
```

### 2. 🤖 Instalar Android Studio
1. Descargar: https://developer.android.com/studio
2. Instalar con configuración por defecto
3. Abrir Android Studio y completar setup
4. En SDK Manager, instalar:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Command-line Tools

### 3. 🔧 Configurar variables de entorno
```bash
# Ejecutar el archivo:
setup-env.bat

# O configurar manualmente:
JAVA_HOME=C:\Program Files\Java\jdk-11
ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%PATH%
```

### 4. ✅ Verificar instalación
```bash
java -version
adb version
```

## 🚀 Generar APK (después de instalar requisitos):

### Paso 1: Prebuild
```bash
cd "C:\Users\MichaelRamirez\Documents\perito-app\perito-app"
npx expo prebuild --platform android --clean
```

### Paso 2: Build APK
```bash
cd android
./gradlew assembleRelease
```

### Paso 3: Encontrar APK
El APK estará en:
```
android/app/build/outputs/apk/release/app-release.apk
```

## 🔧 Troubleshooting común:

### Error: "JAVA_HOME not set"
```bash
set JAVA_HOME=C:\Program Files\Java\jdk-11
```

### Error: "Android SDK not found"
```bash
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
```

### Error: "gradlew command not found"
```bash
# En Windows usar:
gradlew.bat assembleRelease
```

## ⚡ Build rápido (una vez configurado):
```bash
# Un solo comando para todo:
npm run build:local
```

## 📱 Instalar APK:
```bash
# Instalar en dispositivo conectado:
adb install android/app/build/outputs/apk/release/app-release.apk
```