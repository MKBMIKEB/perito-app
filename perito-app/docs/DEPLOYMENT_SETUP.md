# 🚀 Guía Completa de Despliegue - Perito App

## 📋 Checklist de Configuración

### ✅ Completados:
- [x] Firebase SDK instalado
- [x] Google Services configurado
- [x] EAS Build configurado
- [x] Scripts de despliegue creados
- [x] GitHub Actions workflow

### 🔄 Pendientes de completar:

## 1. 🔐 Obtener Tokens y Credenciales

### A. Token de Expo:
```bash
# Después de eas login, obtener token
eas auth:tokens:create
```

### B. Service Account de Firebase:
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Seleccionar proyecto `savia-424d0`
3. IAM & Admin > Service Accounts > Create Service Account
4. Nombre: `firebase-app-distribution`
5. Rol: `Firebase App Distribution Admin`
6. Crear y descargar JSON key

## 2. 📱 Configurar GitHub Repository

### A. Crear Repository (si no existe):
```bash
git init
git add .
git commit -m "Initial commit with Firebase setup"
git branch -M main
git remote add origin https://github.com/tu-usuario/perito-app.git
git push -u origin main
```

### B. Configurar GitHub Secrets:
En GitHub Repository > Settings > Secrets and variables > Actions:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `EXPO_TOKEN` | [tu_expo_token] | Token de autenticación Expo |
| `FIREBASE_APP_ID` | `1:273873873725:android:32d55788c3cc7293733354` | ID de la app en Firebase |
| `FIREBASE_SERVICE_ACCOUNT` | [contenido_del_json] | Service account key JSON |

## 3. 🔧 Variables de entorno locales

Crear archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
# Editar .env con valores reales
```

## 4. 🚀 Comandos de Despliegue

### Builds manuales:
```bash
# APK para testing
npm run build:android

# APK para Firebase Distribution
npm run build:firebase

# AAB para Google Play
npm run build:production

# Deploy completo
npm run deploy:firebase
```

### Deploy automático:
```bash
# Trigger CI/CD pipeline
git push origin main
```

## 5. 🔍 Verificación

### A. Verificar build:
1. Ir a [Expo Builds](https://expo.dev/builds)
2. Confirmar que el build se completó
3. Descargar APK para testing

### B. Verificar Firebase App Distribution:
1. Ir a Firebase Console > App Distribution
2. Verificar que la app aparece
3. Confirmar que testers reciben notificación

## 6. 📊 Monitoreo

### Logs y debugging:
```bash
# Ver builds de EAS
eas build:list

# Logs de GitHub Actions
# Ir a GitHub > Actions tab

# Logs de Firebase
# Firebase Console > App Distribution > Releases
```

## 🆘 Troubleshooting

### Errores comunes:

1. **"eas: command not found"**
   ```bash
   npm install -g eas-cli
   ```

2. **"Not authenticated with EAS"**
   ```bash
   eas login
   ```

3. **"Firebase service account error"**
   - Verificar que el JSON es válido
   - Confirmar roles del service account

4. **"Build failed"**
   - Revisar logs en Expo dashboard
   - Verificar dependencias en package.json

## 📞 Contacto y Soporte

Para problemas específicos:
- Expo: https://docs.expo.dev/
- Firebase: https://firebase.google.com/docs/
- EAS Build: https://docs.expo.dev/build/introduction/