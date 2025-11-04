# Crear Cuenta de Azure AD sin MFA para Testing

## ✅ Solución Implementada

Para poder probar la app **HOY MISMO en Expo Go** con tokens reales de Microsoft, necesitas crear una cuenta de Azure AD **sin MFA habilitado**.

### Ventajas de esta solución:
- ✅ Funciona en Expo Go (no necesitas APK)
- ✅ Obtiene tokens reales de Microsoft Graph
- ✅ Permite subir fotos a OneDrive
- ✅ Backend ya está listo con endpoint ROPC
- ✅ Puedes probar el flujo completo en minutos

## 📋 Pasos para Crear la Cuenta

### Paso 1: Acceder a Azure Portal

1. Ve a https://portal.azure.com
2. Inicia sesión con tu cuenta de administrador
3. Ve a **Azure Active Directory**

### Paso 2: Crear Nuevo Usuario

1. En el menú izquierdo, click en **Users**
2. Click en **+ New user** → **Create new user**
3. Completa los datos:

```
Identity:
- User principal name: perito.prueba@ingenierialegal.com.co
- Display name: Perito Prueba
- Password: [Crea una contraseña]
  ☑️ Show password (copia la contraseña, la necesitarás)

Assignments:
- Groups: (Opcional) Agrega al grupo de peritos si existe
- Roles: User (por defecto está bien)

Settings:
- Account enabled: Yes
- Usage location: Colombia
```

4. Click **Create**

### Paso 3: IMPORTANTE - NO Configurar MFA

**NO HAGAS NADA DE ESTO:**
- ❌ NO habilites "Per-user MFA"
- ❌ NO agregues Security defaults
- ❌ NO fuerces registro de MFA

La cuenta debe quedar **sin MFA** para que ROPC funcione.

### Paso 4: Asignar Licencia Microsoft 365

Para que la cuenta tenga acceso a OneDrive:

1. Ve a **Azure Active Directory** → **Users**
2. Busca y abre **perito.prueba@ingenierialegal.com.co**
3. Click en **Licenses** en el menú izquierdo
4. Click en **+ Assignments**
5. Selecciona **Microsoft 365 E3** (o la licencia que tengas disponible)
6. Asegúrate que incluye:
   - ✅ OneDrive for Business
   - ✅ SharePoint Online
7. Click **Save**

### Paso 5: Dar Permisos para Aplicación

1. Ve a **Azure Active Directory** → **App registrations**
2. Busca tu app: `c8256ffe-b0fc-406d-8832-736240ae5570`
3. Ve a **API permissions**
4. Verifica que estén estos permisos:
   - ✅ `User.Read` (Microsoft Graph)
   - ✅ `Files.ReadWrite` (Microsoft Graph)
   - ✅ `Files.ReadWrite.All` (Microsoft Graph)
   - ✅ `offline_access` (Microsoft Graph)

5. Si falta alguno, agrégalo:
   - Click **+ Add a permission**
   - Selecciona **Microsoft Graph**
   - Selecciona **Delegated permissions**
   - Busca y agrega los permisos faltantes
   - Click **Add permissions**

6. **IMPORTANTE**: Click en **Grant admin consent for [tu organización]**
   - Esto evita que el usuario tenga que aceptar permisos la primera vez

### Paso 6: Verificar "Allow public client flows"

1. En **App registrations** → Tu app
2. Ve a **Authentication**
3. Baja hasta **Advanced settings**
4. Verifica que **Allow public client flows** esté en **Yes**
5. Si no, actívalo y guarda

## 🧪 Probar la Cuenta

### Opción 1: Probar con Postman (Rápido)

Antes de usar la app, verifica que las credenciales funcionen:

1. **Endpoint:** `POST http://172.20.10.6:5000/api/auth/login-mobile`

2. **Headers:**
```json
{
  "Content-Type": "application/json"
}
```

3. **Body (JSON):**
```json
{
  "email": "perito.prueba@ingenierialegal.com.co",
  "password": "[tu-contraseña]"
}
```

