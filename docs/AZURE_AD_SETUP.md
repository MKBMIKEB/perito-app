# 🔐 Configuración de Azure Active Directory (AAD)

Guía paso a paso para registrar PeritoApp en Azure AD y configurar la autenticación.

---

## 📋 Paso 1: Registrar la Aplicación en Azure AD

### 1.1 Acceder al Portal de Azure

1. Ve a https://portal.azure.com
2. Inicia sesión con tu cuenta organizacional de Microsoft
3. En el buscador, escribe **"Azure Active Directory"**
4. Haz clic en **Azure Active Directory**

### 1.2 Crear App Registration

1. En el menú lateral, haz clic en **"App registrations"**
2. Haz clic en **"+ New registration"**

3. Completa el formulario:

```
Nombre: PeritoApp
Supported account types:
  ⦿ Accounts in this organizational directory only (Single tenant)

Redirect URI (opcional por ahora):
  Platform: Web
  URI: http://localhost:3000/auth/callback
```

4. Haz clic en **"Register"**

### 1.3 Copiar Credenciales Importantes

Una vez creada la app, verás la página de **Overview**. Copia estos valores:

```
Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Directory (tenant) ID:   yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
```

**Guárdalos en un lugar seguro** - los necesitarás para configurar el código.

---

## 🔑 Paso 2: Crear Client Secret

### 2.1 Generar Secret

1. En la página de tu app, ve a **"Certificates & secrets"** (menú lateral)
2. Haz clic en **"+ New client secret"**
3. Completa:
   - **Description**: `PeritoApp Backend Secret`
   - **Expires**: 24 months (o Custom)
4. Haz clic en **"Add"**

### 2.2 Copiar el Secret

**⚠️ IMPORTANTE:** El secret solo se muestra UNA VEZ. Cópialo inmediatamente:

```
Client Secret Value: ABC123def456GHI789jkl...
```

**Guárdalo en Azure Key Vault** (no lo pongas en código).

---

## 🌐 Paso 3: Configurar Redirect URIs

### 3.1 Para App Móvil (React Native)

1. Ve a **"Authentication"** (menú lateral)
2. Haz clic en **"+ Add a platform"**
3. Selecciona **"Mobile and desktop applications"**
4. Marca las opciones:
   - ✅ `https://login.microsoftonline.com/common/oauth2/nativeclient`
   - ✅ `msal{CLIENT_ID}://auth` (reemplaza {CLIENT_ID} con tu Application ID)

Ejemplo:
```
msalabcd1234-ef56-7890-gh12-ijklmnop3456://auth
```

5. En **"Supported account types"**:
   - Deja: **Accounts in this organizational directory only**

6. Haz clic en **"Configure"**

### 3.2 Para App Web

1. Regresa a **"Authentication"**
2. Haz clic en **"+ Add a platform"**
3. Selecciona **"Web"**
4. Agrega Redirect URIs:

**Para desarrollo:**
```
http://localhost:3000/auth/callback
http://localhost:8000/auth/callback
```

**Para producción:**
```
https://perito-app-web.azurewebsites.net/auth/callback
https://tudominio.com/auth/callback
```

5. En **"Implicit grant and hybrid flows"**:
   - ✅ **Access tokens**
   - ✅ **ID tokens**

6. Haz clic en **"Configure"**

---

## 🔓 Paso 4: Configurar Permisos de API

### 4.1 Microsoft Graph Permissions

1. Ve a **"API permissions"** (menú lateral)
2. Haz clic en **"+ Add a permission"**
3. Selecciona **"Microsoft Graph"**

### 4.2 Permisos Delegados (Usuario debe consentir)

Haz clic en **"Delegated permissions"** y agrega:

```
✅ User.Read                  - Leer perfil del usuario
✅ Files.ReadWrite.All        - Leer/escribir archivos en OneDrive
✅ Sites.ReadWrite.All        - Acceder a SharePoint (opcional)
✅ offline_access             - Refresh tokens
✅ openid                     - OpenID Connect
✅ profile                    - Información básica del perfil
✅ email                      - Email del usuario
```

