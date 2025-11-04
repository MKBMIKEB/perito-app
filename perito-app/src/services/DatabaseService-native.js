/**
 * DatabaseService-native.js
 * Servicio de base de datos SQLite para almacenamiento offline
 * Perito App - Observatorio Inmobiliario
 */

import * as SQLite from 'expo-sqlite';

export class DatabaseService {
  static db = null;

  /**
   * Inicializar la base de datos SQLite
   */
  static async initialize() {
    try {
      console.log('📂 Inicializando base de datos SQLite...');

      // Abrir base de datos (se crea si no existe)
      this.db = await SQLite.openDatabaseAsync('perito_app.db');

      console.log('✅ Base de datos abierta correctamente');

      // Crear tablas
      await this.createTables();

      console.log('✅ Base de datos inicializada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
      throw error;
    }
  }

  /**
   * Crear todas las tablas necesarias
   */
  static async createTables() {
    try {
      console.log('📋 Creando tablas...');

      // Tabla de asignaciones (casos asignados al perito)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS asignaciones (
          id TEXT PRIMARY KEY,
          peritoId TEXT NOT NULL,
          direccion TEXT,
          municipio TEXT,
          tipo TEXT,
          estado TEXT DEFAULT 'pendiente',
          fechaLimite TEXT,
          prioridad TEXT,
          coordenadas TEXT,
          data TEXT,
          fechaCreacion TEXT DEFAULT CURRENT_TIMESTAMP,
          fechaActualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
          sincronizado INTEGER DEFAULT 1
        );
      `);

      // Tabla de formularios (datos de campo capturados)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS formularios (
          id TEXT PRIMARY KEY,
          asignacionId TEXT NOT NULL,
          peritoId TEXT NOT NULL,
          direccion TEXT,
          matricula TEXT,
          tipoPredio TEXT,
          propietario TEXT,
          telefono TEXT,
          areaTerreno REAL,
          areaConstruida REAL,
          frente REAL,
          fondo REAL,
          pisos INTEGER,
          habitaciones INTEGER,
          banos INTEGER,
          garajes INTEGER,
          estadoConservacion TEXT,
          servicios TEXT,
          coordenadas TEXT,
          observaciones TEXT,
          estado TEXT DEFAULT 'borrador',
          fechaCreacion TEXT DEFAULT CURRENT_TIMESTAMP,
          fechaActualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
          sincronizado INTEGER DEFAULT 0,
          FOREIGN KEY (asignacionId) REFERENCES asignaciones(id)
        );
      `);

      // Tabla de evidencias fotográficas
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS evidencias (
          id TEXT PRIMARY KEY,
          asignacionId TEXT NOT NULL,
          formularioId TEXT,
          peritoId TEXT NOT NULL,
          uri TEXT NOT NULL,
          tipo TEXT DEFAULT 'foto',
          descripcion TEXT,
          coordenadas TEXT,
          watermark TEXT,
          fechaCaptura TEXT DEFAULT CURRENT_TIMESTAMP,
          sincronizado INTEGER DEFAULT 0,
          oneDriveUrl TEXT,
          FOREIGN KEY (asignacionId) REFERENCES asignaciones(id),
          FOREIGN KEY (formularioId) REFERENCES formularios(id)
        );
      `);

      // Tabla de cola de sincronización
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tipo TEXT NOT NULL,
          tabla TEXT NOT NULL,
          registroId TEXT NOT NULL,
          accion TEXT NOT NULL,
          data TEXT NOT NULL,
          intentos INTEGER DEFAULT 0,
          ultimoIntento TEXT,
          fechaCreacion TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Índices para mejorar rendimiento
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_asignaciones_perito ON asignaciones(peritoId);
        CREATE INDEX IF NOT EXISTS idx_formularios_asignacion ON formularios(asignacionId);
        CREATE INDEX IF NOT EXISTS idx_evidencias_asignacion ON evidencias(asignacionId);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_tipo ON sync_queue(tipo, tabla);
      `);

