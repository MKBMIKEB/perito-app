# 🔧 Configurar Permisos de OneDrive para Creación Automática de Carpetas

## ❌ Problema Actual

```
Error: User not found
```

Las carpetas NO se están creando automáticamente porque la aplicación de Azure AD no tiene los permisos correctos para acceder al OneDrive del usuario `michael.ramirez@ingenierialegal.com`.

---

## ✅ Solución: Agregar Permisos de Microsoft Graph

### 📋 Permisos Necesarios

Para que la aplicación pueda crear carpetas en OneDrive automáticamente, necesita estos permisos:

| Permiso | Tipo | Descripción |
|---------|------|-------------|
| `Files.ReadWrite.All` | Application | Leer y escribir archivos en todos los sitios |
| `Sites.ReadWrite.All` | Application | Leer y escribir en todos los sitios |
| `User.Read.All` | Application | Leer perfiles de todos los usuarios |

---

## 🔧 Pasos para Configurar

### 1. Acceder a Azure Portal

1. Ve a: https://portal.azure.com
2. Inicia sesión con: `michael.ramirez@ingenierialegal.com`
3. Contraseña: `3123144098mM`

---

### 2. Ir a App Registrations

1. En el buscador superior, escribe: **"App registrations"**
2. Click en **"App registrations"**
3. Busca tu aplicación:
   - **Application (client) ID:** `c8256ffe-b0fc-406d-8832-736240ae5570`
   - Nombre: Probablemente "PeritoApp" o similar

---

### 3. Configurar API Permissions

#### 3.1. Ir a API Permissions
1. En el menú lateral izquierdo, click en **"API permissions"**

#### 3.2. Agregar Permisos Nuevos
1. Click en **"+ Add a permission"**
2. Selecciona **"Microsoft Graph"**
3. Selecciona **"Application permissions"** (NO Delegated)

#### 3.3. Buscar y Agregar Cada Permiso

**Permiso 1: Files.ReadWrite.All**
1. En el buscador, escribe: `Files`
2. Expande **"Files"**
3. Marca ☑️ **"Files.ReadWrite.All"**
4. Click en **"Add permissions"**

**Permiso 2: Sites.ReadWrite.All**
1. Click en **"+ Add a permission"** de nuevo
2. **Microsoft Graph** → **Application permissions**
3. Busca: `Sites`
4. Expande **"Sites"**
5. Marca ☑️ **"Sites.ReadWrite.All"**
6. Click en **"Add permissions"**

**Permiso 3: User.Read.All**
1. Click en **"+ Add a permission"** de nuevo
2. **Microsoft Graph** → **Application permissions**
3. Busca: `User`
4. Expande **"User"**
5. Marca ☑️ **"User.Read.All"**
6. Click en **"Add permissions"**

---

### 4. ⚠️ IMPORTANTE: Conceder Consentimiento de Administrador

**Después de agregar los permisos, DEBES conceder el consentimiento:**

1. En la página de **"API permissions"**
2. Verás los permisos con estado: ⚠️ **"Not granted for [your directory]"**
3. Click en el botón: **"✅ Grant admin consent for [your directory]"**
4. Confirma: **"Yes"**
5. Espera que aparezca: ✅ **"Granted for [your directory]"**

**SIN ESTE PASO, LOS PERMISOS NO FUNCIONARÁN**

---

### 5. Verificar Client Secret

El Client Secret puede haber expirado. Verifica:

#### 5.1. Ir a Certificates & secrets
1. En el menú lateral, click en **"Certificates & secrets"**
2. En la sección **"Client secrets"**, verifica:
   - ¿Hay un secret listado?
   - ¿Está expirado? (columna "Expires")

#### 5.2. Si está expirado, crear uno nuevo:
1. Click en **"+ New client secret"**
2. Descripción: `PeritoApp-Secret-2025`
3. Expires: **12 months** (o 24 meses)
4. Click **"Add"**
5. **⚠️ IMPORTANTE:** Copia el **Value** INMEDIATAMENTE (solo se muestra una vez)

#### 5.3. Actualizar el .env del backend

Si creaste un nuevo secret, actualiza el archivo `.env`:

```env
AZURE_AD_CLIENT_SECRET=tu-nuevo-secret-aqui
```

---

### 6. Esperar 5-10 minutos

Los cambios de permisos pueden tardar hasta 10 minutos en aplicarse.

---

