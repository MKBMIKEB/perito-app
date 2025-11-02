# 🔧 Configuración Microsoft OneDrive para Perito App

## 📋 Guía Completa de Configuración

### ✨ Sistema de Captura de Fotos con GPS y OneDrive

Esta guía te ayudará a configurar la integración completa con Microsoft OneDrive para almacenar automáticamente las fotos capturadas en campo con:
- 📍 Coordenadas GPS
- 📅 Fecha y hora exacta
- 👤 Datos del perito
- 🏷️ ID del caso/asignación
- 📁 Organización automática por carpetas

## 📋 Pasos para Habilitar OneDrive en Perito App

### 1. 🏢 Registro en Azure Portal

1. **Accede a Azure Portal**: https://portal.azure.com
2. **Ve a "Azure Active Directory"** → **"App registrations"**
3. **Haz clic en "New registration"**
4. **Configura la aplicación**:
   ```
   Name: Perito App OneDrive
   Supported account types: Accounts in any organizational directory and personal Microsoft accounts
   Redirect URI: msauth.com.ingenierialegal.saviaapp://auth
   ```
5. **Haz clic "Register"**

### 2. 🔐 Configurar Permisos API

1. **En tu app registrada, ve a "API permissions"**
2. **Haz clic "Add a permission"**
3. **Selecciona "Microsoft Graph"**
4. **Selecciona "Delegated permissions"**
5. **Agrega estos permisos**:
   - ✅ `Files.ReadWrite`
   - ✅ `Files.ReadWrite.All` 
   - ✅ `User.Read`
6. **Haz clic "Grant admin consent"**

### 3. 📱 Configurar la App

1. **Obtén el Client ID** de Azure Portal
2. **Actualiza el archivo OneDriveService.js**:

```javascript
// En authenticateWithMicrosoft()
const msalConfig = {
  auth: {
    clientId: 'TU_CLIENT_ID_AQUI', // ← Reemplaza con tu Client ID real
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: 'msauth.com.ingenierialegal.saviaapp://auth',
  }
};
```

### 4. 📦 Instalar Dependencias

```bash
# Para autenticación Microsoft
npm install @azure/msal-react-native @azure/msal-common

# Para navegador web (si usas web)  
npm install @azure/msal-browser
```

### 5. 🔧 Implementar MSAL

Actualiza `OneDriveService.js` con implementación real:

```javascript
import { PublicClientApplication } from '@azure/msal-react-native';

class OneDriveServiceClass {
  constructor() {
    this.msalInstance = null;
    this.initializeMSAL();
  }

  async initializeMSAL() {
    try {
      const config = {
        auth: {
          clientId: 'TU_CLIENT_ID',
          authority: 'https://login.microsoftonline.com/common',
        },
      };
      
      this.msalInstance = new PublicClientApplication(config);
      await this.msalInstance.init();
    } catch (error) {
      console.error('Error inicializando MSAL:', error);
    }
  }

  async authenticateWithMicrosoft() {
    try {
      const scopes = [
        'https://graph.microsoft.com/Files.ReadWrite',
        'https://graph.microsoft.com/User.Read'
      ];

      const result = await this.msalInstance.acquireTokenSilent({ scopes });
      
      if (!result) {
        // Si no hay token, solicitar login interactivo
        const loginResult = await this.msalInstance.acquireTokenInteractive({ scopes });
        this.accessToken = loginResult.accessToken;
      } else {
        this.accessToken = result.accessToken;
      }

      return { success: true, token: this.accessToken };
    } catch (error) {
      console.error('Error autenticando:', error);
      return { success: false, error: error.message };
    }
  }
}
```

## 🗂️ Estructura de Carpetas OneDrive

