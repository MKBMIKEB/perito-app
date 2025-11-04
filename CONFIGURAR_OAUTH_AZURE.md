# Configurar OAuth 2.0 en Azure AD

## ✅ Cambios Realizados en el Código

### 1. AzureAuthService actualizado
- ✅ Implementado OAuth 2.0 completo con expo-auth-session
- ✅ Soporta MFA (autenticación multifactor)
- ✅ Usa PKCE (Proof Key for Code Exchange) para seguridad
- ✅ Abre navegador web para login seguro

### 2. LoginScreen actualizado
- ✅ Removidos campos de email/password
- ✅ Botón de "Iniciar Sesión con Microsoft"
- ✅ Información sobre OAuth 2.0 seguro

### 3. app.json actualizado
- ✅ Agregado `scheme: "perito-app"` para redirect URI

## 🔧 Configuración Requerida en Azure AD

### Paso 1: Obtener el Redirect URI

El redirect URI que necesitas configurar depende de cómo ejecutes la app:

#### Para Expo Go:
```
exp://172.20.10.6:8081/--/auth
```

#### Para APK de desarrollo (recomendado):
```
perito-app://auth
```

### Paso 2: Configurar Redirect URI en Azure Portal

1. **Ir a Azure Portal:**
   - Abre https://portal.azure.com
   - Ve a "Azure Active Directory"
   - Selecciona "App registrations"
   - Busca tu app: `c8256ffe-b0fc-406d-8832-736240ae5570`

2. **Agregar Redirect URIs:**
   - Click en "Authentication" en el menú izquierdo
   - En la sección "Platform configurations", click "+ Add a platform"
   - Selecciona "Mobile and desktop applications"

3. **Agregar los siguientes URIs:**
   ```
   perito-app://auth
   exp://172.20.10.6:8081/--/auth
   ```

4. **Configurar flujos permitidos:**
   - ✅ Habilitar "Allow public client flows" (ya está activado)
   - ✅ En "Supported account types" debe estar:
     - "Accounts in this organizational directory only (Single tenant)"

5. **Configurar permisos (API permissions):**
   - Verificar que están agregados:
     - ✅ `User.Read` (Microsoft Graph)
     - ✅ `Files.ReadWrite` (Microsoft Graph)
     - ✅ `offline_access` (Microsoft Graph)

6. **Guardar cambios:**
   - Click "Save" al final de la página

### Paso 3: Probar la Autenticación

#### Opción A: Con Expo Go (prueba rápida)

1. Asegúrate que Expo está corriendo:
   ```bash
   cd perito-app
   npx expo start --port 8081
   ```

2. Escanea el QR con Expo Go

3. **IMPORTANTE:** El redirect URI para Expo Go cambia según tu IP. Para obtenerlo:
   - Click en el botón de login
   - Mira los logs en la terminal
   - Busca la línea: `📍 Redirect URI: exp://...`
   - Copia ese URI exacto y agrégalo en Azure AD

#### Opción B: Con APK de desarrollo (recomendado)

1. Genera el APK:
   ```bash
   cd perito-app
   eas build --profile development --platform android
   ```

2. Instala el APK en tu teléfono

3. El redirect URI será fijo: `perito-app://auth`

### Paso 4: Verificar Logs

Cuando pruebes el login, verás estos logs:

```
✅ OAuth Auth Service inicializado
🔐 Iniciando OAuth 2.0 flow...
📍 Redirect URI: perito-app://auth
✅ Código de autorización obtenido
✅ Token de acceso obtenido
✅ Usuario autenticado: Michael Ramirez
✅ Login OAuth completado exitosamente
```

## 🐛 Solución de Problemas

### Error: "Redirect URI mismatch"

**Causa:** El redirect URI en la app no coincide con el configurado en Azure AD.

**Solución:**
1. Revisa los logs de la app para ver el redirect URI exacto
2. Agrégalo en Azure AD Authentication → Redirect URIs
3. Espera 2-3 minutos para que se propague
4. Intenta de nuevo

### Error: "AADSTS650053: The application ... is disabled"

**Causa:** La aplicación está deshabilitada en Azure AD.

**Solución:**
1. En Azure Portal → App registrations
2. Verifica que el estado sea "Enabled"
3. Si está disabled, contacta al administrador

### Error: "AADSTS700016: Application with identifier was not found"

**Causa:** El Client ID es incorrecto.

**Solución:**
1. Verifica el Client ID en [perito-app/src/services/AzureAuthService.js:22](perito-app/src/services/AzureAuthService.js#L22)
2. Debe ser: `c8256ffe-b0fc-406d-8832-736240ae5570`
3. Verifica en Azure Portal que coincide

### Error: "Network Error" o "Cannot connect to server"

**Causa:** La app no puede comunicarse con el backend.

**Solución:**
1. Verifica que el backend esté corriendo:
   ```bash
   cd backend
   npm start
   ```

2. Verifica que tu IP local no haya cambiado:
   ```bash
   ipconfig
   ```

3. Actualiza [perito-app/src/config/peritoConfig.js:8](perito-app/src/config/peritoConfig.js#L8) si cambió la IP

### El navegador se abre pero no regresa a la app

**Causa:** El custom scheme no está registrado correctamente.

**Solución:**
1. Si usas Expo Go, esto es normal - copia manualmente el código
2. Si usas APK de desarrollo, reinstala la app:
   ```bash
   eas build --profile development --platform android
   ```

## 📋 Checklist de Configuración

- [ ] Redirect URIs agregados en Azure AD
- [ ] `perito-app://auth` configurado
- [ ] Permisos Microsoft Graph agregados
- [ ] Backend corriendo en `http://172.20.10.6:5000`
- [ ] CORS actualizado en backend/.env
- [ ] App móvil conectada a la misma red WiFi
- [ ] APK de desarrollo generado (o usando Expo Go)

## 🚀 Próximos Pasos

Una vez que el login funcione:

1. **Probar flujo completo:**
   - Login → Ver casos → Tomar foto → Sincronizar

2. **Implementar formularios completos:**
   - Agregar campos rurales y urbanos de Excel

3. **Probar offline:**
   - Desconectar WiFi
   - Tomar fotos y llenar formularios
   - Reconectar y sincronizar

4. **Preparar para producción:**
   - Actualizar API_BASE_URL a dominio público
   - Generar APK de producción firmado
   - Configurar distribución

---

**Estado Actual:** ✅ Código actualizado, pendiente configuración en Azure AD

**Siguiente paso:** Configurar redirect URIs en Azure Portal siguiendo el Paso 2
