/**
 * API Service - Conexión con el backend Azure
 * Maneja todas las llamadas HTTP al backend Node.js + Express
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL del backend - CAMBIAR según el entorno
const API_URL = __DEV__
  ? 'http://10.58.230.72:5000/api'  // Desarrollo local - IP de la PC
  : 'https://perito-app-backend.azurewebsites.net/api'; // Producción en Azure

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar el token de autenticación
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('azureAccessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`📡 API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar errores de respuesta
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.config.url} - ${response.status}`);
        return response;
      },
      async (error) => {
        if (error.response) {
          console.error(`❌ API Error: ${error.response.status}`, error.response.data);

          // Si el token expiró (401), intentar renovar
          if (error.response.status === 401) {
            console.warn('⚠️  Token expirado - Se requiere nuevo login');
            await AsyncStorage.removeItem('azureAccessToken');
            // Aquí podrías disparar un evento para que la app redirija al login
          }
        } else {
          console.error('❌ Network error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // ========== AUTENTICACIÓN ==========

  /**
   * Login con Azure AD
   */
  async login(accessToken) {
    try {
      const response = await this.api.post('/auth/login', { accessToken });
      await AsyncStorage.setItem('azureAccessToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  /**
   * Obtener información del usuario actual
   */
  async getMe() {
    try {
      const response = await this.api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw error;
    }
  }

  // ========== CASOS ==========

  /**
   * Listar todos los casos
   */
  async getCasos(filtros = {}) {
    try {
      const params = new URLSearchParams(filtros).toString();
      const response = await this.api.get(`/casos?${params}`);
      return response.data.casos;
    } catch (error) {
      console.error('Error listando casos:', error);
      throw error;
    }
  }

  /**
   * Obtener detalles de un caso
   */
  async getCaso(casoId) {
    try {
      const response = await this.api.get(`/casos/${casoId}`);
      return response.data.caso;
    } catch (error) {
      console.error('Error obteniendo caso:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo caso
   */
  async createCaso(casoData) {
    try {
      const response = await this.api.post('/casos', casoData);
      return response.data.caso;
    } catch (error) {
      console.error('Error creando caso:', error);
      throw error;
    }
  }

  /**
   * Actualizar caso
   */
  async updateCaso(casoId, updates) {
    try {
      const response = await this.api.put(`/casos/${casoId}`, updates);
      return response.data.caso;
    } catch (error) {
      console.error('Error actualizando caso:', error);
      throw error;
    }
  }

  /**
   * Eliminar caso
   */
  async deleteCaso(casoId) {
    try {
      const response = await this.api.delete(`/casos/${casoId}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando caso:', error);
      throw error;
    }
  }

  /**
   * Obtener casos asignados a un perito
   */
  async getCasosByPerito(peritoId) {
    try {
      const response = await this.api.get(`/casos/perito/${peritoId}`);
      return response.data.casos;
    } catch (error) {
      console.error('Error obteniendo casos del perito:', error);
      throw error;
    }
  }

  // ========== ONEDRIVE ==========

  /**
   * Crear estructura de carpetas para un caso
   */
  async createCasoFolder(codigoCaso) {
    try {
      const response = await this.api.post('/onedrive/crear-carpeta', { codigoCaso });
      return response.data.estructura;
    } catch (error) {
      console.error('Error creando carpeta OneDrive:', error);
      throw error;
    }
  }

  /**
   * Listar archivos de un caso
   */
  async listCasoFiles(codigoCaso) {
    try {
      const response = await this.api.get(`/onedrive/listar/${codigoCaso}`);
      return response.data.archivos;
    } catch (error) {
      console.error('Error listando archivos:', error);
      throw error;
    }
  }

  // ========== UPLOAD ==========

  /**
   * Subir foto a OneDrive
   * @param {string} codigoCaso - Código del caso
   * @param {string} base64Image - Imagen en formato base64
   * @param {Object} metadata - Metadatos de la foto (fecha, ubicación, etc.)
   */
  async uploadFoto(codigoCaso, base64Image, metadata = {}) {
    try {
      const response = await this.api.post('/upload/foto', {
        codigoCaso,
        fotoBase64: base64Image,
        nombreArchivo: metadata.nombreArchivo || `foto_${Date.now()}.jpg`,
        metadata: {
          fechaCaptura: metadata.fechaCaptura || new Date().toISOString(),
          latitud: metadata.latitud,
          longitud: metadata.longitud,
          direccion: metadata.direccion,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error subiendo foto:', error);
      throw error;
    }
  }

  /**
   * Subir formulario a OneDrive
   */
  async uploadFormulario(codigoCaso, formularioData) {
    try {
      const response = await this.api.post('/upload/formulario', {
        codigoCaso,
        datos: formularioData,
      });
      return response.data;
    } catch (error) {
      console.error('Error subiendo formulario:', error);
      throw error;
    }
  }

  // ========== PERITOS ==========

  /**
   * Listar todos los peritos
   */
  async getPeritos() {
    try {
      const response = await this.api.get('/peritos');
      return response.data.peritos;
    } catch (error) {
      console.error('Error listando peritos:', error);
      throw error;
    }
  }

  /**
   * Obtener información de un perito
   */
  async getPerito(peritoId) {
    try {
      const response = await this.api.get(`/peritos/${peritoId}`);
      return response.data.perito;
    } catch (error) {
      console.error('Error obteniendo perito:', error);
      throw error;
    }
  }

  // ========== HEALTH CHECK ==========

  /**
   * Verificar estado del backend
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${API_URL.replace('/api', '')}/health`);
      return response.data;
    } catch (error) {
      console.error('Error en health check:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export default new ApiService();
