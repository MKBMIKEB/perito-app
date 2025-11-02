/**
 * Azure Auth Service with MSAL
 * Autenticación con Microsoft Azure AD
 */

import { PublicClientApplication } from 'react-native-msal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AZURE_CONFIG } from '../config/azureConfig';

class AzureAuthService {
  constructor() {
    this.msalInstance = null;
    this.initialized = false;
  }

  /**
   * Inicializa MSAL
   */
  async initialize() {
    if (this.initialized) return;

    try {
      this.msalInstance = await PublicClientApplication.createPublicClientApplication({
        clientId: AZURE_CONFIG.auth.clientId,
        authority: AZURE_CONFIG.auth.authority,
        redirectUri: AZURE_CONFIG.redirectUri,
      });

      this.initialized = true;
      console.log('✅ Azure MSAL inicializado');
    } catch (error) {
      console.error('❌ Error inicializando MSAL:', error);
      throw error;
    }
  }

  /**
   * Login interactivo con Azure AD
   */
  async login() {
    await this.initialize();

    try {
      console.log('🔐 Iniciando autenticación con Azure AD...');

      const result = await this.msalInstance.acquireToken({
        scopes: AZURE_CONFIG.scopes,
      });

      console.log('✅ Token adquirido:', result.account.username);

      // Guardar token y datos del usuario
      await AsyncStorage.setItem('azureAccessToken', result.accessToken);
      await AsyncStorage.setItem('azureAccount', JSON.stringify(result.account));

      return {
        accessToken: result.accessToken,
        account: result.account,
      };
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  }

  /**
   * Login silencioso (renovar token sin interacción)
   */
  async loginSilent() {
    await this.initialize();

    try {
      const accountJSON = await AsyncStorage.getItem('azureAccount');
      if (!accountJSON) {
        throw new Error('No hay cuenta guardada');
      }

      const account = JSON.parse(accountJSON);

      const result = await this.msalInstance.acquireTokenSilent({
        scopes: AZURE_CONFIG.scopes,
        account: account,
      });

      await AsyncStorage.setItem('azureAccessToken', result.accessToken);
      console.log('✅ Token renovado silenciosamente');

      return result.accessToken;
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
   * Logout - limpia datos locales y cierra sesión en MSAL
   */
  async logout() {
    try {
      await this.initialize();

      const accountJSON = await AsyncStorage.getItem('azureAccount');
      if (accountJSON) {
        const account = JSON.parse(accountJSON);
        await this.msalInstance.removeAccount(account);
      }

      await AsyncStorage.removeItem('azureAccessToken');
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
   * Verifica si hay una sesión activa (alias de checkAuth para compatibilidad)
   */
  async checkAuth() {
    const isAuth = await this.isAuthenticated();
    return { authenticated: isAuth };
  }
}

// Exportar instancia única (singleton)
const azureAuthService = new AzureAuthService();
export default azureAuthService;
