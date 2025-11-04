# Solución de Errores en App Móvil

## Resumen de Problemas Encontrados

Cuando ejecutaste la app móvil, se encontraron 4 errores principales:

```
1. ❌ Favicon.png no encontrado (menor, no afecta funcionalidad)
2. ❌ SQLite.openDatabaseAsync no es función
3. ❌ expo-camera useCameraPermissions no es función
4. ❌ Network Error al sincronizar con backend
```

## Causa Raíz

Los errores 2 y 3 ocurren porque **Expo Go NO soporta módulos nativos** como:
- `expo-sqlite` (base de datos local)
- `expo-camera` (cámara)
- Otros módulos que requieren código nativo

## Soluciones Aplicadas

### ✅ 1. Configuración de API Base URL

**Archivo modificado:** [perito-app/src/config/peritoConfig.js](perito-app/src/config/peritoConfig.js#L7-L8)

```javascript
export const PERITO_CONFIG = {
  // URL del backend API (tu IP local de WiFi)
  API_BASE_URL: 'http://172.20.10.6:5000',
  // ... resto de configuración
}
```

**Por qué:** La app móvil no puede acceder a `localhost` porque ese es el teléfono, no tu PC.

### ✅ 2. Configuración CORS en Backend

**Archivo modificado:** [backend/.env](backend/.env#L33)

```env
ALLOWED_ORIGINS=http://localhost:5000,http://localhost:8000,http://localhost:8080,http://localhost:19006,http://172.20.10.6:5000,http://172.20.10.6:8081
```

**Por qué:** El backend debe permitir peticiones desde la IP de red local.

### ✅ 3. Servidor Backend Reiniciado

El servidor backend se reinició con la nueva configuración CORS y está corriendo en:
- Puerto: 5000
- Accesible desde: `http://172.20.10.6:5000`

## Opciones para Usar la App Móvil

### Opción 1: Generar APK de Desarrollo (RECOMENDADO)

Esta es la mejor opción para testing real con todas las funcionalidades:

```bash
cd perito-app

# 1. Instalar EAS CLI globalmente (solo una vez)
npm install -g eas-cli

# 2. Login en Expo (si no lo has hecho)
eas login

# 3. Configurar proyecto (solo la primera vez)
eas build:configure

# 4. Generar APK de desarrollo
eas build --profile development --platform android
```

El proceso toma ~15-20 minutos. Al finalizar obtendrás un enlace para descargar el APK que incluye:
- ✅ Expo Development Client
- ✅ expo-sqlite funcionando
- ✅ expo-camera funcionando
- ✅ Todas las funcionalidades nativas

**Instalar en teléfono:**
1. Descarga el APK desde el enlace que te da EAS
2. Instala en tu teléfono Android
3. Abre la app y conecta al servidor Expo en `http://172.20.10.6:8081`

### Opción 2: Continuar con Expo Go (LIMITADO)

Puedes seguir usando Expo Go pero con estas limitaciones:

**❌ NO funcionará:**
- Base de datos SQLite local
- Cámara con permisos
- Cualquier funcionalidad que requiera código nativo

**✅ SÍ funcionará:**
- Login con Azure AD
- Sincronización con backend (Network Error ya corregido)
- Navegación entre pantallas
- UI/UX general

**Para probar con Expo Go:**
1. Asegúrate que tu teléfono está en la misma red WiFi
2. Escanea el QR de Expo desde la terminal
3. La app se abrirá pero verás errores de SQLite y Camera

### Opción 3: Modo Demo (TEMPORAL)

La app ya tiene un modo demo que:
- Salta la autenticación
- Usa datos de ejemplo en memoria
- Permite navegar por todas las pantallas

Puedes activarlo temporalmente para ver la UI sin funcionalidad completa.

## Verificar Conectividad

### Desde tu PC:

```bash
# Ver tu IP local
ipconfig

# Buscar "Adaptador de LAN inalámbrica Wi-Fi"
# Dirección IPv4: 172.20.10.6
```

### Desde tu teléfono:

1. Conecta a la misma red WiFi que tu PC
2. Abre navegador móvil
3. Visita: `http://172.20.10.6:5000/health`
4. Deberías ver: `{"status":"OK","timestamp":"..."}`

Si NO ves la respuesta:
- ❌ Teléfono en otra red WiFi
- ❌ Firewall de Windows bloqueando puerto 5000
- ❌ IP cambió (verifica con `ipconfig` de nuevo)

## Próximos Pasos Recomendados

### Corto Plazo (Hoy):
1. ✅ Backend configurado y corriendo
2. ⏳ Generar APK de desarrollo con EAS
3. ⏳ Instalar APK en teléfono
4. ⏳ Probar funcionalidad completa

### Mediano Plazo (Esta semana):
1. Completar formulario con todos los campos (rural + urbano)
2. Implementar OAuth 2.0 completo (para soportar MFA)
3. Probar workflow completo: crear caso → tomar fotos → llenar form → sincronizar

### Largo Plazo (Producción):
1. Configurar dominio con IP pública o Azure App Service
2. Actualizar `API_BASE_URL` a URL de producción
3. Generar APK de producción firmado
4. Distribuir vía Firebase App Distribution o Google Play

## Comandos Útiles

```bash
# Ver logs del backend
# (Ya está corriendo en background)

# Ver logs de Expo
cd perito-app
npx expo start --port 8081

# Limpiar caché si hay problemas
cd perito-app
npx expo start --clear

# Verificar que backend responde
curl http://172.20.10.6:5000/health
```

## Resumen de Archivos Modificados

1. ✅ [perito-app/src/config/peritoConfig.js](perito-app/src/config/peritoConfig.js) - Agregado `API_BASE_URL`
2. ✅ [backend/.env](backend/.env) - Actualizado `ALLOWED_ORIGINS`

## Notas Importantes

- **IP 172.20.10.6 es temporal:** Si cambias de red WiFi o reinicias el router, tu IP puede cambiar. Verifica con `ipconfig` y actualiza `peritoConfig.js` si es necesario.

- **Expo Go es para prototipado:** Para una app de producción con módulos nativos, SIEMPRE necesitas generar un build (APK/IPA).

- **SQLite y Camera son críticos:** Sin ellos, la app no puede:
  - Guardar datos offline
  - Tomar fotos geolocalizadas
  - Funcionar sin internet

Por eso la **Opción 1 (APK de desarrollo)** es la recomendada.

---

**Estado:** ✅ Configuración completada, listo para generar APK

**Siguiente paso:** Ejecutar `eas build --profile development --platform android`
