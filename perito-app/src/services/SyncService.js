/**
 * SyncService.js
 * Servicio avanzado de sincronización automática con el servidor
 * - Detecta cambios en conectividad
 * - Sincroniza automáticamente cuando hay conexión
 * - Gestiona cola de sincronización
 */

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService } from './DatabaseService-native';
import axios from 'axios';
import { PERITO_CONFIG } from '../config/peritoConfig';
import * as FileSystem from 'expo-file-system';

export class SyncService {
  static isSyncing = false;
  static syncInterval = null;
  static isOnline = false;
  static baseURL = PERITO_CONFIG.API_BASE_URL || 'http://localhost:3000/api';
  static peritoId = null;
  static netInfoUnsubscribe = null;

  /**
   * Inicializar el servicio de sincronización automática
   */
  static async initialize(peritoId) {
    try {
      this.peritoId = peritoId;
      console.log('🔄 SyncService inicializado para perito:', peritoId);

      // Monitorear cambios en la conectividad
      this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected && state.isInternetReachable;

        console.log(`📡 Conectividad: ${this.isOnline ? 'Online ✅' : 'Offline ⚠️'}`);

        // Si recuperamos conexión, sincronizar automáticamente
        if (!wasOnline && this.isOnline) {
          console.log('✅ Conexión recuperada, iniciando sincronización automática...');
          setTimeout(() => {
            this.syncAll();
          }, 3000); // Esperar 3 segundos para estabilizar conexión
        }
      });

      // Verificar estado inicial de conectividad
      const netInfoState = await NetInfo.fetch();
      this.isOnline = netInfoState.isConnected && netInfoState.isInternetReachable;

      console.log(`📡 Estado inicial: ${this.isOnline ? 'Online ✅' : 'Offline ⚠️'}`);

      // Iniciar sincronización periódica
      this.startPeriodicSync();

      // Sincronizar inmediatamente si hay conexión
      if (this.isOnline) {
        setTimeout(() => {
          this.syncAll();
        }, 2000);
      }

