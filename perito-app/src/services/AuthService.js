/**
 * AuthService.js
 * Servicio de autenticación con Firebase
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { db } from '../config/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

export class AuthService {
  static BASE_URL = __DEV__ 
    ? (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api')
    : 'https://your-production-api.com/api';

  // ...existing code...
static async login(cedula, password) {
  try {
    console.log('🔐 Intentando login con cédula:', cedula);

    if (!cedula || !password) {
      return { success: false, error: 'Credenciales incompletas' };
    }

    // Buscar perito en Firebase por cédula
    const peritosRef = collection(db, 'peritos');
    const q = query(peritosRef, where('cedula', '==', cedula));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ Perito no encontrado en Firebase');
      return { success: false, error: 'Cédula no registrada' };
    }

    // Obtener datos del perito
    const peritoDoc = querySnapshot.docs[0];
    const peritoData = peritoDoc.data();

    // Validar contraseña (en producción usa hash)
    if (peritoData.password !== password) {
      console.log('❌ Contraseña incorrecta');
      return { success: false, error: 'Contraseña incorrecta' };
    }

    // Verificar que el perito esté activo
    if (peritoData.activo === false) {
      console.log('❌ Perito desactivado');
      return { success: false, error: 'Usuario desactivado. Contacte al coordinador.' };
    }

    const peritoInfo = {
      peritoId: peritoDoc.id,
      cedula: peritoData.cedula,
      nombre: peritoData.nombre,
      telefono: peritoData.telefono,
      email: peritoData.email || '',
      especialidad: peritoData.especialidad,
      rol: 'perito_campo'
    };

    // Guardar token y datos del perito
    const token = 'firebase_token_' + Date.now();
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('peritoInfo', JSON.stringify(peritoInfo));

    console.log('✅ Login exitoso:', peritoInfo.nombre);
    return {
      success: true,
      data: {
        token: token,
        perito: peritoInfo
      }
    };
  } catch (error) {
    console.error('❌ Error en login:', error);
    return { success: false, error: 'Error de conexión con Firebase' };
  }
}

static async validateToken(token) {
  try {
    console.log('Mock validateToken:', token);
    
    // Mock: cualquier token que empiece con 'mock_token_' es válido
    if (token && token.startsWith('mock_token_')) {
      console.log('Mock token válido');
      return true;
    }
    
    console.log('Mock token inválido');
    return false;
  } catch (error) {
    console.error('Error validando token:', error);
    return false;
  }
}
// ...existing code...

  static async getStoredToken() {
    return await AsyncStorage.getItem('authToken');
  }

  static async getStoredPerito() {
    const peritoInfo = await AsyncStorage.getItem('peritoInfo');
    return peritoInfo ? JSON.parse(peritoInfo) : null;
  }

  static async logout() {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('peritoInfo');
      console.log('Sesión cerrada exitosamente');
      return { success: true };
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      return { success: false };
    }
  }
}