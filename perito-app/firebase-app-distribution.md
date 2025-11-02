# 📱 Firebase App Distribution - Guía de Configuración

## 🔧 Configuración en Firebase Console

### Paso 1: Acceder a Firebase Console
1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar proyecto: **savia-424d0**

### Paso 2: Configurar App Distribution
1. En el menú lateral, ir a **App Distribution**
2. Click en **Get Started** (si es la primera vez)

### Paso 3: Registrar la App Android
1. Click en **Register app**
2. Seleccionar **Android**
3. Package name: `com.ingenierialegal.saviaapp`
4. App nickname: `Perito App`
5. Click **Register app**

### Paso 4: Configurar Testers
1. En la sección **Testers and groups**
2. Click **Add group**
3. Nombre del grupo: `testers`
4. Agregar emails de testers:
   - tu@email.com
   - tester1@email.com
   - tester2@email.com

### Paso 5: Obtener información necesaria
Copiar estos datos para configuración:

```bash
# App ID (encontrar en Project Settings > Your Apps)
FIREBASE_APP_ID=1:273873873725:android:32d55788c3cc7293733354

# Project ID
PROJECT_ID=savia-424d0
```

## 🤖 Service Account (para CI/CD)

### Crear Service Account:
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Seleccionar proyecto **savia-424d0**
3. IAM & Admin > Service Accounts
4. **Create Service Account**:
   - Name: `firebase-app-distribution`
   - Role: **Firebase App Distribution Admin**
5. Crear key JSON y descargar

## 📋 Variables de entorno necesarias:

```bash
# Para GitHub Actions
EXPO_TOKEN=your_expo_token_here
FIREBASE_APP_ID=1:273873873725:android:32d55788c3cc7293733354
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

## 🚀 Comandos de despliegue:

```bash
# Build manual
eas build --platform android --profile firebase-dist

# Deploy automático (después de configurar CI/CD)
git push origin main
```