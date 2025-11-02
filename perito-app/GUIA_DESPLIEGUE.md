# 📱 Guía de Despliegue - Sistema de Fotos GPS

## 🚀 Cómo Actualizar la App con las Nuevas Funcionalidades

### ✅ Cambios Implementados

Se han agregado las siguientes funcionalidades:

1. **Sistema de captura de fotos con GPS**
   - Coordenadas precisas
   - Fecha y hora automática
   - Metadatos del perito

2. **Organización automática en OneDrive**
   - Carpetas por perito/año/mes/caso
   - Archivos JSON con metadatos completos

3. **Modo offline**
   - Guardado local automático
   - Cola de sincronización
   - Sincronización automática al recuperar conexión

4. **Pantalla de gestión de fotos**
   - Ver fotos pendientes
   - Sincronizar manualmente
   - Estadísticas de almacenamiento

---

## 📦 Instalación de Dependencias

### 1. Instalar dependencia faltante

```bash
cd "c:\Users\MichaelRamirez\OneDrive - INGENIERIA LEGAL SAS\Documentos\perito-app\perito-app"
npm install expo-image-manipulator
```

### 2. Verificar que todas las dependencias estén instaladas

```bash
npm install
```

---

## 🔧 Pasos para Desplegar

### Opción 1: Desarrollo Local (Recomendado para Testing)

```bash
# Limpiar caché
npm run clean

# Iniciar en modo desarrollo
npm run start:dev
```

Luego:
- Escanea el código QR con Expo Go (Android/iOS)
- O presiona `a` para Android emulator
- O presiona `i` para iOS simulator

### Opción 2: Build para Testing (Firebase Distribution)

```bash
# Build para Firebase App Distribution
npm run build:firebase
```

Esto creará un APK que puedes distribuir a testers.

### Opción 3: Build para Producción

```bash
# Build de producción
npm run build:production
```

---

## 🎯 Testing del Sistema de Fotos

### 1. Probar Captura de Fotos

1. Inicia sesión en la app
2. Desde HomeScreen, toca **"Tomar Foto"**
3. Permite permisos de Cámara y GPS
4. Espera a que el indicador GPS esté verde
5. Captura una foto
6. Verifica el mensaje de éxito

### 2. Verificar Guardado Local

```bash
# Las fotos se guardan en:
DocumentDirectory/perito_photos/Perito_{CEDULA}/{AÑO}/{MES}/Caso_{ID}/
```

Verifica que:
- Se crea el archivo `.jpg`
- Se crea el archivo `_metadata.json`
- La cola de sincronización se actualiza

### 3. Probar Gestión de Fotos

1. Desde HomeScreen, toca **"Mis Fotos"**
2. Verifica que aparezcan las fotos pendientes
3. Revisa las estadísticas
4. Prueba la sincronización manual

### 4. Probar Modo Offline

1. Desactiva WiFi y datos móviles
2. Captura una foto
3. Verifica que se guarde localmente
4. Reactiva la conexión
5. Sincroniza manualmente desde "Mis Fotos"

---

## 📁 Archivos Modificados/Creados

### Nuevos Servicios
- `src/services/WatermarkService.js` ✅
- `src/services/OneDriveService.js` (mejorado) ✅

### Nuevas Pantallas
- `src/screens/PhotoManagerScreen.js` ✅

### Pantallas Modificadas
- `src/screens/CameraScreen.js` (actualizado) ✅
- `src/screens/HomeScreen.js` (agregado botón "Mis Fotos") ✅

### Configuración
- `App.js` (agregadas rutas de navegación) ✅
- `src/config/peritoConfig.js` (ya existente, listo para configurar)

### Documentación
- `CONFIGURACION_ONEDRIVE.md` (guía de Azure) ✅
- `GUIA_DESPLIEGUE.md` (este archivo) ✅

---

## 🔐 Configuración de OneDrive (Opcional)

Para habilitar la subida automática a OneDrive:

1. **Registrar app en Azure Portal**
   - Sigue la guía en `CONFIGURACION_ONEDRIVE.md`
   - Obtén el CLIENT_ID

2. **Actualizar configuración**
   ```javascript
   // En src/config/peritoConfig.js
   MICROSOFT_CONFIG: {
     CLIENT_ID: 'TU_CLIENT_ID_AQUI',  // ← Cambiar
     // ...
   }
   ```

