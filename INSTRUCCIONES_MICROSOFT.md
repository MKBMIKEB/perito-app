# 📱 INSTRUCCIONES - APP CON MICROSOFT AUTHENTICATION

## ✅ LO QUE SE CONFIGURÓ:

### 1. **Backend (Puerto 5000)** ✅
- Servidor Node.js corriendo
- Endpoint: `POST /api/auth/login` (valida tokens Azure AD)
- Endpoint: `POST /api/upload/foto` (sube a OneDrive)
- Endpoint: `POST /api/upload/formulario` (guarda formularios)

### 2. **App Móvil** ✅
- `App.js`: Usa `AzureAuthService`
- `LoginScreen.js`: Login con Microsoft MSAL
- `AndroidManifest.xml`: Configurado para OAuth redirect
- `AzureAuthService.js`: Implementa MSAL correctamente

### 3. **Azure AD** ✅
- Client ID: `c8256ffe-b0fc-406d-8832-736240ae5570`
- Tenant ID: `fd32daf0-141c-4cb5-a224-10255204f33d`
- Redirect URI: `msauth://com.ingenierialegal.saviaapp/...`

---

## 📥 CÓMO INSTALAR LA APP:

### Paso 1: Espera a que termine la compilación (10-15 min)

Verás algo así:
```
✔ Build finished
📦 Android application archive: https://expo.dev/accounts/.../builds/...
```

### Paso 2: Descarga el APK

1. Copia el link que aparece
2. Ábrelo en tu móvil Android
3. Descarga el APK

### Paso 3: Instala el APK

1. Ve a **Configuración > Seguridad > Instalar apps desconocidas**
2. Habilita tu navegador
3. Abre el APK descargado
4. Presiona **Instalar**

---

## 🔐 CÓMO FUNCIONA EL LOGIN:

### 1. **Usuario abre la app**
- Ve pantalla de login con botón "Iniciar Sesión con Microsoft"

### 2. **Usuario presiona el botón**
- Se abre el navegador con `login.microsoftonline.com`
- Usuario ingresa su correo Microsoft (@outlook.com, @hotmail.com, o corporativo)
- Ingresa contraseña

### 3. **Microsoft redirige a la app**
- Con el token de autenticación
- La app lo valida con el backend (localhost:5000)

### 4. **Usuario autenticado** ✅
- Accede al HomeScreen
- Ve sus casos asignados
- Puede tomar fotos y diligenciar formularios

---

## 📸 FLUJO DE SUBIDA DE FOTOS A ONEDRIVE:

```
1. Usuario toma foto con GPS
   ↓
2. Foto se guarda localmente
   ↓
3. Se sube a OneDrive vía backend
   ↓
4. Ruta: /DatosPeritos/Caso_{id}/Fotos/foto_{timestamp}.jpg
```

---

## 📋 FLUJO DE FORMULARIOS:

```
1. Usuario diligencia FormularioCampoScreen
   ↓
2. Datos se validan
   ↓
3. Se envían al backend: POST /api/upload/formulario
   ↓
4. Backend guarda en OneDrive: /DatosPeritos/Caso_{id}/Formularios/
```

---

## ⚠️ PROBLEMAS CONOCIDOS Y SOLUCIONES:

### ❌ "Error de conexión"
**Solución:** Verifica que el backend esté corriendo en `localhost:5000`
```bash
cd backend
npm run dev
```

### ❌ "No se puede autenticar"
**Solución:** Verifica que la cuenta Microsoft esté registrada en Azure AD

### ❌ "Cannot connect to localhost:5000 from phone"
**Solución:** En Android, usa tu IP local en lugar de localhost
```javascript
// En azureConfig.js o ApiService.js, cambia:
baseURL: 'http://192.168.1.X:5000'  // Tu IP de PC
```

Para saber tu IP:
```bash
ipconfig
# Busca "IPv4 Address" de tu adaptador WiFi
```

---

## 🚀 COMANDOS ÚTILES:

### Levantar backend:
```bash
cd "C:\Users\MichaelRamirez\OneDrive - INGENIERIA LEGAL SAS\Documentos\perito-app\backend"
npm run dev
```

### Compilar nueva versión de la app:
```bash
cd "C:\Users\MichaelRamirez\OneDrive - INGENIERIA LEGAL SAS\Documentos\perito-app\perito-app"
npx eas-cli build --profile preview --platform android --non-interactive
```

### Ver estado de compilaciones:
```bash
npx eas-cli build:list
```

---

## 📞 CONTACTO DE SOPORTE:

- **Backend logs:** Ver consola donde corre `npm run dev`
- **App logs:** Ver en Android Studio Logcat o `adb logcat`

---

## ✅ CHECKLIST DE VERIFICACIÓN:

- [ ] Backend corriendo en puerto 5000
- [ ] APK instalado en móvil Android
- [ ] Cuenta Microsoft válida
- [ ] WiFi conectado (móvil y PC en la misma red)
- [ ] Login con Microsoft funciona
- [ ] Fotos se suben a OneDrive
- [ ] Formularios se guardan correctamente

---

**Versión:** Microsoft Azure AD v2.0
**Fecha:** Noviembre 2025
**Compilado con:** EAS Build + React Native MSAL
