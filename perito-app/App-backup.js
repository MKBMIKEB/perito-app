/**
 * APP.JS - Navegación Principal
 * Perito App - Observatorio Inmobiliario
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, Text, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración Firebase (con manejo de errores)
try {
  require('./src/config/firebaseConfig');
  console.log('✅ Firebase configurado correctamente');
} catch (error) {
  console.error('❌ Error cargando Firebase:', error);
}

// Pantallas
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import AsignacionesScreen from './src/screens/AsignacionesScreen';
import DetalleAsignacionScreen from './src/screens/DetalleAsignacionScreen';
import FormularioCampoScreen from './src/screens/FormularioCampoScreen';
import MapaScreen from './src/screens/MapaScreen';
import CameraScreen from './src/screens/CameraScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import SincronizacionScreen from './src/screens/SincronizacionScreen';
import UpdateScreen from './src/screens/UpdateScreen';

// Servicios
import { AuthService } from './src/services/AuthService';
import { DatabaseService } from './src/services/DatabaseService-native';
import { NotificationService } from './src/services/NotificationService-native';
import { UpdateService } from './src/services/UpdateService';


// Las notificaciones se configuran ahora en NotificationService-native

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navegación por pestañas principales
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1D4ED8',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Asignaciones" component={AsignacionesScreen} />
      <Tab.Screen name="Mapa" component={MapaScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

// Componente de error fallback
function ErrorFallback({ error, resetError }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>❌ Error de Aplicación</Text>
      <Text style={styles.errorMessage}>{error?.message || 'Error desconocido'}</Text>
      <Text style={styles.errorDetails}>
        Por favor reinicia la aplicación o contacta soporte.
      </Text>
    </View>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('useEffect: App iniciado');
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Inicializando base de datos...');
      await DatabaseService.initialize();

      // TEMPORAL: Limpiar sesión para probar LoginScreen
      console.log('Limpiando sesión anterior...');
      await AuthService.logout();

      console.log('Verificando token...');
      const token = await AsyncStorage.getItem('authToken');
      console.log('Token obtenido:', token);

      if (token) {
        const isValid = await AuthService.validateToken(token);
        console.log('Token válido:', isValid);
        setIsAuthenticated(isValid);
      } else {
        console.log('No hay token');
      }

      console.log('Configurando notificaciones...');
      await NotificationService.configure();

      console.log('Iniciando servicio de actualizaciones...');
      try {
        UpdateService.startAutoUpdateCheck();
        console.log('✅ UpdateService iniciado correctamente');
      } catch (error) {
        console.error('❌ Error iniciando UpdateService:', error);
      }

    } catch (error) {
      console.error('Error inicializando app:', error);
      setHasError(true);
      setError(error);
    } finally {
      console.log('Finalizando inicialización');
      setIsLoading(false);
    }
  };

  // Manejo de errores
  if (hasError && error) {
    return <ErrorFallback error={error} />;
  }

  if (isLoading) {
    console.log('App está cargando...');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🔄 Cargando Perito App...</Text>
      </View>
    );
  }

  console.log('Renderizando navegación, autenticado:', isAuthenticated);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen 
                  {...props} 
                  onLoginSuccess={() => setIsAuthenticated(true)} 
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="DetalleAsignacion" component={DetalleAsignacionScreen} />
              <Stack.Screen name="FormularioCampo" component={FormularioCampoScreen} />
              <Stack.Screen name="Camera" component={CameraScreen} />
              <Stack.Screen name="Sincronizacion" component={SincronizacionScreen} />
              <Stack.Screen name="Updates" component={UpdateScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FEE2E2',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#B91C1C',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 18,
    color: '#1D4ED8',
    fontWeight: 'bold',
  },
});

export default App;