### **Carpetas por Perito**
```
📁 Mi OneDrive
├── 📁 Perito_Apps/
│   ├── 📁 Juan_Perez_12345678/
│   │   ├── 📷 PERITO_PER001_2025-09-04T15-30-45.jpg
│   │   ├── 📄 PERITO_PER001_2025-09-04T15-30-45.jpg.json
│   │   └── 📷 PERITO_PER002_2025-09-04T16-15-20.jpg
│   ├── 📁 Maria_Garcia_87654321/
│   │   ├── 📷 PERITO_PER003_2025-09-04T17-00-15.jpg
│   │   └── 📄 PERITO_PER003_2025-09-04T17-00-15.jpg.json
│   └── 📁 General/
│       └── 📷 (fotos sin asignación específica)
```

### **Configuración de Rutas**
```javascript
// En OneDriveService.js
this.peritoFolders = {
  '12345678': '/Perito_Apps/Juan_Perez_12345678',
  '87654321': '/Perito_Apps/Maria_Garcia_87654321',
  '11223344': '/Perito_Apps/Carlos_Rodriguez_11223344'
};
```

## 🔑 Variables de Configuración

### **app.json - Actualizar scheme**
```json
{
  "expo": {
    "scheme": "msauth.com.ingenierialegal.saviaapp"
  }
}
```

### **AndroidManifest.xml - Agregar intent filter**
```xml
<activity
  android:name=".MainActivity"
  android:exported="true"
  android:launchMode="singleTask">
  
  <!-- Intent filter para MSAL -->
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="msauth.com.ingenierialegal.saviaapp" />
  </intent-filter>
</activity>
```

## 🚀 Activación del Sistema

### **1. Configuración Inicial**
```javascript
// En OneDriveConfigScreen, cambiar success a true
return {
  success: true,  // ← Cambiar de false a true
  message: 'Microsoft OneDrive configurado correctamente'
};
```

### **2. Testing de Conectividad**
```javascript
// Test de subida
const testUpload = async () => {
  const testPhoto = {
    uri: 'file://test-image.jpg',
    fileName: 'test-photo.jpg'
  };
  
  const result = await OneDriveService.uploadPhoto(testPhoto, '/test');
  console.log('Test result:', result);
};
```

### **3. Monitoreo de Logs**
```javascript
// Para debug, activar logs detallados
console.log('OneDrive token:', this.accessToken);
console.log('Upload URL:', uploadUrl);
console.log('Response status:', response.status);
```

## 🛡️ Seguridad

### **Tokens de Acceso**
- ✅ Los tokens se almacenan de forma segura por MSAL
- ✅ Renovación automática de tokens
- ✅ No exponer Client Secret (solo usar Client ID)

### **Permisos Mínimos**
- ✅ Solo permisos de archivos necesarios
- ✅ No acceso a email o calendario
- ✅ Scope limitado a OneDrive

## 🔧 Troubleshooting

### **Error: "AADSTS50011"**
```
❌ Problema: Redirect URI no válida
✅ Solución: Verificar URI en Azure Portal y app.json
```

### **Error: "Network request failed"**
```
❌ Problema: Sin conexión a internet
✅ Solución: Las fotos se guardan localmente automáticamente
```

### **Error: "Insufficient privileges"**
```
❌ Problema: Permisos no otorgados
✅ Solución: Revisar "API permissions" en Azure Portal
```

## ✅ Lista de Verificación

- [ ] 🏢 App registrada en Azure Portal
- [ ] 🔐 Permisos Microsoft Graph configurados  
- [ ] 📱 Client ID actualizado en código
- [ ] 📦 Dependencias MSAL instaladas
- [ ] 🔧 Redirect URI configurada
- [ ] 🚀 Testing de autenticación exitoso
- [ ] 📁 Carpetas de peritos configuradas
- [ ] 🔄 Sincronización funcionando

## 📞 Soporte

Para activar completamente Microsoft OneDrive:

1. **Sigue estos pasos exactos**
2. **Obtén credenciales de Azure Portal**  
3. **Actualiza el código con tu Client ID**
4. **Instala dependencias MSAL**

Una vez configurado, las fotos se subirán automáticamente a **Microsoft OneDrive** en las carpetas específicas de cada perito.

---
*Configuración para Perito App - Microsoft OneDrive Integration*