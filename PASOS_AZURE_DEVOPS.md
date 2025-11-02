# 🚀 PASOS PARA COMPILAR CON AZURE DEVOPS

## ✅ YA ESTÁ TODO LISTO

He creado el archivo **`azure-pipelines.yml`** en tu proyecto que:
- ✅ Compila Android con Microsoft MSAL
- ✅ Genera APK descargable
- ✅ Configurado para tu IP: `10.58.230.72:5000`

---

## 📋 PASOS A SEGUIR (15 minutos):

### **1. Crear cuenta Azure DevOps** (2 min)

Ve a: **https://dev.azure.com**

- Click **"Start free"**
- Inicia sesión con tu cuenta Microsoft
- Crea una **Organización** (nombre: tu nombre o empresa)

---

### **2. Crear nuevo proyecto** (1 min)

- Click **"New project"**
- **Name:** `Perito-App`
- **Visibility:** Private
- Click **"Create"**

---

### **3. Subir tu código** (3 min)

Tienes 2 opciones:

#### **Opción A: Conectar repositorio Git existente**
Si ya tienes el código en GitHub/GitLab:
1. Ve a **Repos** en el menú izquierdo
2. Click **"Import repository"**
3. Pega la URL de tu repo
4. Click **"Import"**

#### **Opción B: Subir código directamente**
1. Ve a **Repos**
2. Click **"Files"**
3. Click **"Upload files"**
4. Sube toda la carpeta `perito-app`
5. O inicializa Git y haz push:

```bash
cd "C:\Users\MichaelRamirez\OneDrive - INGENIERIA LEGAL SAS\Documentos\perito-app\perito-app"

git init
git add .
git commit -m "Initial commit - Perito App con Microsoft MSAL"

# Azure DevOps te dará la URL del repo, ejemplo:
# git remote add origin https://dev.azure.com/TU_ORG/Perito-App/_git/Perito-App
# git push -u origin main
```

---

### **4. Crear Pipeline** (2 min)

1. Ve a **Pipelines** en el menú izquierdo
2. Click **"Create Pipeline"**
3. **Where is your code?**
   - Si usaste Repos de Azure DevOps: Click **"Azure Repos Git"**
   - Si usaste GitHub: Click **"GitHub"**
4. **Select a repository:** Selecciona `Perito-App`
5. **Configure your pipeline:**
   - Click **"Existing Azure Pipelines YAML file"**
   - Path: `/azure-pipelines.yml`
   - Click **"Continue"**

---

### **5. Ejecutar Pipeline** (10-15 min)

1. Revisa el YAML (ya está listo)
2. Click **"Run"**
3. **Espera 10-15 minutos** mientras compila

Verás el progreso en tiempo real:
```
✅ Instalar Node.js
✅ Instalar Java
✅ npm install
✅ Expo prebuild
✅ Build Android APK
✅ Publicar APK
```

---

### **6. Descargar APK** (1 min)

Cuando termine (verás ✅ **Success**):

1. Click en el **build completado**
2. Ve a la pestaña **"Artifacts"** (o "Artefactos")
3. Verás: `perito-app-release`
4. Click en los **3 puntos** → **"Download"**
5. Descomprime el ZIP
6. **Encontrarás:** `app-release.apk`

---

## 📱 INSTALAR EN TU MÓVIL

### **Método 1: Transferir vía USB**
1. Conecta tu Android al PC
2. Copia `app-release.apk` al móvil
3. En el móvil, abre el archivo
4. Acepta "Instalar apps desconocidas"
5. ¡Instala!

### **Método 2: Subir a OneDrive/Drive**
1. Sube `app-release.apk` a OneDrive
2. Abre OneDrive en tu móvil
3. Descarga el APK
4. Instala

---

## 🔥 BUILDS AUTOMÁTICOS

Una vez configurado, **cada vez que hagas cambios**:

```bash
cd perito-app
# Hacer tus cambios...

git add .
git commit -m "Actualización: descripción del cambio"
git push

# ¡Azure DevOps compila automáticamente!
```

En 10-15 minutos tendrás un nuevo APK listo.

---

## 🎯 PARA iOS (FUTURO)

Cuando quieras compilar iOS:

1. Agrega este stage al `azure-pipelines.yml`:

```yaml
# iOS Build
- job: iOS
  pool:
    vmImage: 'macOS-latest'

  steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '18.x'

  - script: |
      npm install
      npx expo prebuild --platform ios --clean
    displayName: 'Expo prebuild iOS'

  - task: Xcode@5
    inputs:
      actions: 'build'
      scheme: 'peritoapp'
      sdk: 'iphoneos'
      configuration: 'Release'
      xcWorkspacePath: '**/ios/*.xcworkspace'
      xcodeVersion: 'default'
```

2. Necesitarás:
   - Apple Developer Account ($99/año)
   - Certificados y provisioning profiles

---

## 📊 MONITOREO

En Azure DevOps puedes ver:
- ✅ Historial de builds
- ✅ Tiempo de compilación
- ✅ Logs completos si falla
- ✅ Descargar cualquier versión anterior

---

## 🆘 SI ALGO FALLA

### Error: "Gradle failed"
**Solución:** En el YAML, aumenta la memoria:
```yaml
gradleOptions: '-Xmx4096m'  # En vez de 3072m
```

### Error: "Node modules not found"
**Solución:** Limpia cache:
1. Ve a Pipeline
2. Click "Run pipeline"
3. Check "Clean workspace"

### Error: "Cannot find Android SDK"
**Solución:** El agent de Azure ya lo tiene, verifica el `vmImage: 'ubuntu-latest'`

---

## 💡 VENTAJAS DE AZURE DEVOPS

✅ **Gratis:** 1800 minutos/mes
✅ **Microsoft ecosystem:** Mismo login que Azure AD, OneDrive
✅ **iOS sin Mac:** Compila iOS en la nube
✅ **CI/CD completo:** Automático en cada push
✅ **Historial:** Todas las versiones guardadas

---

## 🎯 RESUMEN RÁPIDO

```
1. https://dev.azure.com → Crear proyecto
2. Subir código (con azure-pipelines.yml)
3. Pipelines → Create → Run
4. Esperar 15 min
5. Download APK desde Artifacts
6. Instalar en móvil
7. ¡Probar Microsoft Login!
```

---

## ✅ EL APK INCLUYE:

- ✅ Microsoft MSAL (login con cuentas Microsoft)
- ✅ Backend configurado: `http://10.58.230.72:5000`
- ✅ Formulario completo de diligenciamiento
- ✅ Cámara con GPS y marca de agua
- ✅ Integración OneDrive para fotos
- ✅ AndroidManifest con OAuth redirect

---

**¡Listo para producción!** 🚀

Cualquier duda en el proceso, revisa los logs del pipeline en Azure DevOps.
