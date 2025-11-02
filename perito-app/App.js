/**
 * App.js - Microsoft Azure AD Integration
 * Perito App - Observatorio Inmobiliario
 */

import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AzureAuthService from './src/services/AzureAuthService';
import ApiService from './src/services/ApiService';

// Importaciones de pantallas
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import AsignacionesScreen from './src/screens/AsignacionesScreen';
import DetalleAsignacionScreen from './src/screens/DetalleAsignacionScreen';
import CameraScreen from './src/screens/CameraScreen';
import PhotoManagerScreen from './src/screens/PhotoManagerScreen';
import FormularioCampoScreen from './src/screens/FormularioCampoScreen';

const Stack = createStackNavigator();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 App iniciado - Microsoft Azure AD v2.0');
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🔍 Verificando autenticación con Microsoft Azure AD...');

      // Verificar autenticación con Azure AD
      const isAuth = await AzureAuthService.isAuthenticated();
      console.log('🔐 Token Azure AD encontrado:', isAuth);

      if (isAuth) {
        // Verificar token con backend
        try {
          await ApiService.getMe();
          setIsAuthenticated(true);
          console.log('✅ Usuario autenticado con Microsoft Azure AD');
        } catch (error) {
          console.log('⚠️ Token local encontrado pero inválido, requiere nuevo login');
          await AzureAuthService.logout();
        }
      } else {
        console.log('❌ Usuario no autenticado');
      }

    } catch (error) {
      console.error('❌ Error inicializando app:', error);
    } finally {
      console.log('✅ Inicialización completada');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.loadingText}>🔄 Cargando Perito App...</Text>
        <Text style={styles.loadingSubtext}>Azure Integration v2.0</Text>
      </View>
    );
  }

  console.log('🎯 Renderizando navegación, autenticado:', isAuthenticated);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#1D4ED8' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          {!isAuthenticated ? (
            <Stack.Screen
              name="Login"
              options={{ headerShown: false }}
            >
              {(props) => (
                <LoginScreen
                  {...props}
                  onLoginSuccess={() => setIsAuthenticated(true)}
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'Inicio' }}
              />
              <Stack.Screen
                name="Asignaciones"
                component={AsignacionesScreen}
                options={{ title: 'Mis Asignaciones' }}
              />
              <Stack.Screen
                name="DetalleAsignacion"
                component={DetalleAsignacionScreen}
                options={{ title: 'Detalle del Caso' }}
              />
              <Stack.Screen
                name="Camera"
                component={CameraScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="PhotoManager"
                component={PhotoManagerScreen}
                options={{ title: 'Gestión de Fotos' }}
              />
              <Stack.Screen
                name="FormularioCampo"
                component={FormularioCampoScreen}
                options={{ title: 'Formulario' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
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
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});

export default App;