      return true;
    } catch (error) {
      console.error('❌ Error inicializando SyncService:', error);
      return false;
    }
  }

  /**
   * Iniciar sincronización periódica cada 5 minutos
   */
  static startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        console.log('⏰ Sincronización periódica automática');
        this.syncAll();
      }
    }, 5 * 60 * 1000); // 5 minutos

    console.log('✅ Sincronización periódica activada (cada 5 min)');
  }

  /**
   * Detener sincronización periódica
   */
  static stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️  Sincronización periódica detenida');
    }
  }

  /**
   * Sincronizar todos los datos (completo)
   */
  static async syncAll() {
    if (this.isSyncing) {
      console.log('⚠️ Ya hay una sincronización en curso');
      return { success: false, message: 'Sincronización en curso' };
    }

    if (!this.isOnline) {
      console.log('⚠️ Sin conexión a internet');
      return { success: false, message: 'Sin conexión a internet' };
    }

    this.isSyncing = true;

    try {
      console.log('🔄 ========== SINCRONIZACIÓN COMPLETA INICIADA ==========');

      // 1. Descargar asignaciones actualizadas
      const downloadResult = await this.downloadAsignaciones();

      // 2. Subir datos pendientes
      const uploadResult = await this.uploadPendingData();

      this.isSyncing = false;

      console.log('✅ ========== SINCRONIZACIÓN COMPLETADA ==========\n');

      return {
        success: true,
        download: downloadResult,
        upload: uploadResult,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.isSyncing = false;
      console.error('❌ Error en sincronización:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Descargar asignaciones actualizadas del servidor
   */
  static async downloadAsignaciones() {
    try {
      console.log('📥 Descargando asignaciones...');

      const ultimaActualizacion = await AsyncStorage.getItem('ultima_actualizacion_asignaciones');
      const token = await AsyncStorage.getItem('access_token');

      const response = await axios.post(
        `${this.baseURL}/sync/asignaciones`,
        {
          peritoId: this.peritoId,
          ultimaActualizacion
        },
        {
          headers: {
            'Authorization': `Bearer ${token || 'fake-token-demo'}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.success) {
        const asignaciones = response.data.asignaciones;
        console.log(`📥 ${asignaciones.length} asignaciones recibidas`);

        // Guardar en base de datos local
        for (const asignacion of asignaciones) {
          await DatabaseService.saveAsignacion(asignacion);
        }

        await AsyncStorage.setItem('ultima_actualizacion_asignaciones', new Date().toISOString());

        return {
          success: true,
          descargadas: asignaciones.length
        };
      }

      return { success: false, descargadas: 0 };

    } catch (error) {
      console.error('❌ Error descargando asignaciones:', error.message);
      return { success: false, error: error.message, descargadas: 0 };
    }
  }

  /**
   * Subir datos pendientes al servidor
   */
  static async uploadPendingData() {
    try {
      console.log('📤 Subiendo datos pendientes...');

      // Obtener formularios pendientes
      const formularios = await DatabaseService.getFormulariosPendientes();

      // Obtener evidencias pendientes de la cola de sincronización
      const syncQueue = await DatabaseService.getSyncQueue();
      const evidenciasQueue = syncQueue.filter(e => e.tipo === 'evidencia');

      console.log(`📤 Pendientes: ${formularios.length} formularios, ${evidenciasQueue.length} evidencias`);

      if (formularios.length === 0 && evidenciasQueue.length === 0) {
        console.log('✅ No hay datos pendientes');
        return {
          success: true,
          formularios: { sincronizados: 0, fallidos: 0 },
          evidencias: { sincronizados: 0, fallidos: 0 }
        };
      }

      // Preparar evidencias con base64
      const evidencias = [];
      for (const item of evidenciasQueue) {
        try {
          const data = item.data;

          // Leer archivo y convertir a base64
          let base64 = null;
          if (data.uri) {
            try {
              base64 = await FileSystem.readAsStringAsync(data.uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
            } catch (readError) {
              console.warn(`⚠️ No se pudo leer archivo ${data.uri}:`, readError.message);
            }
          }

          evidencias.push({
            id: data.id,
            asignacionId: data.asignacionId,
            peritoId: data.peritoId,
            fileName: data.fileName || `foto_${Date.now()}.jpg`,
            base64: base64,
            coordenadas: data.coordenadas
          });
        } catch (error) {
          console.error(`❌ Error preparando evidencia ${item.id}:`, error.message);
        }
      }

      const jwtToken = await AsyncStorage.getItem('jwt_token') || await AsyncStorage.getItem('access_token');
      const microsoftToken = await AsyncStorage.getItem('microsoft_token');

      const payload = {
        peritoId: this.peritoId,
        formularios: formularios,
        evidencias: evidencias
      };

      console.log(`📤 Enviando al servidor: ${payload.formularios.length} formularios, ${payload.evidencias.length} evidencias`);

      // Enviar al servidor con ambos tokens
      const response = await axios.post(
        `${this.baseURL}/sync/datos`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${jwtToken || 'fake-token-demo'}`,
            'X-Microsoft-Token': microsoftToken || '',
            'Content-Type': 'application/json'
          },
          timeout: 120000 // 2 minutos
        }
      );

      if (response.data.success) {
        const resultado = response.data;

        console.log(`✅ Sincronizados: ${resultado.formularios.sincronizados} formularios, ${resultado.evidencias.sincronizados} evidencias`);

        // Marcar formularios como sincronizados
        for (const formulario of formularios) {
          await DatabaseService.markFormularioSincronizado(formulario.id);
        }

        // Remover evidencias de la cola
        for (const item of evidenciasQueue) {
          await DatabaseService.removeFromSyncQueue(item.id);
        }

        return resultado;
      }

      return {
        success: false,
        formularios: { sincronizados: 0, fallidos: formularios.length },
        evidencias: { sincronizados: 0, fallidos: evidencias.length }
      };

    } catch (error) {
      console.error('❌ Error subiendo datos:', error.message);
      return {
        success: false,
        error: error.message,
        formularios: { sincronizados: 0, fallidos: 0 },
        evidencias: { sincronizados: 0, fallidos: 0 }
      };
    }
  }

  /**
   * Sincronización manual forzada
   */
  static async forceSyncNow() {
    console.log('🔄 Sincronización MANUAL forzada por usuario');
    return await this.syncAll();
  }

  /**
   * Obtener estado de sincronización
   */
  static async getSyncStatus() {
    try {
      const formularios = await DatabaseService.getFormulariosPendientes();
      const syncQueue = await DatabaseService.getSyncQueue();
      const ultimaActualizacion = await AsyncStorage.getItem('ultima_actualizacion_asignaciones');

      return {
        isOnline: this.isOnline,
        isSyncing: this.isSyncing,
        pendientes: {
          formularios: formularios.length,
          evidencias: syncQueue.filter(e => e.tipo === 'evidencia').length,
          total: formularios.length + syncQueue.length
        },
        ultimaActualizacion: ultimaActualizacion
          ? new Date(ultimaActualizacion).toLocaleString()
          : 'Nunca'
      };
    } catch (error) {
      console.error('❌ Error obteniendo estado:', error);
      return null;
    }
  }

  /**
   * Sincronizar asignaciones (compatible con código anterior)
   */
  static async syncAsignaciones() {
    const result = await this.downloadAsignaciones();
    if (!result.success) {
      throw new Error(result.error || 'Error sincronizando asignaciones');
    }
    return { success: true, count: result.descargadas };
  }

  /**
   * Sincronizar trabajo de campo (compatible con código anterior)
   */
  static async syncTrabajoCampo() {
    return await this.uploadPendingData();
  }

  /**
   * Destruir servicio y liberar recursos
   */
  static destroy() {
    this.stopPeriodicSync();
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
    this.isSyncing = false;
    console.log('🔴 SyncService destruido');
  }
}
