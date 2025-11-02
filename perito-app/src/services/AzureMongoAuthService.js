/**
 * Azure MongoDB Auth Service
 * Autenticación usando Azure Cosmos DB for MongoDB (vCore)
 */

import { MongoClient } from 'mongodb';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { azureConfig } from '../config/azureConfig';

class AzureMongoAuthService {
  constructor() {
    this.client = null;
    this.db = null;
    this.peritosCollection = null;
    this.initialized = false;
  }

  /**
   * Inicializa conexión con MongoDB
   */
  async initialize() {
    if (this.initialized) return;

    try {
      this.client = new MongoClient(azureConfig.mongodb.connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ssl: azureConfig.mongodb.options.ssl
      });

      await this.client.connect();
      this.db = this.client.db(azureConfig.mongodb.database);
      this.peritosCollection = this.db.collection(azureConfig.mongodb.collections.peritos);

      this.initialized = true;
      console.log('✅ Azure MongoDB Auth Service inicializado');
    } catch (error) {
      console.error('❌ Error inicializando Auth Service:', error);
      throw error;
    }
  }

  /**
   * Login de perito con cédula y contraseña
   */
  async login(cedula, password) {
    await this.initialize();

    try {
      console.log('🔐 Intentando login con cédula:', cedula);

      // Buscar perito por cédula
      const perito = await this.peritosCollection.findOne({ cedula: cedula });

      if (!perito) {
        console.log('❌ Cédula no registrada');
        return {
          success: false,
          error: 'Cédula no registrada'
        };
      }

      // Verificar contraseña (en producción, usar bcrypt)
      if (perito.password !== password) {
        console.log('❌ Contraseña incorrecta');
        return {
          success: false,
          error: 'Contraseña incorrecta'
        };
      }

      // Verificar que el perito esté activo
      if (perito.estado !== 'activo') {
        console.log('❌ Perito inactivo');
        return {
          success: false,
          error: 'Usuario inactivo. Contacte al coordinador'
        };
      }

      // Generar token simple (en producción, usar JWT)
      const token = this.generateToken(perito._id.toString());

      // Guardar datos del perito localmente
      await this.storePerito(perito, token);

      console.log('✅ Login exitoso:', perito.nombre);

      return {
        success: true,
        perito: {
          peritoId: perito._id.toString(),
          nombre: perito.nombre,
          cedula: perito.cedula,
          email: perito.email,
          telefono: perito.telefono,
          especialidad: perito.especialidad
        },
        token
      };

    } catch (error) {
      console.error('❌ Error en login:', error);
      return {
        success: false,
        error: 'Error de conexión. Verifique su internet'
      };
    }
  }

  /**
   * Logout - limpia datos locales
   */
  async logout() {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('peritoData');
      console.log('👋 Logout exitoso');
      return { success: true };
    } catch (error) {
      console.error('❌ Error en logout:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene el perito almacenado localmente
   */
  async getStoredPerito() {
    try {
      const peritoJSON = await AsyncStorage.getItem('peritoData');
      if (peritoJSON) {
        return JSON.parse(peritoJSON);
      }
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo perito almacenado:', error);
      return null;
    }
  }

  /**
   * Verifica si hay una sesión activa
   */
  async checkAuth() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const perito = await this.getStoredPerito();

      if (token && perito) {
        console.log('✅ Sesión activa:', perito.nombre);
        return { authenticated: true, perito };
      }

      return { authenticated: false };
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      return { authenticated: false };
    }
  }

  /**
   * Almacena datos del perito localmente
   */
  async storePerito(perito, token) {
    try {
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('peritoData', JSON.stringify({
        peritoId: perito._id.toString(),
        nombre: perito.nombre,
        cedula: perito.cedula,
        email: perito.email,
        telefono: perito.telefono,
        especialidad: perito.especialidad
      }));
      console.log('💾 Datos del perito almacenados localmente');
    } catch (error) {
      console.error('❌ Error almacenando datos:', error);
    }
  }

  /**
   * Genera token simple (en producción, usar JWT)
   */
  generateToken(peritoId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${peritoId}_${timestamp}_${random}`;
  }

  /**
   * Actualiza datos del perito en MongoDB
   */
  async updatePerito(peritoId, updates) {
    await this.initialize();

    try {
      const result = await this.peritosCollection.updateOne(
        { _id: peritoId },
        {
          $set: {
            ...updates,
            fechaActualizacion: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Perito no encontrado');
      }

      console.log('✅ Perito actualizado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error actualizando perito:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cambia contraseña del perito
   */
  async changePassword(peritoId, oldPassword, newPassword) {
    await this.initialize();

    try {
      const perito = await this.peritosCollection.findOne({ _id: peritoId });

      if (!perito) {
        throw new Error('Perito no encontrado');
      }

      if (perito.password !== oldPassword) {
        return { success: false, error: 'Contraseña actual incorrecta' };
      }

      await this.peritosCollection.updateOne(
        { _id: peritoId },
        {
          $set: {
            password: newPassword, // En producción, hashear con bcrypt
            fechaActualizacion: new Date()
          }
        }
      );

      console.log('✅ Contraseña actualizada');
      return { success: true };
    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cierra la conexión
   */
  async close() {
    try {
      if (this.client) {
        await this.client.close();
        this.initialized = false;
      }
    } catch (error) {
      console.error('❌ Error cerrando conexión:', error);
    }
  }
}

// Exportar instancia única (singleton)
const azureMongoAuthService = new AzureMongoAuthService();
export default azureMongoAuthService;