## ✅ Lista de Verificación

Marca cada paso que completes:

- [ ] Accedí a Azure Portal
- [ ] Encontré mi App Registration (`c8256ffe-b0fc-406d-8832-736240ae5570`)
- [ ] Agregué permiso: `Files.ReadWrite.All` (Application)
- [ ] Agregué permiso: `Sites.ReadWrite.All` (Application)
- [ ] Agregué permiso: `User.Read.All` (Application)
- [ ] ✅ **Concedí admin consent** (CRÍTICO)
- [ ] Verifiqué que el Client Secret no esté expirado
- [ ] Esperé 5-10 minutos
- [ ] Reinicié el backend

---

## 🧪 Probar Después de Configurar

### 1. Reiniciar Backend

```bash
# Detener el backend actual (Ctrl+C)
# O buscar y matar el proceso:
taskkill //F //IM node.exe

# Iniciar de nuevo
cd backend
npm start
```

### 2. Crear un Nuevo Caso

1. Ve a: http://localhost:5000/web/crear-caso-simple.html
2. Llena el formulario:
   - Código: `CASO_TEST_AUTO_2025`
   - Dirección: `Prueba automática`
   - Ciudad: `Bogotá`
3. Click en **"Crear Caso y Carpetas OneDrive"**

### 3. Verificar en OneDrive

Ve a tu OneDrive:
- OneDrive → **DatosPeritos** → **CASO_TEST_AUTO_2025**
- Debe haber:
  - 📁 Fotos/
  - 📁 Formularios/

---

## 🔍 Verificar Logs del Backend

Después de crear el caso, deberías ver:

```
✅ Caso creado: CASO_TEST_AUTO_2025 (ID: 8)
📁 Creando estructura de carpetas para CASO_TEST_AUTO_2025...
✅ Carpeta "DatosPeritos" creada
✅ Carpeta "CASO_TEST_AUTO_2025" creada
✅ Carpeta "Fotos" creada
✅ Carpeta "Formularios" creada
✅ Estructura creada para CASO_TEST_AUTO_2025
```

En lugar de:
```
❌ Error creando carpeta "DatosPeritos": User not found
```

---

## 📸 Captura de Pantalla de Cómo Debe Verse

### API Permissions (después de configurar):

```
Configured permissions:

API / Permission name                Type             Status
─────────────────────────────────────────────────────────────────
Microsoft Graph
  Files.ReadWrite.All               Application      ✅ Granted
  Sites.ReadWrite.All               Application      ✅ Granted
  User.Read.All                     Application      ✅ Granted
  User.Read                         Delegated        ✅ Granted
  Files.ReadWrite.All               Delegated        ✅ Granted
```

**TODOS deben tener:** ✅ **Granted for [your directory]**

---

## ❓ Troubleshooting

### Error persiste: "User not found"

**Posibles causas:**

1. **No concediste admin consent**
   - Solución: Ve a API permissions → Grant admin consent

2. **Los permisos no se han propagado**
   - Solución: Espera 10 minutos más

3. **Email incorrecto**
   - Verifica en `.env`: `ONEDRIVE_USER_EMAIL=michael.ramirez@ingenierialegal.com`
   - Confirma que ese email existe en tu organización

4. **Client Secret expirado**
   - Ve a Certificates & secrets
   - Crea nuevo secret
   - Actualiza `.env`

### Error: "Insufficient privileges"

- Necesitas ser **Administrador Global** o tener rol de administrador para conceder permisos
- Pide a tu administrador de Azure AD que conceda los permisos

---

## 🎯 Resumen de Comandos

```bash
# 1. Verificar que el backend está corriendo
taskkill //F //IM node.exe

# 2. Reiniciar backend
cd backend
npm start

# 3. Verificar conexión
curl http://localhost:5000/health

# 4. Probar crear caso
# Ir a: http://localhost:5000/web/crear-caso-simple.html
```

---

## 📞 Siguiente Paso

Una vez configurado:

1. ✅ Reinicia el backend
2. ✅ Crea un caso de prueba
3. ✅ Verifica que las carpetas se creen automáticamente
4. ✅ Confirma que los logs no muestren errores

**Cuando veas ✅ en los logs, el sistema estará 100% funcional y listo para producción.**

---

**¿Tienes acceso de administrador en Azure AD para conceder estos permisos?**

Si no, necesitarás pedir al administrador que los configure.
