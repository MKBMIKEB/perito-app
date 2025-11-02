/**
 * SyncService.js
 * Servicio de sincronización con el servidor
 */

import NetInfo from '@react-native-community/netinfo';
import { AuthService } from './AuthService';
import { DatabaseService } from './DatabaseService';

export class SyncService {
  static async syncAsignaciones() {
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      throw new Error('Sin conexión a internet');
    }

    try {
      const token = await AuthService.getStoredToken();
      const perito = await AuthService.getStoredPerito();

      const response = await fetch(`${AuthService.BASE_URL}/peritos/${perito.id}/asignaciones`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const asignaciones = await response.json();

      for (const asignacion of asignaciones) {
        await DatabaseService.saveAsignacion(asignacion);
      }

      return { success: true, count: asignaciones.length };
    } catch (error) {
      throw new Error('Error sincronizando asignaciones: ' + error.message);
    }
  }

  static async syncTrabajoCampo() {
    // TODO: Implementar sincronización de trabajo de campo
    console.log('Sincronizando trabajo de campo...');
  }
}