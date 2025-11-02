# 🚀 SOLUCIÓN FINAL - COMPILACIÓN CON HERRAMIENTAS MICROSOFT

## ⚠️ ACTUALIZACIÓN: App Center discontinuado (31 marzo 2025)

**ALTERNATIVAS OFICIALES DE MICROSOFT:**

---

## ✅ OPCIÓN 1: **AZURE DEVOPS** (RECOMENDADO) ⭐

### **Por qué Azure DevOps:**
- ✅ Herramienta oficial Microsoft actual
- ✅ Compila iOS + Android en la nube
- ✅ CI/CD completo
- ✅ Integración perfecta con Azure AD
- ✅ **GRATIS** hasta 1800 minutos/mes

### **Configuración:**

1. **Ve a:** https://dev.azure.com
2. **Crea organización** (si no tienes)
3. **Crea nuevo proyecto:** "Perito-App"
4. **Importa código:**
   - Git/GitHub
   - O sube ZIP

5. **Crea Pipeline:**

Archivo: `azure-pipelines.yml`

```yaml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

variables:
  ANDROID_SDK_VERSION: '33'
  NODE_VERSION: '18.x'

steps:
# Instalar Node.js
- task: NodeTool@0
  inputs:
    versionSpec: $(NODE_VERSION)
  displayName: 'Install Node.js'

# Instalar dependencias
- script: |
    cd perito-app
    npm install
  displayName: 'npm install'

# Generar archivos nativos
- script: |
    cd perito-app
    npx expo prebuild --platform android --clean
  displayName: 'Expo prebuild'

# Compilar Android APK
- task: Gradle@2
  inputs:
    workingDirectory: 'perito-app/android'
    gradleWrapperFile: 'perito-app/android/gradlew'
    gradleOptions: '-Xmx3072m'
    publishJUnitResults: false
    tasks: 'assembleRelease'
  displayName: 'Build Android APK'

# Publicar APK
- task: PublishBuildArtifacts@1
  inputs:
    pathToPublish: 'perito-app/android/app/build/outputs/apk/release'
    artifactName: 'android-apk'
  displayName: 'Publish APK'
```

6. **Ejecuta Pipeline**
7. **Descarga APK** desde Artifacts

---

## ✅ OPCIÓN 2: **GITHUB ACTIONS** (También Microsoft)

Microsoft compró GitHub, así que también es Microsoft ecosystem.

### **Ventajas:**
- ✅ Gratis para repos públicos
- ✅ 2000 min/mes para privados
- ✅ Fácil configuración

### **Configuración:**

Archivo: `.github/workflows/build-android.yml`

```yaml
name: Build Android

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18

    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '17'

    - name: Install dependencies
      run: |
        cd perito-app
        npm install

    - name: Expo prebuild
      run: |
        cd perito-app
        npx expo prebuild --platform android --clean

    - name: Build APK
      run: |
        cd perito-app/android
        chmod +x gradlew
        ./gradlew assembleRelease

    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-release
        path: perito-app/android/app/build/outputs/apk/release/app-release.apk
```

---

## ✅ OPCIÓN 3: **EAS BUILD + FIXING** (Expo - Ya intentamos)

El problema que tienes con EAS es solucionable. Voy a arreglarlo:

### **Los errores son:**
1. ❌ Falta `expo-updates`
2. ❌ Configuración de channels incorrecta

### **Solución:**

```bash
cd perito-app

# 1. Instalar expo-updates
npx expo install expo-updates

# 2. Configurar
npx eas update:configure

# 3. Simplificar eas.json
```

Archivo `eas.json` simplificado:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

```bash
# 4. Build
npx eas build --platform android --profile preview
```

---

## 🎯 MI RECOMENDACIÓN FINAL:

### **Para deployment rápido: AZURE DEVOPS**

**Por qué:**
1. Ecosistema Microsoft completo
2. Mismo login que Azure AD, OneDrive, etc.
3. Compila iOS sin Mac
4. Gratis y confiable

### **Setup en 15 minutos:**

1. **Ve a:** https://dev.azure.com
2. **Crea proyecto**
3. **Sube tu código**
4. **Crea pipeline** (usa el YAML de arriba)
5. **Run pipeline**
6. **Descarga APK**

---

## 📱 PARA iOS TAMBIÉN:

Azure DevOps tiene agents con **macOS** para compilar iOS:

```yaml
pool:
  vmImage: 'macos-latest'  # Para iOS

steps:
- task: Xcode@5
  inputs:
    actions: 'build'
    scheme: 'peritoapp'
    sdk: 'iphoneos'
    configuration: 'Release'
```

---

## 🔥 ALTERNATIVA MÁS SIMPLE: **COMPILAR LOCALMENTE**

Si quieres evitar todo esto:

### **Para Windows (Android):**

1. **Instala Android Studio**
2. **Abre Android SDK Manager**
3. **Instala Android SDK 33**

```bash
cd perito-app
npx expo prebuild --platform android

cd android
.\gradlew assembleRelease

# APK en: android\app\build\outputs\apk\release\app-release.apk
```

### **Para Mac (iOS + Android):**

```bash
# iOS
npx expo run:ios --configuration Release

# Android
npx expo run:android --variant release
```

---

## 📊 COMPARACIÓN FINAL:

| Opción | Costo | Facilidad | iOS | Android | Microsoft |
|--------|-------|-----------|-----|---------|-----------|
| **Azure DevOps** | Gratis | ⭐⭐⭐⭐ | ✅ | ✅ | ✅ |
| **GitHub Actions** | Gratis | ⭐⭐⭐⭐⭐ | ✅ | ✅ | ✅ (Microsoft) |
| **EAS Build** | $29/mes | ⭐⭐⭐⭐⭐ | ✅ | ✅ | ❌ |
| **Local** | Gratis | ⭐⭐ | ⚠️ Mac | ✅ | ❌ |

---

## 🚀 ACCIÓN INMEDIATA:

**Ejecuta AHORA:**

```bash
# Opción más rápida - GitHub Actions
# 1. Sube tu código a GitHub
# 2. Crea archivo .github/workflows/build-android.yml con el YAML de arriba
# 3. Push
# 4. Ve a Actions tab en GitHub
# 5. Descarga APK cuando termine
```

O:

**Azure DevOps:**
1. https://dev.azure.com
2. Nuevo proyecto
3. Pipeline → New → YAML → Pega el código de arriba
4. Run
5. Descarga APK

---

**Cualquiera de estas 2 opciones te dará un APK funcional en ~15 minutos** 🚀
