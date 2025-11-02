/**
 * App.js - Versión Simplificada para Debug
 * Perito App - Observatorio Inmobiliario
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importaciones básicas sin servicios complejos
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createStackNavigator();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 App iniciado - Versión Simplificada');
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🔍 Verificando autenticación...');
      
      // Verificación simple de token
      const token = await AsyncStorage.getItem('authToken');
      console.log('Token encontrado:', !!token);
      
      if (token) {
        setIsAuthenticated(true);
        console.log('✅ Usuario autenticado');
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
        <Text style={styles.loadingText}>🔄 Cargando Perito App...</Text>
        <Text style={styles.loadingSubtext}>Versión Simplificada</Text>
      </View>
    );
  }

  console.log('🎯 Renderizando navegación, autenticado:', isAuthenticated);

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
            <Stack.Screen name="Home" component={HomeScreen} />
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