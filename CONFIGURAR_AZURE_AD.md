# 🔐 Configurar Azure AD para Perito App

## Problema Actual
El botón "Iniciar sesión con Microsoft" no funciona porque la aplicación de Azure AD no tiene configurada la URI de redirección correcta.

## Solución: Configurar Azure AD

### 📋 Datos de tu App Registration Actual
- **Client ID:** `c8256ffe-b0fc-406d-8832-736240ae5570`
- **Tenant ID:** `fd32daf0-141c-4cb5-a224-10255204f33d`
- **Servidor local:** `http://localhost:5000`

---

## 🔧 Pasos para Configurar

### 1. Acceder a Azure Portal

1. Ve a https://portal.azure.com
2. Inicia sesión con tu cuenta de Microsoft 365
3. Busca "Azure Active Directory" o "Microsoft Entra ID"

### 2. Encontrar tu App Registration

1. En el menú lateral, click en **"App registrations"**
2. Busca la aplicación con ID: `c8256ffe-b0fc-406d-8832-736240ae5570`
   - O busca por nombre (probablemente sea "PeritoApp" o similar)

### 3. Configurar URIs de Redirección

1. Click en tu aplicación
2. En el menú lateral, click en **"Authentication"** (Autenticación)
3. En la sección **"Platform configurations"**, busca **"Web"**
4. Click en **"Add URI"** (Agregar URI)
5. Agrega las siguientes URIs:

   ```
   http://localhost:5000/web/login-azure.html
   http://localhost:5000/web/index-azure.html
   ```

6. **MUY IMPORTANTE:** Marca las casillas:
   - ✅ **Access tokens** (used for implicit flows)
   - ✅ **ID tokens** (used for implicit and hybrid flows)

7. Click en **"Save"** (Guardar)

### 4. Verificar Permisos de API

1. En el menú lateral, click en **"API permissions"**
2. Verifica que tenga estos permisos:
   - ✅ `User.Read` (Microsoft Graph)
   - ✅ `Files.ReadWrite.All` (Microsoft Graph)

3. Si faltan permisos:
   - Click en **"Add a permission"**
   - Selecciona **"Microsoft Graph"**
   - Selecciona **"Delegated permissions"**
   - Busca y agrega los permisos mencionados
   - Click en **"Grant admin consent"** (Conceder consentimiento de administrador)

### 5. Habilitar Implicit Grant (Opcional pero Recomendado)

1. En **"Authentication"**
2. En la sección **"Implicit grant and hybrid flows"**
3. Marca:
   - ✅ **Access tokens**
   - ✅ **ID tokens**

---

## 🚀 Después de Configurar

### 1. Recargar la Página
```bash
# Abre tu navegador en:
http://localhost:5000/web/login-azure.html
```

### 2. Click en "Iniciar sesión con Microsoft"

Deberías ver:
1. Redirección a login.microsoftonline.com
2. Pantalla de login de Microsoft
3. Solicitud de permisos (primera vez)
4. Redirección de vuelta a tu app
5. Dashboard cargado

---

## ❓ Si Aún No Funciona

### Opción A: Verificar la Consola del Navegador
1. Presiona `F12` en el navegador
2. Ve a la pestaña **Console**
3. Busca errores en rojo
4. Copia el error y revisa:

**Errores Comunes:**

| Error | Solución |
|-------|----------|
| `AADSTS50011: Reply URL mismatch` | URI de redirección no coincide - revisar paso 3 |
| `AADSTS65005: Invalid client` | Client ID incorrecto - verificar en Azure Portal |
| `AADSTS700016: Application not found` | La aplicación no existe o fue eliminada |
| `CORS error` | Problema de CORS - ya está configurado en el backend |

### Opción B: Crear Nueva App Registration

Si la aplicación actual no existe o no tienes acceso:

1. En Azure Portal → Azure AD → App registrations
2. Click en **"New registration"**
3. Nombre: `PeritoApp-Local`
4. Supported account types: **"Accounts in this organizational directory only"**
5. Redirect URI:
   - Tipo: **Web**
   - URI: `http://localhost:5000/web/login-azure.html`
6. Click **"Register"**
7. **Copia el Client ID y Tenant ID**
8. Ve a **"Authentication"** y marca:
   - ✅ Access tokens
   - ✅ ID tokens
9. Ve a **"API permissions"** y agrega:
   - Microsoft Graph → Delegated → User.Read
   - Microsoft Graph → Delegated → Files.ReadWrite.All
10. Click en **"Grant admin consent"**

**Luego actualiza estos archivos con los nuevos IDs:**

📄 **web-coordinador/login-azure.html** (línea 263-264):
```javascript
clientId: 'TU_NUEVO_CLIENT_ID',
authority: 'https://login.microsoftonline.com/TU_TENANT_ID',
```

📄 **web-coordinador/index-azure.html** (línea 322-323):
```javascript
clientId: 'TU_NUEVO_CLIENT_ID',
authority: 'https://login.microsoftonline.com/TU_TENANT_ID',
```

---

## 📞 Necesitas el Client ID y Tenant ID?

Si no los tienes, búscalos aquí:

1. Azure Portal → Azure AD → App registrations
2. Click en tu aplicación
3. En la página de **Overview**:
   - **Application (client) ID** = Client ID
   - **Directory (tenant) ID** = Tenant ID

---

## ✅ Verificación Final

Una vez configurado, prueba:

```bash
# 1. Abrir login
http://localhost:5000/web/login-azure.html

# 2. Click en "Iniciar sesión con Microsoft"

# 3. Debería redirigir a Microsoft y volver al dashboard
http://localhost:5000/web/index-azure.html
```

---

## 🎯 Checklist de Configuración

- [ ] URIs de redirección agregadas en Azure AD
- [ ] Access tokens e ID tokens habilitados
- [ ] Permisos API agregados (User.Read, Files.ReadWrite.All)
- [ ] Consentimiento de administrador otorgado
- [ ] Backend corriendo en http://localhost:5000
- [ ] Página de login recargada
- [ ] Consola del navegador sin errores

---

**Si sigues teniendo problemas, envíame un screenshot del error de la consola del navegador (F12 → Console) y te ayudo a resolverlo.**
