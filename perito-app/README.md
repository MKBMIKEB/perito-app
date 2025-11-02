# 📱 Perito App - Observatorio Inmobiliario

Una aplicación móvil profesional para peritos inmobiliarios, desarrollada con React Native y Expo, integrada con Firebase para el despliegue y distribución.

## 🚀 Características

- **📋 Gestión de Asignaciones**: Administración completa de casos asignados
- **📍 Geolocalización**: Integración con mapas y coordenadas precisas
- **📸 Captura de Evidencias**: Sistema de fotografía y documentación
- **💾 Sincronización**: Datos sincronizados con Firebase
- **🔒 Seguridad**: Autenticación y autorización robusta
- **📱 Nativo**: Optimizado para dispositivos Android

## 🛠️ Stack Tecnológico

- **Frontend**: React Native + Expo SDK 50
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Build**: EAS Build
- **CI/CD**: GitHub Actions
- **Distribution**: Firebase App Distribution

## 📦 Instalación y Desarrollo

### Configuración inicial
```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Verificar configuración
npm run check:setup

# Iniciar desarrollo
npm start
```

## 🚀 Despliegue

### Builds manuales
```bash
# APK para testing
npm run build:android

# APK para Firebase Distribution  
npm run build:firebase

# AAB para Google Play Store
npm run build:production
```

### Deploy automático
```bash
git push origin main
```

## 📋 Guías de Configuración

- [🔥 Firebase App Distribution](./firebase-app-distribution.md)
- [🚀 Deployment Setup](./docs/DEPLOYMENT_SETUP.md)
- [🔐 GitHub Secrets](./scripts/setup-github-secrets.md)

---

🔥 **Desarrollado con Firebase & Expo** 🚀
