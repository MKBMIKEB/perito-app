/**
 * DatabaseService-native.js
 * Servicio de base de datos SQLite nativo (reemplaza expo-sqlite)
 */

// Servicio de base de datos simplificado (mock) 
// En entorno Expo Go, SQLite nativo requiere configuración adicional

export class DatabaseService {
  static db = null;
  static data = {
    asignaciones: [],
    trabajo_campo: [],
    evidencias: []
  };

  static async initialize() {
    try {
      console.log('Inicializando base de datos (mock)...');
      
      // Mock de inicialización exitosa
      this.db = { connected: true };
      
      console.log('Base de datos inicializada correctamente (mock)');
      return Promise.resolve();
    } catch (error) {
      console.error('Error inicializando base de datos:', error);
      return Promise.resolve();
    }
  }

  static async createTables() {
    // Mock: Tablas ya "creadas" en memoria
    console.log('Tablas creadas exitosamente (mock)');
    return Promise.resolve();
  }

  static async getAsignaciones() {
    try {
      console.log('Mock: Obteniendo asignaciones');
      return this.data.asignaciones;
    } catch (error) {
      console.error('Error obteniendo asignaciones:', error);
      return [];
    }
  }

  static async saveAsignacion(asignacion) {
    try {
      // Mock: Guardar en memoria
      const index = this.data.asignaciones.findIndex(a => a.id === asignacion.id);
      if (index >= 0) {
        this.data.asignaciones[index] = asignacion;
      } else {
        this.data.asignaciones.push(asignacion);
      }
      
      console.log('Mock: Asignación guardada:', asignacion.id);
      return Promise.resolve();
    } catch (error) {
      console.error('Error guardando asignación:', error);
      return Promise.resolve();
    }
  }
}