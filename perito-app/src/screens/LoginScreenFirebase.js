/**
 * LoginScreenFirebase
 * Pantalla de login con Firebase usando cédula y contraseña
 */

import { useState } from 'react';
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
import { AuthService } from '../services/AuthService';

const LoginScreenFirebase = ({ onLoginSuccess }) => {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!cedula.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa cédula y contraseña');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Intentando login con Firebase...');

      const result = await AuthService.login(cedula.trim(), password);

      if (result.success) {
        console.log('✅ Login exitoso:', result.data.perito.nombre);
        Alert.alert(
          'Bienvenido',
          `Hola ${result.data.perito.nombre}`,
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
      } else {
        console.log('❌ Login fallido:', result.error);
        Alert.alert('Error de Autenticación', result.error);
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

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

      {/* Formulario */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Iniciar Sesión</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Cédula</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu cédula"
            value={cedula}
            onChangeText={setCedula}
            keyboardType="numeric"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helpText}>
          Si no tienes acceso, contacta al coordinador
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Observatorio Inmobiliario</Text>
        <Text style={styles.versionText}>Versión 2.0.0 - Firebase</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
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
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  loginButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginTop: 16,
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

export default LoginScreenFirebase;
