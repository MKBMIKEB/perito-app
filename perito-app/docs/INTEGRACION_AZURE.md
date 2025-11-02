# Integración Azure Backend con React Native App

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Servicios Creados](#servicios-creados)
3. [Autenticación con Azure AD](#autenticación-con-azure-ad)
4. [Uso del API Service](#uso-del-api-service)
5. [Migración de Pantallas](#migración-de-pantallas)
6. [Configuración Nativa](#configuración-nativa)
7. [Testing](#testing)

---

## Configuración Inicial

### 1. Dependencias Instaladas

```json
{
  "react-native-msal": "^4.0.4",
  "axios": "^1.13.1",
  "@react-native-async-storage/async-storage": "1.21.0"
}
```

### 2. Archivos de Configuración

- **[src/config/azureConfig.js](../src/config/azureConfig.js)** - Configuración de Azure AD y endpoints
- **[src/services/AzureAuthService.js](../src/services/AzureAuthService.js)** - Servicio de autenticación
- **[src/services/ApiService.js](../src/services/ApiService.js)** - Servicio de API REST

---

## Servicios Creados

### AzureAuthService

Maneja toda la autenticación con Azure AD usando MSAL.

**Métodos principales:**

```javascript
import AzureAuthService from './services/AzureAuthService';

// Login interactivo
const { accessToken, account } = await AzureAuthService.login();

// Login silencioso (refresh token)
const { accessToken } = await AzureAuthService.loginSilent();

// Logout
await AzureAuthService.logout();

// Verificar si está autenticado
const isAuth = await AzureAuthService.isAuthenticated();

// Obtener usuario actual
const user = await AzureAuthService.getCurrentUser();
```

### ApiService

Maneja todas las llamadas HTTP al backend.

**Métodos principales:**

```javascript
import ApiService from './services/ApiService';

// ========== AUTENTICACIÓN ==========
await ApiService.login(accessToken);
const user = await ApiService.getMe();

// ========== CASOS ==========
const casos = await ApiService.getCasos({ estado: 'pendiente' });
const caso = await ApiService.getCaso(casoId);
const nuevoCaso = await ApiService.createCaso(casoData);
await ApiService.updateCaso(casoId, updates);
await ApiService.deleteCaso(casoId);

// ========== ONEDRIVE ==========
await ApiService.createCasoFolder('CASO-001');
const archivos = await ApiService.listCasoFiles('CASO-001');

// ========== UPLOAD ==========
await ApiService.uploadFoto(codigoCaso, base64Image, metadata);
await ApiService.uploadFormulario(codigoCaso, formularioData);

// ========== PERITOS ==========
const peritos = await ApiService.getPeritos();
const perito = await ApiService.getPerito(peritoId);

// ========== HEALTH CHECK ==========
const health = await ApiService.healthCheck();
```

---

## Autenticación con Azure AD

### Flujo de Autenticación

1. Usuario abre la app
2. App verifica si hay token guardado (`isAuthenticated()`)
3. Si no hay token → Mostrar LoginScreen
4. Usuario presiona "Iniciar Sesión con Microsoft"
5. Se abre navegador con login de Azure AD
6. Usuario ingresa credenciales
7. Azure AD retorna token
8. App guarda token en AsyncStorage
9. App envía token al backend (`/api/auth/login`)
10. Backend retorna datos del usuario
11. App navega a HomeScreen

### Ejemplo: LoginScreen.js

```javascript
import React, { useState, useEffect } from 'react';
import { View, Button, ActivityIndicator, Alert } from 'react-native';
import AzureAuthService from '../services/AzureAuthService';
import ApiService from '../services/ApiService';

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const isAuth = await AzureAuthService.isAuthenticated();
      if (isAuth) {
        // Ya está autenticado, ir a Home
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);

      // 1. Login con Azure AD
      const { accessToken, account } = await AzureAuthService.login();
      console.log('✅ Autenticado con Azure AD:', account.username);

      // 2. Enviar token al backend
      const userData = await ApiService.login(accessToken);
      console.log('✅ Usuario autenticado en backend:', userData.user);

      // 3. Navegar a Home
      navigation.replace('Home');
    } catch (error) {
      console.error('❌ Error en login:', error);
      Alert.alert(
        'Error de Autenticación',
        'No se pudo iniciar sesión. Por favor intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Button
        title="Iniciar Sesión con Microsoft"
        onPress={handleLogin}
      />
    </View>
  );
}
```

---

## Uso del API Service

### Ejemplo: AsignacionesScreen.js

```javascript
import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, ActivityIndicator } from 'react-native';
import ApiService from '../services/ApiService';

export default function AsignacionesScreen() {
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarCasos();
  }, []);

  const cargarCasos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener casos del usuario actual
      const userData = await ApiService.getMe();
      const misCasos = await ApiService.getCasosByPerito(userData.id);

      setCasos(misCasos);
    } catch (err) {
      console.error('Error cargando casos:', err);
      setError('No se pudieron cargar las asignaciones');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>{error}</Text>
        <Button title="Reintentar" onPress={cargarCasos} />
      </View>
    );
  }

  return (
    <FlatList
      data={casos}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={{ padding: 15, borderBottomWidth: 1 }}>
          <Text style={{ fontWeight: 'bold' }}>{item.codigo}</Text>
          <Text>{item.direccion}</Text>
          <Text>Estado: {item.estado}</Text>
        </View>
      )}
      refreshing={loading}
      onRefresh={cargarCasos}
    />
  );
}
```

### Ejemplo: DetalleAsignacionScreen.js

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Button } from 'react-native';
import ApiService from '../services/ApiService';

export default function DetalleAsignacionScreen({ route, navigation }) {
  const { casoId } = route.params;
  const [caso, setCaso] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDetalleCaso();
  }, [casoId]);

  const cargarDetalleCaso = async () => {
    try {
      setLoading(true);
      const detalles = await ApiService.getCaso(casoId);
      setCaso(detalles);
    } catch (error) {
      console.error('Error cargando caso:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle del caso');
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstado = async (nuevoEstado) => {
    try {
      await ApiService.updateCaso(casoId, { estado: nuevoEstado });
      Alert.alert('Éxito', 'Estado actualizado');
      cargarDetalleCaso(); // Recargar
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{caso.codigo}</Text>
      <Text>{caso.direccion}</Text>
      <Text>Ciudad: {caso.ciudad}</Text>
      <Text>Barrio: {caso.barrio}</Text>
      <Text>Estado: {caso.estado}</Text>

      <View style={{ marginTop: 20 }}>
        <Button
          title="Marcar como En Proceso"
          onPress={() => actualizarEstado('en_proceso')}
        />
        <Button
          title="Marcar como Completado"
          onPress={() => actualizarEstado('completado')}
        />
      </View>

      {/* Mostrar archivos */}
      <Text style={{ fontSize: 18, marginTop: 20 }}>Archivos:</Text>
      {caso.archivos?.map((archivo, index) => (
        <Text key={index}>📄 {archivo.nombre}</Text>
      ))}
    </ScrollView>
  );
}
```

### Ejemplo: CameraScreen.js (Upload de Fotos)

```javascript
import React, { useState } from 'react';
import { View, Button, Image, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import ApiService from '../services/ApiService';

export default function CameraScreen({ route }) {
  const { codigoCaso } = route.params;
  const [photoUri, setPhotoUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  const tomarFoto = async () => {
    // Lógica de cámara existente...
    const photo = await cameraRef.current.takePictureAsync({ base64: true });
    setPhotoUri(photo.uri);
    return photo;
  };

  const subirFoto = async () => {
    try {
      setUploading(true);

      // 1. Tomar foto
      const photo = await tomarFoto();

      // 2. Obtener ubicación
      const location = await Location.getCurrentPositionAsync({});

      // 3. Subir a OneDrive vía backend
      const result = await ApiService.uploadFoto(
        codigoCaso,
        photo.base64,
        {
          nombreArchivo: `foto_${Date.now()}.jpg`,
          fechaCaptura: new Date().toISOString(),
          latitud: location.coords.latitude,
          longitud: location.coords.longitude,
        }
      );

      Alert.alert('Éxito', 'Foto subida correctamente a OneDrive');
      console.log('Foto subida:', result.url);

    } catch (error) {
      console.error('Error subiendo foto:', error);
      Alert.alert('Error', 'No se pudo subir la foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} ref={cameraRef}>
        {/* UI de cámara */}
      </Camera>

      <Button
        title={uploading ? 'Subiendo...' : 'Tomar y Subir Foto'}
        onPress={subirFoto}
        disabled={uploading}
      />
    </View>
  );
}
```

---

## Migración de Pantallas

### Checklist de Migración

#### ✅ LoginScreen.js
- [x] Remover Firebase Auth
- [x] Implementar AzureAuthService
- [x] Agregar manejo de errores
- [x] Implementar navegación post-login

#### ⏳ AsignacionesScreen.js
- [ ] Remover lectura de Firebase Firestore
- [ ] Implementar ApiService.getCasos()
- [ ] Implementar refresh pull-to-refresh
- [ ] Agregar filtros de estado

#### ⏳ DetalleAsignacionScreen.js
- [ ] Remover lectura de Firestore
- [ ] Implementar ApiService.getCaso(id)
- [ ] Implementar actualización de estado
- [ ] Mostrar archivos de OneDrive

#### ⏳ CameraScreen.js
- [ ] Remover Firebase Storage upload
- [ ] Implementar ApiService.uploadFoto()
- [ ] Agregar metadatos de ubicación
- [ ] Implementar creación de carpeta OneDrive

#### ⏳ FormularioScreen.js
- [ ] Remover Firestore save
- [ ] Implementar ApiService.uploadFormulario()

---

## Configuración Nativa

### Android

#### 1. Modificar `android/app/src/main/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <application>
    <!-- Agregar esto DENTRO de <application> -->
    <activity android:name="com.microsoft.identity.client.BrowserTabActivity">
      <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data
          android:scheme="msauth"
          android:host="com.yourcompany.peritoapp"
          android:path="/SIGNATURE_HASH" />
      </intent-filter>
    </activity>
  </application>
</manifest>
```

#### 2. Generar Signature Hash

```bash
# Ejecutar en terminal
keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64
```

Usar el hash generado en Azure Portal → App Registration → Authentication → Redirect URIs.

### iOS

#### 1. Modificar `ios/PeritoApp/Info.plist`

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>msauth.c8256ffe-b0fc-406d-8832-736240ae5570</string>
    </array>
  </dict>
</array>
```

#### 2. Instalar Pods

```bash
cd ios
pod install
cd ..
```

---

## Testing

### 1. Health Check del Backend

```javascript
import ApiService from './services/ApiService';

const testBackend = async () => {
  try {
    const health = await ApiService.healthCheck();
    console.log('✅ Backend está funcionando:', health);
  } catch (error) {
    console.error('❌ Backend no responde:', error);
  }
};

testBackend();
```

### 2. Test de Autenticación

```javascript
import AzureAuthService from './services/AzureAuthService';
import ApiService from './services/ApiService';

const testAuth = async () => {
  try {
    // Login con Azure AD
    const { accessToken, account } = await AzureAuthService.login();
    console.log('✅ Login Azure AD exitoso:', account.username);

    // Validar token en backend
    const userData = await ApiService.login(accessToken);
    console.log('✅ Backend validó token:', userData.user);

    // Obtener perfil
    const me = await ApiService.getMe();
    console.log('✅ Perfil obtenido:', me);

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testAuth();
```

### 3. Test de Casos

```javascript
import ApiService from './services/ApiService';

const testCasos = async () => {
  try {
    // Listar casos
    const casos = await ApiService.getCasos();
    console.log('✅ Casos obtenidos:', casos.length);

    // Obtener detalle del primer caso
    if (casos.length > 0) {
      const detalle = await ApiService.getCaso(casos[0].id);
      console.log('✅ Detalle caso:', detalle);
    }

    // Crear nuevo caso
    const nuevoCaso = await ApiService.createCaso({
      codigo: 'CASO-TEST-001',
      direccion: 'Calle Test 123',
      ciudad: 'Bogotá',
      barrio: 'Test',
      tipoInmueble: 'casa',
    });
    console.log('✅ Caso creado:', nuevoCaso);

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testCasos();
```

### 4. Test de OneDrive

```javascript
import ApiService from './services/ApiService';

const testOneDrive = async () => {
  try {
    // Crear carpeta
    const estructura = await ApiService.createCasoFolder('CASO-TEST-002');
    console.log('✅ Carpeta creada:', estructura);

    // Listar archivos
    const archivos = await ApiService.listCasoFiles('CASO-TEST-002');
    console.log('✅ Archivos:', archivos);

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testOneDrive();
```

---

## Variables de Entorno

### Desarrollo Local

Cuando `__DEV__ === true`, la app se conecta a:
- Backend: `http://localhost:5000`

### Producción

Cuando `__DEV__ === false`, la app se conecta a:
- Backend: `https://perito-app-backend.azurewebsites.net`

---

## Troubleshooting

### Error: "Token expirado"

**Solución:** El token de Azure AD expira cada 1 hora. Usar `loginSilent()` para renovar:

```javascript
try {
  await ApiService.getCasos();
} catch (error) {
  if (error.response?.status === 401) {
    // Token expirado, renovar
    await AzureAuthService.loginSilent();
    // Reintentar
    await ApiService.getCasos();
  }
}
```

### Error: "Network request failed"

**Causas posibles:**
1. Backend no está corriendo (verificar `npm run dev`)
2. URL incorrecta en `azureConfig.js`
3. Firewall bloqueando conexión

**Solución:** Verificar health check:
```javascript
const health = await ApiService.healthCheck();
```

### Error: "itemNotFound" en OneDrive

**Causa:** Token no tiene el scope `Files.ReadWrite.All`

**Solución:**
1. Ir a Azure Portal → App Registration → API Permissions
2. Agregar `Files.ReadWrite.All`
3. Hacer logout completo y volver a login

---

## Próximos Pasos

1. ✅ Crear servicios de integración
2. ✅ Crear documentación
3. ⏳ Actualizar LoginScreen
4. ⏳ Actualizar AsignacionesScreen
5. ⏳ Actualizar DetalleAsignacionScreen
6. ⏳ Actualizar CameraScreen
7. ⏳ Configurar Android/iOS nativo
8. ⏳ Testing end-to-end
9. ⏳ Deploy a Azure App Service

---

## Soporte

Para problemas o preguntas:
- Backend logs: Ver terminal donde corre `npm run dev`
- Mobile logs: `npx react-native log-android` o `npx react-native log-ios`
- Azure Portal: Ver Application Insights para errores del backend en producción

---

**Última actualización:** 2025-11-01
**Versión:** 1.0.0