      console.log('✅ Tablas creadas exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error creando tablas:', error);
      throw error;
    }
  }

  // ==================== ASIGNACIONES ====================

  /**
   * Obtener todas las asignaciones de un perito
   */
  static async getAsignaciones(peritoId) {
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM asignaciones WHERE peritoId = ? ORDER BY fechaCreacion DESC',
        [peritoId]
      );

      return result.map(row => ({
        ...row,
        coordenadas: row.coordenadas ? JSON.parse(row.coordenadas) : null,
        data: row.data ? JSON.parse(row.data) : null,
        sincronizado: row.sincronizado === 1
      }));
    } catch (error) {
      console.error('Error obteniendo asignaciones:', error);
      return [];
    }
  }

  /**
   * Guardar o actualizar una asignación
   */
  static async saveAsignacion(asignacion) {
    try {
      const exists = await this.db.getFirstAsync(
        'SELECT id FROM asignaciones WHERE id = ?',
        [asignacion.id]
      );

      const coordenadas = asignacion.coordenadas ? JSON.stringify(asignacion.coordenadas) : null;
      const data = asignacion.data ? JSON.stringify(asignacion.data) : JSON.stringify(asignacion);

      if (exists) {
        // Actualizar
        await this.db.runAsync(
          `UPDATE asignaciones SET
            direccion = ?, municipio = ?, tipo = ?, estado = ?,
            fechaLimite = ?, prioridad = ?, coordenadas = ?, data = ?,
            fechaActualizacion = CURRENT_TIMESTAMP, sincronizado = 1
          WHERE id = ?`,
          [
            asignacion.direccion, asignacion.municipio, asignacion.tipo,
            asignacion.estado, asignacion.fechaLimite, asignacion.prioridad,
            coordenadas, data, asignacion.id
          ]
        );
      } else {
        // Insertar
        await this.db.runAsync(
          `INSERT INTO asignaciones (id, peritoId, direccion, municipio, tipo, estado, fechaLimite, prioridad, coordenadas, data, sincronizado)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            asignacion.id, asignacion.peritoId || asignacion.perito_id,
            asignacion.direccion, asignacion.municipio, asignacion.tipo,
            asignacion.estado || 'pendiente', asignacion.fechaLimite,
            asignacion.prioridad || 'media', coordenadas, data
          ]
        );
      }

      console.log(`💾 Asignación ${asignacion.id} guardada en SQLite`);
      return true;
    } catch (error) {
      console.error('Error guardando asignación:', error);
      return false;
    }
  }

  // ==================== FORMULARIOS ====================

  /**
   * Guardar borrador de formulario
   */
  static async saveBorrador(formulario) {
    try {
      const exists = await this.db.getFirstAsync(
        'SELECT id FROM formularios WHERE asignacionId = ? AND estado = ?',
        [formulario.asignacionId, 'borrador']
      );

      const servicios = formulario.servicios ? JSON.stringify(formulario.servicios) : null;
      const coordenadas = formulario.coordenadas ? JSON.stringify(formulario.coordenadas) : null;

      if (exists) {
        // Actualizar borrador existente
        await this.db.runAsync(
          `UPDATE formularios SET
            direccion = ?, matricula = ?, tipoPredio = ?, propietario = ?, telefono = ?,
            areaTerreno = ?, areaConstruida = ?, frente = ?, fondo = ?, pisos = ?,
            habitaciones = ?, banos = ?, garajes = ?, estadoConservacion = ?,
            servicios = ?, coordenadas = ?, observaciones = ?,
            fechaActualizacion = CURRENT_TIMESTAMP
          WHERE id = ?`,
          [
            formulario.direccion, formulario.matricula, formulario.tipoPredio,
            formulario.propietario, formulario.telefono, formulario.areaTerreno,
            formulario.areaConstruida, formulario.frente, formulario.fondo,
            formulario.pisos, formulario.habitaciones, formulario.banos,
            formulario.garajes, formulario.estadoConservacion, servicios,
            coordenadas, formulario.observaciones, exists.id
          ]
        );
      } else {
        // Crear nuevo borrador
        const id = formulario.id || `FORM_${Date.now()}`;
        await this.db.runAsync(
          `INSERT INTO formularios (
            id, asignacionId, peritoId, direccion, matricula, tipoPredio,
            propietario, telefono, areaTerreno, areaConstruida, frente, fondo,
            pisos, habitaciones, banos, garajes, estadoConservacion,
            servicios, coordenadas, observaciones, estado, sincronizado
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'borrador', 0)`,
          [
            id, formulario.asignacionId, formulario.peritoId,
            formulario.direccion, formulario.matricula, formulario.tipoPredio,
            formulario.propietario, formulario.telefono, formulario.areaTerreno,
            formulario.areaConstruida, formulario.frente, formulario.fondo,
            formulario.pisos, formulario.habitaciones, formulario.banos,
            formulario.garajes, formulario.estadoConservacion, servicios,
            coordenadas, formulario.observaciones
          ]
        );
      }

      console.log(`💾 Borrador guardado para asignación ${formulario.asignacionId}`);
      return true;
    } catch (error) {
      console.error('Error guardando borrador:', error);
      return false;
    }
  }

  /**
   * Cargar borrador de formulario
   */
  static async loadBorrador(asignacionId) {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM formularios WHERE asignacionId = ? AND estado = ?',
        [asignacionId, 'borrador']
      );

      if (result) {
        return {
          ...result,
          servicios: result.servicios ? JSON.parse(result.servicios) : null,
          coordenadas: result.coordenadas ? JSON.parse(result.coordenadas) : null
        };
      }

      return null;
    } catch (error) {
      console.error('Error cargando borrador:', error);
      return null;
    }
  }

  /**
   * Guardar formulario completado
   */
  static async saveFormulario(formulario) {
    try {
      const id = formulario.id || `FORM_${Date.now()}`;
      const servicios = formulario.servicios ? JSON.stringify(formulario.servicios) : null;
      const coordenadas = formulario.coordenadas ? JSON.stringify(formulario.coordenadas) : null;

      // Eliminar borrador si existe
      await this.db.runAsync(
        'DELETE FROM formularios WHERE asignacionId = ? AND estado = ?',
        [formulario.asignacionId, 'borrador']
      );

      // Insertar formulario completado
      await this.db.runAsync(
        `INSERT INTO formularios (
          id, asignacionId, peritoId, direccion, matricula, tipoPredio,
          propietario, telefono, areaTerreno, areaConstruida, frente, fondo,
          pisos, habitaciones, banos, garajes, estadoConservacion,
          servicios, coordenadas, observaciones, estado, sincronizado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completado', 0)`,
        [
          id, formulario.asignacionId, formulario.peritoId,
          formulario.direccion, formulario.matricula, formulario.tipoPredio,
          formulario.propietario, formulario.telefono, formulario.areaTerreno,
          formulario.areaConstruida, formulario.frente, formulario.fondo,
          formulario.pisos, formulario.habitaciones, formulario.banos,
          formulario.garajes, formulario.estadoConservacion, servicios,
          coordenadas, formulario.observaciones
        ]
      );

      // Actualizar estado de la asignación
      await this.db.runAsync(
        'UPDATE asignaciones SET estado = ?, fechaActualizacion = CURRENT_TIMESTAMP WHERE id = ?',
        ['completado', formulario.asignacionId]
      );

      // Agregar a cola de sincronización
      await this.addToSyncQueue('formulario', 'formularios', id, 'insert', formulario);

      console.log(`💾 Formulario ${id} guardado y agregado a cola de sincronización`);
      return { success: true, id };
    } catch (error) {
      console.error('Error guardando formulario:', error);
      return { success: false, error };
    }
  }

  /**
   * Obtener formularios no sincronizados
   */
  static async getFormulariosPendientes() {
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM formularios WHERE sincronizado = 0'
      );

      return result.map(row => ({
        ...row,
        servicios: row.servicios ? JSON.parse(row.servicios) : null,
        coordenadas: row.coordenadas ? JSON.parse(row.coordenadas) : null
      }));
    } catch (error) {
      console.error('Error obteniendo formularios pendientes:', error);
      return [];
    }
  }

  /**
   * Marcar formulario como sincronizado
   */
  static async markFormularioSincronizado(id) {
    try {
      await this.db.runAsync(
        'UPDATE formularios SET sincronizado = 1, fechaActualizacion = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      console.log(`✅ Formulario ${id} marcado como sincronizado`);
      return true;
    } catch (error) {
      console.error('Error marcando formulario como sincronizado:', error);
      return false;
    }
  }

  // ==================== EVIDENCIAS ====================

  /**
   * Guardar evidencia fotográfica
   */
  static async saveEvidencia(evidencia) {
    try {
      const id = evidencia.id || `EVD_${Date.now()}`;
      const coordenadas = evidencia.coordenadas ? JSON.stringify(evidencia.coordenadas) : null;

      await this.db.runAsync(
        `INSERT INTO evidencias (
          id, asignacionId, formularioId, peritoId, uri, tipo,
          descripcion, coordenadas, watermark, sincronizado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          id, evidencia.asignacionId, evidencia.formularioId,
          evidencia.peritoId, evidencia.uri, evidencia.tipo || 'foto',
          evidencia.descripcion, coordenadas, evidencia.watermark
        ]
      );

      // Agregar a cola de sincronización
      await this.addToSyncQueue('evidencia', 'evidencias', id, 'insert', evidencia);

      console.log(`📸 Evidencia ${id} guardada`);
      return { success: true, id };
    } catch (error) {
      console.error('Error guardando evidencia:', error);
      return { success: false, error };
    }
  }

  /**
   * Obtener evidencias de una asignación
   */
  static async getEvidencias(asignacionId) {
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM evidencias WHERE asignacionId = ? ORDER BY fechaCaptura DESC',
        [asignacionId]
      );

      return result.map(row => ({
        ...row,
        coordenadas: row.coordenadas ? JSON.parse(row.coordenadas) : null,
        sincronizado: row.sincronizado === 1
      }));
    } catch (error) {
      console.error('Error obteniendo evidencias:', error);
      return [];
    }
  }

  /**
   * Marcar evidencia como sincronizada
   */
  static async markEvidenciaSincronizada(id, oneDriveUrl) {
    try {
      await this.db.runAsync(
        'UPDATE evidencias SET sincronizado = 1, oneDriveUrl = ? WHERE id = ?',
        [oneDriveUrl, id]
      );
      console.log(`✅ Evidencia ${id} sincronizada con OneDrive`);
      return true;
    } catch (error) {
      console.error('Error marcando evidencia como sincronizada:', error);
      return false;
    }
  }

  // ==================== COLA DE SINCRONIZACIÓN ====================

  /**
   * Agregar registro a la cola de sincronización
   */
  static async addToSyncQueue(tipo, tabla, registroId, accion, data) {
    try {
      await this.db.runAsync(
        `INSERT INTO sync_queue (tipo, tabla, registroId, accion, data)
        VALUES (?, ?, ?, ?, ?)`,
        [tipo, tabla, registroId, accion, JSON.stringify(data)]
      );
      console.log(`📤 Agregado a cola de sincronización: ${tipo} ${registroId}`);
      return true;
    } catch (error) {
      console.error('Error agregando a cola de sincronización:', error);
      return false;
    }
  }

  /**
   * Obtener registros pendientes de sincronización
   */
  static async getSyncQueue() {
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM sync_queue ORDER BY fechaCreacion ASC LIMIT 50'
      );

      return result.map(row => ({
        ...row,
        data: JSON.parse(row.data)
      }));
    } catch (error) {
      console.error('Error obteniendo cola de sincronización:', error);
      return [];
    }
  }

  /**
   * Eliminar de la cola de sincronización
   */
  static async removeFromSyncQueue(id) {
    try {
      await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
      console.log(`✅ Eliminado de cola de sincronización: ${id}`);
      return true;
    } catch (error) {
      console.error('Error eliminando de cola de sincronización:', error);
      return false;
    }
  }

  /**
   * Incrementar intentos de sincronización
   */
  static async incrementSyncAttempts(id) {
    try {
      await this.db.runAsync(
        'UPDATE sync_queue SET intentos = intentos + 1, ultimoIntento = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      console.error('Error incrementando intentos:', error);
      return false;
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Limpiar datos antiguos
   */
  static async cleanOldData(diasAntiguedad = 90) {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
      const fechaLimiteStr = fechaLimite.toISOString();

      // Eliminar asignaciones antiguas sincronizadas
      await this.db.runAsync(
        'DELETE FROM asignaciones WHERE sincronizado = 1 AND fechaActualizacion < ?',
        [fechaLimiteStr]
      );

      // Eliminar formularios antiguos sincronizados
      await this.db.runAsync(
        'DELETE FROM formularios WHERE sincronizado = 1 AND fechaActualizacion < ?',
        [fechaLimiteStr]
      );

      // Eliminar evidencias antiguas sincronizadas
      await this.db.runAsync(
        'DELETE FROM evidencias WHERE sincronizado = 1 AND fechaCaptura < ?',
        [fechaLimiteStr]
      );

      console.log(`🧹 Datos antiguos (>${diasAntiguedad} días) eliminados`);
      return true;
    } catch (error) {
      console.error('Error limpiando datos antiguos:', error);
      return false;
    }
  }

  /**
   * Obtener estadísticas de la base de datos
   */
  static async getStats() {
    try {
      const asignaciones = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM asignaciones');
      const formularios = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM formularios');
      const evidencias = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM evidencias');
      const syncQueue = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM sync_queue');

      const pendientes = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM formularios WHERE sincronizado = 0'
      );

      return {
        asignaciones: asignaciones.count,
        formularios: formularios.count,
        evidencias: evidencias.count,
        pendientesSincronizacion: syncQueue.count,
        formulariosPendientes: pendientes.count
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }
}

export default DatabaseService;