### 4.3 Permisos de Aplicación (Backend sin usuario)

Haz clic en **"Application permissions"** y agrega:

```
✅ Files.ReadWrite.All        - Backend puede leer/escribir archivos
✅ User.Read.All              - Backend puede leer usuarios (validar peritos)
```

### 4.4 Otorgar Consentimiento de Administrador

**⚠️ IMPORTANTE:** Un administrador global debe aprobar estos permisos:

1. Haz clic en **"✓ Grant admin consent for [TU ORGANIZACIÓN]"**
2. Confirma en el diálogo
3. Espera a que aparezca la columna "Status" con ✅ **Granted**

---

## 👥 Paso 5: Crear Roles de Aplicación

### 5.1 Definir Roles Personalizados

1. Ve a **"App roles"** (menú lateral)
2. Haz clic en **"+ Create app role"**

### 5.2 Rol: Perito

```
Display name: Perito
Allowed member types: Users/Groups
Value: Perito
Description: Perito de campo que captura evidencias
```

### 5.3 Rol: Coordinador

```
Display name: Coordinador
Allowed member types: Users/Groups
Value: Coordinador
Description: Coordinador que asigna casos y revisa evidencias
```

### 5.4 Rol: Administrador

```
Display name: Administrador
Allowed member types: Users/Groups
Value: Administrador
Description: Administrador con acceso total al sistema
```

---

## 👤 Paso 6: Asignar Usuarios a Roles

### 6.1 Crear Usuarios de Prueba

1. Ve a **Azure Active Directory** → **Users**
2. Haz clic en **"+ New user"** → **Create user**

**Usuario 1 - Perito:**
```
User principal name: juan.perez@tuempresa.onmicrosoft.com
Display name: Juan Pérez
Password: (genera automático y cópialo)
```

**Usuario 2 - Coordinador:**
```
User principal name: maria.lopez@tuempresa.onmicrosoft.com
Display name: María López
Password: (genera automático y cópialo)
```

### 6.2 Asignar Roles a Usuarios

1. Ve a **Azure Active Directory** → **Enterprise applications**
2. Busca y selecciona **PeritoApp**
3. Ve a **"Users and groups"**
4. Haz clic en **"+ Add user/group"**

**Asignar Juan Pérez:**
```
Users: Juan Pérez
Select a role: Perito
```

**Asignar María López:**
```
Users: María López
Select a role: Coordinador
```

5. Haz clic en **"Assign"**

---

## 📝 Paso 7: Configurar Token Settings

### 7.1 Token Configuration

1. Ve a **"Token configuration"**
2. Haz clic en **"+ Add optional claim"**

### 7.2 ID Token Claims

Selecciona **ID** y agrega:
```
✅ email
✅ family_name
✅ given_name
✅ upn (User Principal Name)
```

### 7.3 Access Token Claims

Selecciona **Access** y agrega:
```
✅ email
✅ upn
```

### 7.4 Agregar Roles en el Token

1. Haz clic en **"+ Add groups claim"**
2. Selecciona:
   - ⦿ **Security groups**
   - ✅ **Group ID**
3. En **"Customize token properties by type"**:
   - ID: ✅ **sAMAccountName**
   - Access: ✅ **sAMAccountName**

---

## 🔧 Paso 8: Archivo de Configuración

### 8.1 Crear .env para Backend

```bash
# Azure AD Configuration
AZURE_AD_TENANT_ID=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
AZURE_AD_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_AD_CLIENT_SECRET=ABC123def456GHI789jkl...

# Graph API
GRAPH_API_ENDPOINT=https://graph.microsoft.com/v1.0
GRAPH_API_SCOPES=https://graph.microsoft.com/.default

# App Configuration
REDIRECT_URI_WEB=https://perito-app-web.azurewebsites.net/auth/callback
REDIRECT_URI_MOBILE=msalxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx://auth

# OneDrive Configuration
ONEDRIVE_FOLDER_ROOT=DatosPeritos
```

