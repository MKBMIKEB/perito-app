/**
 * App.js - Microsoft Azure AD Integration
 * Perito App - Observatorio Inmobiliario
 */

import { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, MD3LightTheme as PaperLightTheme } from 'react-native-paper';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AzureAuthService from './src/services/AzureAuthService';
import ApiService from './src/services/ApiService';
import { SyncService } from './src/services/SyncService';
import { DatabaseService } from './src/services/DatabaseService-native';
import { COLORS } from './src/constants';

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
      // 🔥 RESET TEMPORAL: Borrar caché de sesión anterior (COMENTAR DESPUÉS)
      console.log('🔥 RESET: Borrando sesión anterior...');
      await AsyncStorage.multiRemove([
        'azureAccessToken',
        'azureAccount',
        'userData',
        'microsoft_token',
        'refresh_token',
        'jwt_token',
        'access_token'
      ]);
      console.log('✅ Sesión anterior borrada');
      // 🔥 FIN RESET TEMPORAL

      console.log('🔐 Iniciando app - Verificando autenticación...');

      // Verificar si hay sesión guardada
      const authResult = await AzureAuthService.checkAuth();

      if (authResult.authenticated) {
        console.log('✅ Sesión existente encontrada');

        // Inicializar base de datos SQLite
        try {
          await DatabaseService.initialize();
          console.log('✅ Base de datos SQLite inicializada');
        } catch (dbError) {
          console.error('⚠️ Error inicializando base de datos:', dbError);
        }

        // Obtener datos del usuario
        const account = await AzureAuthService.getAccount();
        if (account && account.id) {
          // Inicializar servicio de sincronización con ID real
          try {
            await SyncService.initialize(account.id);
            console.log('✅ Servicio de sincronización iniciado para:', account.name);
          } catch (syncError) {
            console.error('⚠️ Error inicializando sincronización:', syncError);
          }
        }

        setIsAuthenticated(true);
        console.log('✅ Usuario autenticado correctamente');
      } else {
        console.log('⚠️ No hay sesión activa - Mostrando login');
        setIsAuthenticated(false);
      }

    } catch (error) {
      console.error('❌ Error inicializando app:', error);
      setIsAuthenticated(false); // Mostrar login si hay error
    } finally {
      console.log('✅ Inicialización completada');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.icon} />
        <Text style={styles.loadingText}>🔄 Cargando Perito App...</Text>
        <Text style={styles.loadingSubtext}>Azure Integration v2.0</Text>
      </View>
    );
  }

  console.log('🎯 Renderizando navegación, autenticado:', isAuthenticated);

  const paperTheme = {
    ...PaperLightTheme,
    colors: {
      ...PaperLightTheme.colors,
      primary: COLORS.primary,
      secondary: COLORS.secondary,
      background: COLORS.background,
      surface: COLORS.surface,
      text: COLORS.text,
      outline: COLORS.border,
    },
  };

  const navTheme = {
    ...NavigationDefaultTheme,
    colors: {
      ...NavigationDefaultTheme.colors,
      primary: COLORS.primary,
      background: COLORS.background,
      card: COLORS.surface,
      text: COLORS.text,
      border: COLORS.border,
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: COLORS.white,
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
                options={{ headerShown: false }}
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
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  loadingSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});

export default App;
