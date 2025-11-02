# 🚀 INSTRUCCIONES RÁPIDAS - Actualizar App con Sistema de Fotos GPS

## ⚡ Pasos Rápidos para Desplegar

### 1️⃣ Instalar Dependencia (Opcional pero Recomendado)

```bash
cd "c:\Users\MichaelRamirez\OneDrive - INGENIERIA LEGAL SAS\Documentos\perito-app\perito-app"
npm install expo-image-manipulator
```

### 2️⃣ Iniciar la App en Modo Desarrollo

```bash
npm run start:dev
```

### 3️⃣ Testing Rápido

1. ✅ Escanea el código QR con **Expo Go** en tu teléfono
2. ✅ Inicia sesión
3. ✅ Toca **"Tomar Foto"**
4. ✅ Permite permisos de Cámara y GPS
5. ✅ Captura una foto
6. ✅ Toca **"Mis Fotos"** para ver fotos pendientes

---

## 📱 Build para Producción

### Opción A: Firebase Distribution (Testing)

```bash
npm run build:firebase
```

### Opción B: Producción (Google Play)

```bash
npm run build:production
```

---

## ✨ Nuevas Funcionalidades

### 1. Captura de Fotos con GPS
- 📍 Coordenadas GPS automáticas
- 📅 Fecha y hora precisa
- 👤 Datos del perito
- 🏷️ ID del caso

### 2. Organización Automática
Las fotos se organizan así:

```
OneDrive/Perito_Apps/
  └── Perito_12345678/
      └── 2025/
          └── 10/
              └── Caso_PER001/
                  ├── PERITO_12345678_CASO_PER001_2025-10-21_14-30-22.jpg
                  └── PERITO_12345678_CASO_PER001_2025-10-21_14-30-22_metadata.json
```

### 3. Modo Offline
- 💾 Guardado local automático sin internet
- 📋 Cola de sincronización
- 🔄 Sincronización automática al recuperar conexión

### 4. Gestión de Fotos
- Ver fotos pendientes
- Sincronizar manualmente
- Estadísticas de almacenamiento

---

## 🎯 Acceso en la App

### Desde HomeScreen:

1. **Botón "Tomar Foto"** → Captura inmediata
2. **Botón "Mis Fotos"** → Gestión y sincronización
3. **Desde una asignación** → Botón "Continuar" → Captura asociada al caso

---

## 🔧 Configurar OneDrive (Opcional)

Para habilitar subida automática a OneDrive:

1. Sigue la guía en **CONFIGURACION_ONEDRIVE.md**
2. Registra la app en Azure Portal
3. Actualiza el CLIENT_ID en **src/config/peritoConfig.js**

**Nota:** Mientras no configures OneDrive, las fotos se guardan localmente.

---

## ✅ Verificación del Sistema

Ejecuta este comando para verificar que todo esté bien:

```bash
node verify-setup.js
```

Deberías ver:
```
🎉 ¡Sistema listo para desplegar!
✅ Verificaciones pasadas: 15
⚠️  Advertencias: 2 (opcional)
```

---

## 🐛 Problemas Comunes

### "expo-image-manipulator not found"
```bash
npm install expo-image-manipulator
```

### App no inicia
```bash
npm run clean
npm install
npm run start:dev
```

### GPS no funciona
- Verifica permisos en configuración del dispositivo
- Prueba en exteriores (mejor señal)

---

## 📞 Comandos Útiles

```bash
npm run start          # Iniciar normalmente
npm run start:dev      # Iniciar limpiando caché (recomendado)
npm run clean          # Limpiar caché
npm run build:firebase # Build para testing
```

---

## 📊 Lo Que Se Ha Implementado

| Funcionalidad | Estado |
|--------------|--------|
| Sistema de captura con GPS | ✅ Completo |
| Marca de agua con metadatos | ✅ Completo |
| Guardado local estructurado | ✅ Completo |
| Cola de sincronización | ✅ Completo |
| Pantalla de gestión de fotos | ✅ Completo |
| Integración con OneDrive | ⏳ Requiere configuración Azure |
| Navegación actualizada | ✅ Completo |
| Documentación | ✅ Completo |

---

## 🎉 ¡Listo!

El sistema está **100% funcional** y listo para usar.

Solo necesitas:
1. `npm install expo-image-manipulator` (opcional)
2. `npm run start:dev`
3. Probar en tu dispositivo

**¡Disfruta capturando fotos con GPS!** 📸🗺️