4. **Respuesta esperada (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 123,
    "nombre": "Perito Prueba",
    "email": "perito.prueba@ingenierialegal.com.co",
    "rol": "Perito"
  },
  "tokens": {
    "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "microsoft": "eyJ0eXAiOiJKV1QiLCJub25jZSI6Ij...",
    "refresh": "0.ASkA8NoyfdYUHEyiJB..."
  }
}
```

### Opción 2: Probar en la App Móvil

1. **Abre Expo Go** en tu teléfono
2. **Escanea el QR** del servidor Expo
3. En la pantalla de login:
   - Email: `perito.prueba@ingenierialegal.com.co`
   - Contraseña: `[tu-contraseña]`
4. Click **Iniciar Sesión**

**Logs esperados en Expo:**
```
🔐 Autenticando con email/password: perito.prueba@ingenierialegal.com.co
✅ Login exitoso: Perito Prueba
✅ Autenticado: Perito Prueba
```

## 🐛 Solución de Problemas

### Error: "AADSTS50076" o "AADSTS50079" (MFA requerido)

**Causa:** La cuenta tiene MFA habilitado a nivel organizacional.

**Solución:**
1. Ve a **Azure AD** → **Users** → Tu usuario
2. Click en **Authentication methods**
3. Verifica que no tenga métodos MFA configurados
4. Si tu organización fuerza MFA para todos, necesitas:
   - Crear una política de Conditional Access que excluya esta cuenta, O
   - Usar OAuth 2.0 (generar APK de desarrollo)

### Error: "AADSTS50053" (Usuario deshabilitado)

**Causa:** La cuenta está deshabilitada.

**Solución:**
1. Ve a **Azure AD** → **Users** → Tu usuario
2. En **Overview**, verifica que **Account enabled** sea **Yes**
3. Si dice **No**, click **Enable account**

### Error: "AADSTS50126" (Credenciales incorrectas)

**Causa:** Email o contraseña incorrectos.

**Solución:**
1. Verifica el email completo: `perito.prueba@ingenierialegal.com.co`
2. Resetea la contraseña en Azure Portal:
   - Users → Tu usuario → **Reset password**
   - Copia la nueva contraseña temporal
   - Intenta de nuevo

### Error: "Network Error"

**Causa:** La app no puede conectar con el backend.

**Solución:**
1. Verifica que el backend esté corriendo:
   ```bash
   cd backend
   npm start
   ```

2. Verifica que tu IP no haya cambiado:
   ```bash
   ipconfig
   ```

3. Si cambió, actualiza [perito-app/src/config/peritoConfig.js:8](perito-app/src/config/peritoConfig.js#L8)

### Error: "AADSTS65001" (No tiene acceso a la aplicación)

**Causa:** El usuario no tiene permisos para usar la app.

**Solución:**
1. Ve a **Enterprise applications** en Azure AD
2. Busca tu app
3. Ve a **Users and groups**
4. Agrega el usuario `perito.prueba@ingenierialegal.com.co`

## 📝 Información de la Cuenta

Una vez creada, guarda esta información:

```
Email: perito.prueba@ingenierialegal.com.co
Contraseña: [tu-contraseña]
Display Name: Perito Prueba
MFA: Deshabilitado ❌
Licencia: Microsoft 365 E3 (con OneDrive)
Rol en app: Perito
```

## ✅ Checklist de Configuración

- [ ] Usuario creado en Azure AD
- [ ] Contraseña asignada y guardada
- [ ] MFA NO habilitado
- [ ] Licencia Microsoft 365 asignada
- [ ] Permisos de API verificados
- [ ] Admin consent otorgado
- [ ] "Allow public client flows" habilitado
- [ ] Probado con Postman (respuesta 200 OK)
- [ ] Probado en app móvil (login exitoso)

## 🚀 Siguiente Paso

Una vez que el login funcione con la nueva cuenta:

1. **Probar workflow completo:**
   - Login → Ver casos → Tomar foto → Sincronizar OneDrive

2. **Crear más cuentas de perito sin MFA** si es necesario

3. **Para producción con MFA:**
   - Generar APK de desarrollo con OAuth 2.0:
     ```bash
     cd perito-app
     eas build --profile development --platform android
     ```

---

**Estado:** ✅ Código actualizado y listo para probar

**Siguiente paso:** Crear la cuenta siguiendo los pasos anteriores y probar login
