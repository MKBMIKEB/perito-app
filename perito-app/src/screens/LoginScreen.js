/**
 * LoginScreen - Azure AD Authentication
 * Perito App - Observatorio Inmobiliario
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AzureAuthService from '../services/AzureAuthService';
import ApiService from '../services/ApiService';

const LoginScreen = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
   * Manejar login con email/password (ROPC - funciona en Expo Go)
   */
  const handleLogin = async () => {
    try {
      // Validar campos
      if (!email || !password) {
        Alert.alert('Campos requeridos', 'Por favor ingresa tu email y contraseña');
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Email inválido', 'Por favor ingresa un email válido');
        return;
      }

      setLoggingIn(true);

      console.log('🔐 Iniciando login con email/password...');

      // Login con email/password (ROPC)
      const result = await AzureAuthService.loginWithPassword(email, password);

      if (result.success) {
        console.log('✅ Autenticado:', result.account.name);

        // Mostrar mensaje de éxito
        Alert.alert(
          'Bienvenido',
          `Hola ${result.account.name}\n\n✅ Tokens de Microsoft obtenidos correctamente.`,
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
      }

    } catch (error) {
      console.error('❌ Error en login:', error);

      let errorMessage = error.message || 'No se pudo iniciar sesión. Por favor intenta nuevamente.';

      Alert.alert('Error de Autenticación', errorMessage);
    } finally {
      setLoggingIn(false);
    }
  };

  /**
   * Manejar login con OAuth 2.0 (para APK de desarrollo)
   */
  const handleOAuthLogin = async () => {
    try {
      setLoggingIn(true);

      console.log('🔐 Iniciando OAuth 2.0 con Azure AD...');

      // Login con OAuth 2.0 completo (abre navegador)
      const result = await AzureAuthService.loginWithOAuth();

      if (result.success) {
        console.log('✅ Autenticado con OAuth:', result.account.name);

        // Mostrar mensaje de éxito
        Alert.alert(
          'Bienvenido',
          `Hola ${result.account.name}\n\nHas iniciado sesión correctamente.`,
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
      }

    } catch (error) {
      console.error('❌ Error en login OAuth:', error);

      let errorMessage = error.message || 'No se pudo iniciar sesión. Por favor intenta nuevamente.';

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
          <ActivityIndicator size="large" color="#6B7280" />
          <Text style={styles.loadingText}>Verificando autenticación...</Text>
        </View>
      </View>
    );
  }

  /**
   * Pantalla de login
   */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          Inicia sesión con tu cuenta de Microsoft
        </Text>
      </View>

      {/* Formulario de Login */}
      <View style={styles.loginContainer}>
        {/* Campo Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email de Microsoft</Text>
          <TextInput
            style={styles.input}
            placeholder="ejemplo@ingenierialegal.com.co"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loggingIn}
          />
        </View>

        {/* Campo Contraseña */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu contraseña de Microsoft"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loggingIn}
          />
        </View>

        {/* Botón de Login */}
        <TouchableOpacity
          style={[styles.loginButton, loggingIn && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loggingIn}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.microsoftIcon}>🔐</Text>
            <Text style={styles.loginButtonText}>
              {loggingIn ? 'Autenticando...' : 'Iniciar Sesión'}
            </Text>
          </View>
        </TouchableOpacity>

        {loggingIn && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6B7280" style={styles.spinner} />
            <Text style={styles.loadingText}>
              Validando credenciales y obteniendo tokens...
            </Text>
          </View>
        )}

        {!loggingIn && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>✅ Login Verificado</Text>
            <Text style={styles.infoBoxText}>
              • Tokens reales de Microsoft Graph{'\n'}
              • Acceso a OneDrive para subir fotos{'\n'}
              • Funciona en Expo Go con cuenta sin MFA
            </Text>
          </View>
        )}

        <Text style={styles.helpText}>
          Usa una cuenta sin MFA habilitado
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Observatorio Inmobiliario</Text>
        <Text style={styles.versionText}>Versión 2.1.0 - ROPC Auth (Sin MFA)</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#000000',
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
    color: '#111111',
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
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  loginButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
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
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
    marginTop: 12,
    paddingHorizontal: 30,
  },
  infoBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
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
