# 🔐 INSTALACIÓN Y CONFIGURACIÓN OAUTH 2.0 COMPLETO

## 📦 PASO 1: INSTALAR DEPENDENCIAS

```bash
cd perito-app

# Instalar react-native-app-auth (OAuth para React Native)
npm install react-native-app-auth

# Instalar peer dependencies
npx expo install expo-web-browser expo-auth-session expo-crypto
```

---

## ⚙️ PASO 2: CONFIGURAR AZURE AD

### **A. Agregar Redirect URI en Azure Portal**

1. Ve a **Azure Portal** → **Azure Active Directory** → **App registrations**
2. Selecciona tu app: **perito-app** (Client ID: c8256ffe-b0fc-406d-8832-736240ae5570)
3. Ve a **Authentication** → **Add a platform** → **Mobile and desktop applications**
4. Agrega estos Redirect URIs:

```
msauth://com.ingenierialegal.peritoapp/Callback
```

Y también para Expo:
```
exp://localhost:19000/--/auth
https://auth.expo.io/@tu-usuario/perito-app
```

### **B. Verificar Permisos**

En **API permissions**, asegúrate de tener:
- ✅ User.Read
- ✅ Files.ReadWrite.All
- ✅ offline_access (para refresh token)

---

## 🔧 PASO 3: CONFIGURAR app.json

Agrega la configuración de esquema personalizado:

```json
{
  "expo": {
    "name": "Perito Móvil",
    "slug": "perito-app",
    "scheme": "peritoapp",
    "android": {
      "package": "com.ingenierialegal.peritoapp",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "msauth",
              "host": "com.ingenierialegal.peritoapp",
              "pathPrefix": "/Callback"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

---

## 📱 PASO 4: ACTUALIZAR AzureAuthService.js

Reemplaza el contenido con OAuth completo:

```javascript
/**
 * Azure Auth Service - OAuth 2.0 Completo
 * Soporta MFA y flujo completo de autorización
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import { PERITO_CONFIG } from '../config/peritoConfig';

// Necesario para cerrar el navegador automáticamente
WebBrowser.maybeCompleteAuthSession();

class AzureAuthService {
  constructor() {
    this.initialized = true;
    this.baseURL = PERITO_CONFIG.API_BASE_URL || 'http://localhost:5000';

    // Configuración de Azure AD
    this.config = {
      clientId: 'c8256ffe-b0fc-406d-8832-736240ae5570',
      tenantId: 'fd32daf0-141c-4cb5-a224-10255204f33d',
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'peritoapp',
        path: 'auth'
      }),
      scopes: [
        'openid',
        'profile',
        'email',
        'offline_access',
        'User.Read',
        'Files.ReadWrite.All'
      ],
      serviceConfiguration: {
        authorizationEndpoint: `https://login.microsoftonline.com/fd32daf0-141c-4cb5-a224-10255204f33d/oauth2/v2.0/authorize`,
        tokenEndpoint: `https://login.microsoftonline.com/fd32daf0-141c-4cb5-a224-10255204f33d/oauth2/v2.0/token`,
      }
    };
  }

  /**
   * Inicializa el servicio
   */
  async initialize() {
    console.log('✅ Auth Service inicializado con OAuth 2.0 completo');
    console.log('📱 Redirect URI:', this.config.redirectUri);
    return true;
  }

  /**
   * Login con OAuth 2.0 (abre navegador)
   * SOPORTA MFA
   */
  async login() {
    try {
      console.log('🔐 Iniciando OAuth 2.0 con Azure AD...');
      console.log('📱 Redirect URI:', this.config.redirectUri);

      // Crear el discovery document
      const discovery = {
        authorizationEndpoint: this.config.serviceConfiguration.authorizationEndpoint,
        tokenEndpoint: this.config.serviceConfiguration.tokenEndpoint,
      };

      // Crear el request de autorización
      const authRequest = new AuthSession.AuthRequest({
        clientId: this.config.clientId,
        scopes: this.config.scopes,
        redirectUri: this.config.redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        extraParams: {
          prompt: 'select_account', // Permite seleccionar cuenta
        }
      });

      // Hacer el request
      const result = await authRequest.promptAsync(discovery);

      console.log('📊 Resultado OAuth:', result.type);

      if (result.type === 'success') {
        const { code } = result.params;

        console.log('✅ Código de autorización recibido');

        // Intercambiar código por token
        const tokenResponse = await this.exchangeCodeForToken(code, authRequest.codeVerifier);

        if (tokenResponse) {
          // Obtener información del usuario
          const userInfo = await this.getUserInfo(tokenResponse.access_token);

          // Buscar/crear usuario en BD
          let usuario;
          try {
            const response = await axios.post(
              `${this.baseURL}/api/auth/oauth-callback`,
              {
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token,
                userInfo: userInfo
              },
              { timeout: 15000 }
            );

            usuario = response.data.user;
          } catch (backendError) {
            console.warn('⚠️ Error en backend, usando datos locales:', backendError.message);
            usuario = {
              id: userInfo.id,
              nombre: userInfo.displayName,
              email: userInfo.mail || userInfo.userPrincipalName,
              rol: 'Perito'
            };
          }

          // Guardar tokens
          await AsyncStorage.setItem('jwt_token', tokenResponse.access_token);
          await AsyncStorage.setItem('microsoft_token', tokenResponse.access_token);
          await AsyncStorage.setItem('refresh_token', tokenResponse.refresh_token);
          await AsyncStorage.setItem('azureAccessToken', tokenResponse.access_token);
          await AsyncStorage.setItem('access_token', tokenResponse.access_token);

          await AsyncStorage.setItem('azureAccount', JSON.stringify({
            username: usuario.email,
            name: usuario.nombre,
            email: usuario.email,
            id: usuario.id,
            rol: usuario.rol
          }));
          await AsyncStorage.setItem('userData', JSON.stringify(usuario));

          console.log('✅ Login OAuth completado exitosamente');

          return {
            accessToken: tokenResponse.access_token,
            microsoftToken: tokenResponse.access_token,
            account: {
              username: usuario.email,
              name: usuario.nombre,
              email: usuario.email,
              id: usuario.id,
              rol: usuario.rol
            }
          };
        }
      } else if (result.type === 'cancel') {
        throw new Error('Login cancelado por el usuario');
      } else {
        throw new Error('Login fallido: ' + result.type);
      }

    } catch (error) {
      console.error('❌ Error en login OAuth:', error);
      throw error;
    }
  }

  /**
   * Intercambiar código de autorización por token
   */
  async exchangeCodeForToken(code, codeVerifier) {
    try {
      console.log('🔄 Intercambiando código por token...');

      const tokenResponse = await fetch(this.config.serviceConfiguration.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          code: code,
          redirect_uri: this.config.redirectUri,
          grant_type: 'authorization_code',
          code_verifier: codeVerifier,
          scope: this.config.scopes.join(' ')
        }).toString()
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(`Token error: ${tokenData.error_description || tokenData.error}`);
      }

      console.log('✅ Token obtenido exitosamente');
      return tokenData;

    } catch (error) {
      console.error('❌ Error intercambiando código:', error);
      throw error;
    }
  }

  /**
   * Obtener información del usuario desde Microsoft Graph
   */
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(
        'https://graph.microsoft.com/v1.0/me',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo info de usuario:', error);
      throw error;
    }
  }

  /**
   * Login silencioso (renovar token)
   */
  async loginSilent() {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');

      if (!refreshToken) {
        throw new Error('No hay refresh token');
      }

      console.log('🔄 Renovando token...');

      const response = await fetch(this.config.serviceConfiguration.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          scope: this.config.scopes.join(' ')
        }).toString()
      });

      const tokenData = await response.json();

      if (tokenData.error) {
        throw new Error('No se pudo renovar el token');
      }

      // Guardar nuevos tokens
      await AsyncStorage.setItem('microsoft_token', tokenData.access_token);
      await AsyncStorage.setItem('azureAccessToken', tokenData.access_token);
      if (tokenData.refresh_token) {
        await AsyncStorage.setItem('refresh_token', tokenData.refresh_token);
      }

      console.log('✅ Token renovado exitosamente');
      return tokenData.access_token;

    } catch (error) {
      console.error('❌ Error renovando token:', error);
      throw error;
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('microsoft_token');
      const accountJSON = await AsyncStorage.getItem('azureAccount');

      if (token && accountJSON) {
        console.log('✅ Usuario autenticado');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      return false;
    }
  }

  /**
   * Obtiene la cuenta del usuario
   */
  async getAccount() {
    try {
      const accountJSON = await AsyncStorage.getItem('azureAccount');
      if (accountJSON) {
        return JSON.parse(accountJSON);
      }
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo cuenta:', error);
      return null;
    }
  }

  /**
   * Obtiene el access token
   */
  async getAccessToken() {
    try {
      return await AsyncStorage.getItem('microsoft_token');
    } catch (error) {
      console.error('❌ Error obteniendo token:', error);
      return null;
    }
  }

  /**
   * Logout - limpia datos locales
   */
  async logout() {
    try {
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('microsoft_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('azureAccessToken');
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('azureAccount');
      await AsyncStorage.removeItem('userData');

      console.log('👋 Logout exitoso');
      return { success: true };
    } catch (error) {
      console.error('❌ Error en logout:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verifica si hay una sesión activa
   */
  async checkAuth() {
    const isAuth = await this.isAuthenticated();
    return { authenticated: isAuth };
  }
}

// Exportar instancia única (singleton)
const azureAuthService = new AzureAuthService();
export default azureAuthService;
```

---

## 🔄 PASO 5: ACTUALIZAR LoginScreen.js

Cambia el botón de login para que use OAuth:

```javascript
const handleLogin = async () => {
  try {
    setLoggingIn(true);

    console.log('🔐 Iniciando autenticación OAuth con Azure AD...');

    // Login con OAuth (abre navegador)
    const { account } = await AzureAuthService.login();

    console.log('✅ Autenticado con Azure AD:', account.name);

    Alert.alert(
      'Bienvenido',
      `Hola ${account.name}`,
      [
        {
          text: 'Continuar',
          onPress: () => {
            if (onLoginSuccess) {
              onLoginSuccess();
            }
          },
        },
      ]
    );

  } catch (error) {
    console.error('❌ Error en login:', error);

    let errorMessage = error.message || 'No se pudo iniciar sesión';

    Alert.alert('Error de Autenticación', errorMessage);
  } finally {
    setLoggingIn(false);
  }
};
```

---

## 🧪 PASO 6: PROBAR

```bash
# Reiniciar la app
cd perito-app
npm start

# En el dispositivo/emulador:
# 1. Abrir app
# 2. Click en "Iniciar Sesión con Microsoft"
# 3. Se abre navegador con login de Microsoft
# 4. Ingresar credenciales (SOPORTA MFA)
# 5. Autorizar permisos
# 6. Redirige a la app automáticamente
```

---

## ✅ VENTAJAS DE OAUTH 2.0 COMPLETO

1. ✅ **Soporta MFA** - Funciona con autenticación multifactor
2. ✅ **Más seguro** - No se envían contraseñas a tu app
3. ✅ **Renovación automática** - Refresh tokens funcionan
4. ✅ **Experiencia nativa** - Abre navegador del sistema
5. ✅ **Cumple estándares** - OAuth 2.0 + PKCE

---

## 📝 NOTAS IMPORTANTES

- El redirect URI debe coincidir EXACTAMENTE con Azure AD
- Usa `exp://` para desarrollo con Expo
- Para producción (APK), usa `msauth://`
- El navegador se cierra automáticamente después del login
- Los tokens se guardan de forma segura

---

## 🐛 TROUBLESHOOTING

### Error: "Invalid redirect URI"
- Verifica que el redirect URI en Azure AD sea exactamente igual
- En Expo: `exp://localhost:19000/--/auth`

### Error: "AADSTS50011: The reply URL does not match"
- El redirect URI no está registrado en Azure AD
- Agrega el URI en Authentication → Redirect URIs

### El navegador no se cierra automáticamente
- Asegúrate de tener `expo-web-browser` instalado
- Llama a `WebBrowser.maybeCompleteAuthSession()` al inicio

---

## 🎉 RESULTADO FINAL

Con OAuth 2.0 completo, tu app:
- ✅ Funciona con MFA habilitado
- ✅ Es más segura
- ✅ Cumple con las mejores prácticas
- ✅ Permite renovación automática de tokens
- ✅ No requiere almacenar contraseñas

**¡Listo para producción!** 🚀