3. **Instalar MSAL (cuando estés listo)**
   ```bash
   npm install @azure/msal-react-native @azure/msal-common
   ```

**Nota:** Mientras no configures OneDrive, las fotos se guardan localmente y puedes sincronizarlas después.

---

## 🧪 Checklist de Testing

- [ ] App inicia correctamente
- [ ] Login funciona
- [ ] HomeScreen muestra botón "Mis Fotos"
- [ ] CameraScreen se abre correctamente
- [ ] Permisos de Cámara se solicitan
- [ ] Permisos de GPS se solicitan
- [ ] GPS obtiene ubicación (indicador verde)
- [ ] Foto se captura correctamente
- [ ] Metadatos se guardan en JSON
- [ ] PhotoManagerScreen muestra fotos pendientes
- [ ] Estadísticas se muestran correctamente
- [ ] Sincronización manual funciona
- [ ] Modo offline guarda localmente
- [ ] Al recuperar conexión, se puede sincronizar

---

## 🐛 Solución de Problemas Comunes

### Error: "expo-image-manipulator not found"

```bash
npm install expo-image-manipulator
```

### Error: "Cannot read property 'navigate' of undefined"

Asegúrate de que las pantallas estén correctamente importadas en `App.js`.

### GPS no se activa

- Verifica que los permisos estén otorgados
- Sal al exterior (mejor señal GPS)
- Reinicia la ubicación del dispositivo

### Fotos no aparecen en PhotoManager

- Verifica que la cola de sincronización exista: `DocumentDirectory/sync_queue.json`
- Revisa los logs en la consola

### App no inicia después de cambios

```bash
# Limpiar todo y reinstalar
npm run clean
rm -rf node_modules
npm install
npm run start:dev
```

---

## 📊 Monitoreo y Logs

### Ver logs en tiempo real

```bash
# Durante desarrollo
npm run start:dev
```

Busca estos logs importantes:
- `📸 Foto capturada...`
- `📁 Subiendo a OneDrive...`
- `💾 Foto guardada localmente...`
- `📋 Foto agregada a cola de sincronización...`
- `🔄 Sincronizando X fotos pendientes...`
- `✅ Sincronizado: nombre_archivo.jpg`

### Verificar estructura de archivos

```javascript
// En PhotoManagerScreen o mediante consola
import * as FileSystem from 'expo-file-system';

const checkFiles = async () => {
  const baseDir = FileSystem.documentDirectory + 'perito_photos/';
  const files = await FileSystem.readDirectoryAsync(baseDir);
  console.log('Archivos:', files);
};
```

---

## 🎉 Próximos Pasos

1. **Testing Inicial**
   - Prueba en emulador/simulador
   - Verifica todas las funcionalidades

2. **Testing en Dispositivo Real**
   - Instala con Expo Go
   - Prueba GPS real en campo
   - Verifica modo offline

3. **Configurar OneDrive** (cuando estés listo)
   - Sigue `CONFIGURACION_ONEDRIVE.md`
   - Configura CLIENT_ID
   - Instala MSAL

4. **Build de Producción**
   - Genera APK para distribución
   - Sube a Firebase App Distribution o Google Play

---

## 📞 Comandos Útiles

```bash
# Desarrollo
npm run start          # Iniciar en modo normal
npm run start:dev      # Iniciar limpiando caché
npm run android        # Ejecutar en Android
npm run ios            # Ejecutar en iOS

# Build
npm run build:firebase    # Build para Firebase Distribution
npm run build:production  # Build de producción

# Mantenimiento
npm run clean          # Limpiar caché
npm install            # Reinstalar dependencias
```

---

## ✅ Estado Actual del Sistema

| Componente | Estado | Notas |
|------------|--------|-------|
| WatermarkService | ✅ Completo | Listo para usar |
| OneDriveService | ✅ Completo | Requiere configurar CLIENT_ID |
| CameraScreen | ✅ Actualizado | Integrado con nuevos servicios |
| PhotoManagerScreen | ✅ Completo | Gestión de fotos pendientes |
| Sistema de colas | ✅ Completo | Sincronización offline funcional |
| Navegación | ✅ Actualizada | Rutas agregadas en App.js |
| OneDrive integración | ⏳ Pendiente | Requiere Azure CLIENT_ID |

---

**Sistema listo para testing y despliegue** 🚀