### 8.2 Crear authConfig.js para App Móvil

```javascript
// src/config/authConfig.js
export const msalConfig = {
  auth: {
    clientId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    authority: 'https://login.microsoftonline.com/yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
    redirectUri: 'msalxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx://auth',
  },
  cache: {
    cacheLocation: 'localStorage',
  },
};

export const loginRequest = {
  scopes: [
    'User.Read',
    'Files.ReadWrite.All',
    'offline_access',
  ],
};

export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphFilesEndpoint: 'https://graph.microsoft.com/v1.0/me/drive',
};
```

### 8.3 Crear authConfig.js para App Web

```javascript
// web/src/config/authConfig.js
export const msalConfig = {
  auth: {
    clientId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    authority: 'https://login.microsoftonline.com/yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
    redirectUri: window.location.origin + '/auth/callback',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['User.Read', 'Files.ReadWrite.All'],
};
```

---

## ✅ Paso 9: Verificar Configuración

### 9.1 Checklist de Validación

```
✅ App registration creada
✅ Client ID copiado
✅ Tenant ID copiado
✅ Client Secret creado y guardado en Key Vault
✅ Redirect URIs configurados (móvil + web)
✅ Permisos de Graph API agregados
✅ Consentimiento de administrador otorgado
✅ Roles de app creados (Perito, Coordinador, Administrador)
✅ Usuarios de prueba creados
✅ Roles asignados a usuarios
✅ Token claims configurados
✅ Archivos .env creados
```

### 9.2 Probar Autenticación

**Test rápido con Postman:**

```bash
# 1. Obtener token usando Client Credentials Flow
POST https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token

Body (x-www-form-urlencoded):
client_id: {CLIENT_ID}
client_secret: {CLIENT_SECRET}
scope: https://graph.microsoft.com/.default
grant_type: client_credentials
```

**Respuesta esperada:**
```json
{
  "token_type": "Bearer",
  "expires_in": 3599,
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 9.3 Probar Graph API

```bash
# 2. Usar el token para llamar Graph API
GET https://graph.microsoft.com/v1.0/me/drive

Headers:
Authorization: Bearer {ACCESS_TOKEN}
```

---

## 🔐 Paso 10: Configurar Azure Key Vault

### 10.1 Crear Key Vault

```bash
# Usando Azure CLI
az keyvault create \
  --name perito-app-keyvault \
  --resource-group perito-app-rg \
  --location brazilsouth
```

### 10.2 Agregar Secrets

```bash
# Client Secret
az keyvault secret set \
  --vault-name perito-app-keyvault \
  --name "AzureAD-ClientSecret" \
  --value "ABC123def456GHI789jkl..."

# DB Connection String
az keyvault secret set \
  --vault-name perito-app-keyvault \
  --name "SqlConnectionString" \
  --value "Server=tcp:perito-db.database.windows.net..."
```

### 10.3 Dar Acceso a App Service

```bash
# Habilitar Managed Identity en App Service
az webapp identity assign \
  --name perito-app-backend \
  --resource-group perito-app-rg

# Dar permisos de lectura al Key Vault
az keyvault set-policy \
  --name perito-app-keyvault \
  --object-id {MANAGED_IDENTITY_PRINCIPAL_ID} \
  --secret-permissions get list
```

---

## 📚 Recursos Adicionales

- [Documentación MSAL.js](https://docs.microsoft.com/azure/active-directory/develop/msal-overview)
- [Graph API Explorer](https://developer.microsoft.com/graph/graph-explorer)
- [Azure AD Best Practices](https://docs.microsoft.com/azure/active-directory/develop/identity-platform-integration-checklist)
- [Token Lifetime Configuration](https://docs.microsoft.com/azure/active-directory/develop/active-directory-configurable-token-lifetimes)

---

## 🎯 Siguiente Paso

Ahora que Azure AD está configurado, procede a crear el backend:

👉 **Ver: [BACKEND_API.md](./BACKEND_API.md)**
