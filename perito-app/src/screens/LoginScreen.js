/**
 * LoginScreen - Azure AD Authentication
 * Perito App - Observatorio Inmobiliario
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AzureAuthService from '../services/AzureAuthService';
import ApiService from '../services/ApiService';

const LoginScreen = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  /**
   * Verificar si el usuario ya está autenticado
   */
  const checkAuthentication = async () => {
    try {
      setLoading(true);
      const isAuth = await AzureAuthService.isAuthenticated();

      if (isAuth) {
        console.log('✅ Usuario ya autenticado');

        // Verificar que el token sea válido en el backend
        try {
          await ApiService.getMe();

          // Token válido, navegar a Home
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            console.log('Usuario autenticado correctamente');
          }
        } catch (error) {
          // Token inválido o expirado, intentar renovar
          console.log('⚠️ Token expirado, intentando renovar...');
          try {
            await AzureAuthService.loginSilent();
            if (onLoginSuccess) {
              onLoginSuccess();
            }
          } catch (renewError) {
            console.log('❌ No se pudo renovar el token');
            // Usuario debe hacer login nuevamente
          }
        }
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar login con Azure AD
   */
  const handleLogin = async () => {
    try {
      setLoggingIn(true);

      console.log('🔐 Iniciando autenticación con Azure AD...');

      // 1. Login con Azure AD (abre navegador)
      const { accessToken, account } = await AzureAuthService.login();
      console.log('✅ Autenticado con Azure AD:', account.username);

      // 2. Enviar token al backend para validación
      console.log('📡 Validando token con backend...');
      const userData = await ApiService.login(accessToken);
      console.log('✅ Usuario autenticado en backend:', userData.user.displayName);

      // 3. Mostrar mensaje de éxito
      Alert.alert(
        'Bienvenido',
        `Hola ${userData.user.displayName}`,
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

      let errorMessage = 'No se pudo iniciar sesión. Por favor intenta nuevamente.';

      if (error.message) {
        if (error.message.includes('user_cancelled')) {
          errorMessage = 'Inicio de sesión cancelado';
        } else if (error.message.includes('network')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        }
      }

      Alert.alert('Error de Autenticación', errorMessage);
    } finally {
      setLoggingIn(false);
    }
  };

  /**
   * Pantalla de carga inicial
   */
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Verificando autenticación...</Text>
        </View>
      </View>
    );
  }

  /**
   * Pantalla de login
   */
  return (
    <View style={styles.container}>
      {/* Logo y Título */}
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>📱</Text>
        </View>
        <Text style={styles.title}>Perito Móvil</Text>
        <Text style={styles.subtitle}>Observatorio Inmobiliario</Text>
      </View>

      {/* Información */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Inicia sesión con tu cuenta de Microsoft para acceder a la aplicación
        </Text>
      </View>

      {/* Botón de Login con Microsoft */}
      <View style={styles.loginContainer}>
        <TouchableOpacity
          style={[styles.loginButton, loggingIn && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loggingIn}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.microsoftIcon}>🔐</Text>
            <Text style={styles.loginButtonText}>
              {loggingIn ? 'Iniciando sesión...' : 'Iniciar Sesión con Microsoft'}
            </Text>
          </View>
        </TouchableOpacity>

        {loggingIn && (
          <ActivityIndicator size="small" color="#1D4ED8" style={styles.spinner} />
        )}

        <Text style={styles.helpText}>
          Se abrirá una ventana del navegador para autenticarte de forma segura
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Observatorio Inmobiliario</Text>
        <Text style={styles.versionText}>Versión 2.0.0 - Azure Integration</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#1D4ED8',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 48,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D4ED8',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  infoContainer: {
    paddingHorizontal: 20,
    marginVertical: 30,
  },
  infoText: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  loginButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  microsoftIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spinner: {
    marginTop: 20,
  },
  helpText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  versionText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
});

export default LoginScreen;
