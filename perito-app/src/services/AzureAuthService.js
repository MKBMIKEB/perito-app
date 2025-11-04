/**
 * Azure Auth Service - OAuth 2.0 completo con expo-auth-session
 * Soporta MFA y autenticación moderna
 * Compatible con Expo Go (modo demo) y APK de desarrollo (OAuth completo)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { PERITO_CONFIG } from '../config/peritoConfig';

// Importaciones opcionales para OAuth (solo funcionan en APK de desarrollo)
let AuthSession, WebBrowser;
let isOAuthAvailable = false;

try {
  AuthSession = require('expo-auth-session');
  WebBrowser = require('expo-web-browser');
  // Necesario para cerrar el navegador web después de la autenticación
  WebBrowser.maybeCompleteAuthSession();
  isOAuthAvailable = true;
  console.log('✅ Módulos OAuth disponibles - APK de desarrollo');
} catch (error) {
  console.warn('⚠️ Módulos OAuth no disponibles - Modo Expo Go');
  isOAuthAvailable = false;
}

class AzureAuthService {
  constructor() {
    this.initialized = false;
    this.baseURL = PERITO_CONFIG.API_BASE_URL || 'http://localhost:5000';

    // Configuración Azure AD
    this.tenantId = 'fd32daf0-141c-4cb5-a224-10255204f33d';
    this.clientId = 'c8256ffe-b0fc-406d-8832-736240ae5570';

    // Discovery document de Azure AD
    this.discovery = {
      authorizationEndpoint: `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize`,
      tokenEndpoint: `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
    };
  }

  /**
   * Inicializa el servicio
   */
  async initialize() {
    console.log('✅ Auth Service inicializado');
    this.initialized = true;
    return true;
  }

  /**
   * Login con email/password (ROPC - funciona sin MFA)
   * Ideal para testing en Expo Go con cuenta sin MFA
   */
  async loginWithPassword(email, password) {
    try {
      console.log('🔐 Autenticando con email/password (ROPC)');
      const endpoint = `${this.baseURL}/api/auth/login-mobile`;
      // Log seguro: no exponer contraseña ni tokens
      console.log('🌐 Request:', {
        method: 'POST',
        url: endpoint,
        baseURL: this.baseURL,
        hasAtSymbol: typeof email === 'string' ? email.includes('@') : false,
      });

      // Llamar al endpoint del backend que valida contra Azure AD
      const t0 = Date.now();
      const response = await axios.post(
        endpoint,
        {
          email: email,
          password: password
        },
        {
          timeout: 30000
        }
      );
      console.log('⏱️  Login móvil OK en', `${Date.now() - t0}ms`);

      if (response.data.success) {
        const { user, tokens } = response.data;

        console.log('✅ Login exitoso:', user.nombre, {
          jwt: Boolean(tokens?.jwt),
          microsoft: Boolean(tokens?.microsoft),
          refresh: Boolean(tokens?.refresh)
        });

        // Guardar tokens y usuario en AsyncStorage
        await AsyncStorage.setItem('jwt_token', tokens.jwt);
        await AsyncStorage.setItem('microsoft_token', tokens.microsoft);
        await AsyncStorage.setItem('refresh_token', tokens.refresh);
        await AsyncStorage.setItem('azureAccessToken', tokens.microsoft);
        await AsyncStorage.setItem('access_token', tokens.jwt);
        await AsyncStorage.setItem('azureAccount', JSON.stringify({
          username: user.email,
          name: user.nombre,
          email: user.email,
          id: user.id,
          rol: user.rol
        }));
        await AsyncStorage.setItem('userData', JSON.stringify(user));

        return {
          success: true,
          accessToken: tokens.jwt,
          microsoftToken: tokens.microsoft,
          account: {
            username: user.email,
            name: user.nombre,
            email: user.email,
            id: user.id,
            rol: user.rol
          }
        };
      }

      throw new Error('Login fallido');

    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;
      const serverMsg = data?.message || '';
      const details = data?.details || {};
      const rawDesc = details?.error_description || data?.details || serverMsg || error.message;
      const aadsts = details?.aadsts || ((rawDesc && (rawDesc.match(/AADSTS\d+/) || [])[0]) || null);
      console.error('❌ Error en login (ROPC):', {
        status,
        message: serverMsg || error.message,
        aadsts,
      });

      // Mensajes claros por casos comunes
      if (aadsts === 'AADSTS50076' || aadsts === 'AADSTS50079' || /MFA/i.test(serverMsg)) {
        throw new Error('Tu cuenta requiere MFA y este login no lo soporta. Usa OAuth (APK de desarrollo) o una cuenta sin MFA.');
      }

      if (aadsts === 'AADSTS65001') {
        throw new Error('Falta consentimiento de permisos en Azure AD. Pide a un administrador otorgar “Grant admin consent” para User.Read y Files.ReadWrite.');
      }

      if (status === 401) {
        throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
      } else if (status === 400) {
        throw new Error('Email o contraseña inválidos.');
      } else if (error.code === 'ECONNREFUSED' || (error.message || '').includes('Network Error')) {
        throw new Error('No se pudo conectar con el servidor. Verifica que esté corriendo en ' + this.baseURL);
      }

      throw new Error(serverMsg || data?.error || error.message || 'Error al iniciar sesión');
    }
  }

  /**
   * Login con OAuth 2.0 (soporta MFA)
   */
  async loginWithOAuth() {
    try {
      // Verificar si OAuth está disponible
      if (!isOAuthAvailable) {
        throw new Error('OAuth no disponible en Expo Go. Por favor genera un APK de desarrollo con: eas build --profile development --platform android');
      }

      console.log('🔐 Iniciando OAuth 2.0 flow...');

      // Configurar redirect URI
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'perito-app',
        path: 'auth'
      });

      console.log('📍 Redirect URI:', redirectUri);

      // Crear code verifier para PKCE
      const codeVerifier = AuthSession.generateCodeAsync();

      // Configurar la solicitud de autorización
      const authRequestConfig = {
        clientId: this.clientId,
        scopes: [
          'openid',
          'profile',
          'email',
          'offline_access',
          'https://graph.microsoft.com/User.Read',
          'https://graph.microsoft.com/Files.ReadWrite'
        ],
        redirectUri: redirectUri,
        usePKCE: true,
        codeChallenge: (await codeVerifier).codeChallenge,
        codeChallengeMethod: 'S256',
        responseType: AuthSession.ResponseType.Code,
        prompt: AuthSession.Prompt.SelectAccount,
      };

      const authRequest = new AuthSession.AuthRequest(authRequestConfig);

      // Abrir navegador para login
      const result = await authRequest.promptAsync(this.discovery);

      if (result.type === 'success') {
        const { code } = result.params;

        console.log('✅ Código de autorización obtenido');

        // Intercambiar código por tokens
        const tokens = await this.exchangeCodeForTokens(
          code,
          redirectUri,
          (await codeVerifier).codeVerifier
        );

        // Obtener información del usuario
        const userInfo = await this.getUserInfo(tokens.accessToken);

        // Registrar/actualizar usuario en backend
        const backendResponse = await this.registerWithBackend(tokens, userInfo);

        // Guardar todo en AsyncStorage
        await this.saveAuthData(tokens, userInfo, backendResponse);

        console.log('✅ Login OAuth completado exitosamente');

        return {
          success: true,
          accessToken: backendResponse.tokens.jwt,
          microsoftToken: tokens.accessToken,
          account: {
            username: userInfo.userPrincipalName,
            name: userInfo.displayName,
            email: userInfo.mail || userInfo.userPrincipalName,
            id: backendResponse.user.id,
            rol: backendResponse.user.rol
          }
        };
      } else if (result.type === 'cancel') {
        throw new Error('Login cancelado por el usuario');
      } else {
        throw new Error('Error en el proceso de autenticación');
      }

    } catch (error) {
      console.error('❌ Error en OAuth login:', error);
      throw error;
    }
  }

  /**
   * Intercambiar código de autorización por tokens
   */
  async exchangeCodeForTokens(code, redirectUri, codeVerifier) {
    try {
      const tokenResponse = await axios.post(
        this.discovery.tokenEndpoint,
        new URLSearchParams({
          client_id: this.clientId,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        accessToken: tokenResponse.data.access_token,
        refreshToken: tokenResponse.data.refresh_token,
        idToken: tokenResponse.data.id_token,
        expiresIn: tokenResponse.data.expires_in
      };

    } catch (error) {
      console.error('❌ Error intercambiando código:', error.response?.data || error);
      throw new Error('Error obteniendo tokens de Microsoft');
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
      throw new Error('Error obteniendo información del usuario');
    }
  }

  /**
   * Registrar usuario en backend
   */
  async registerWithBackend(tokens, userInfo) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/auth/oauth-callback`,
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          userInfo: userInfo
        },
        {
          timeout: 15000
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error registrando en backend:', error);
      throw new Error('Error comunicándose con el servidor');
    }
  }

  /**
   * Guardar datos de autenticación
   */
  async saveAuthData(tokens, userInfo, backendResponse) {
    try {
      await AsyncStorage.setItem('microsoft_token', tokens.accessToken);
      await AsyncStorage.setItem('refresh_token', tokens.refreshToken);
      await AsyncStorage.setItem('jwt_token', backendResponse.tokens.jwt);
      await AsyncStorage.setItem('azureAccessToken', tokens.accessToken);
      await AsyncStorage.setItem('access_token', backendResponse.tokens.jwt);

      const accountData = {
        username: userInfo.userPrincipalName,
        name: userInfo.displayName,
        email: userInfo.mail || userInfo.userPrincipalName,
        id: backendResponse.user.id,
        rol: backendResponse.user.rol
      };

      await AsyncStorage.setItem('azureAccount', JSON.stringify(accountData));
      await AsyncStorage.setItem('userData', JSON.stringify(backendResponse.user));

      console.log('✅ Datos de autenticación guardados');
    } catch (error) {
      console.error('❌ Error guardando datos:', error);
      throw error;
    }
  }

  /**
   * Login silencioso (renovar token usando refresh token)
   */
  async loginSilent() {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');

      if (!refreshToken) {
        throw new Error('No hay refresh token disponible');
      }

      console.log('🔄 Renovando token...');

      // Renovar token con Microsoft
      const tokenResponse = await axios.post(
        this.discovery.tokenEndpoint,
        new URLSearchParams({
          client_id: this.clientId,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          scope: 'openid profile email offline_access https://graph.microsoft.com/User.Read https://graph.microsoft.com/Files.ReadWrite'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const newTokens = {
        accessToken: tokenResponse.data.access_token,
        refreshToken: tokenResponse.data.refresh_token || refreshToken,
      };

      // Obtener info de usuario actualizada
      const userInfo = await this.getUserInfo(newTokens.accessToken);

      // Actualizar en backend
      const backendResponse = await this.registerWithBackend(newTokens, userInfo);

      // Guardar nuevos tokens
      await this.saveAuthData(newTokens, userInfo, backendResponse);

      console.log('✅ Token renovado exitosamente');

      return newTokens.accessToken;

    } catch (error) {
      console.error('❌ Error en login silencioso:', error);
      throw error;
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('azureAccessToken');
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
      return await AsyncStorage.getItem('azureAccessToken');
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
      await AsyncStorage.removeItem('azureAccessToken');
      await AsyncStorage.removeItem('azureAccount');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('microsoft_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('access_token');

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
