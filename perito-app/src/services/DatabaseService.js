/**
 * DatabaseService.js
 * Servicio de base de datos local SQLite
 */

import * as SQLite from 'expo-sqlite';

export class DatabaseService {
  static db = null;

  static async initialize() {
    this.db = SQLite.openDatabase('perito_app.db');
    
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Tabla de asignaciones
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS asignaciones (
            id TEXT PRIMARY KEY,
            direccion TEXT,
            municipio TEXT,
            tipo TEXT,
            estado TEXT DEFAULT 'pendiente',
            fecha_limite TEXT,
            prioridad TEXT,
            coordenadas TEXT,
            datos_servidor TEXT,
            sincronizado INTEGER DEFAULT 0,
            fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
          )`
        );

        // Tabla de trabajo de campo
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS trabajo_campo (
            id TEXT PRIMARY KEY,
            asignacion_id TEXT,
            fecha_inicio TEXT,
            fecha_completado TEXT,
            inspeccion TEXT,
            mediciones TEXT,
            analisis_entorno TEXT,
            evidencias TEXT,
            validaciones TEXT,
            sincronizado INTEGER DEFAULT 0,
            FOREIGN KEY (asignacion_id) REFERENCES asignaciones (id)
          )`
        );

        // Tabla de evidencias
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS evidencias (
            id TEXT PRIMARY KEY,
            trabajo_campo_id TEXT,
            tipo TEXT,
            archivo_local TEXT,
            archivo_servidor TEXT,
            descripcion TEXT,
            coordenadas TEXT,
            timestamp TEXT,
            sincronizado INTEGER DEFAULT 0,
            FOREIGN KEY (trabajo_campo_id) REFERENCES trabajo_campo (id)
          )`
        );

      }, reject, resolve);
    });
  }

  static async getAsignaciones() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM asignaciones ORDER BY fecha_limite ASC',
          [],
          (_, { rows }) => resolve(rows._array),
          reject
        );
      });
    });
  }

  static async saveAsignacion(asignacion) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO asignaciones 
           (id, direccion, municipio, tipo, estado, fecha_limite, prioridad, coordenadas, datos_servidor) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            asignacion.id,
            asignacion.direccion,
            asignacion.municipio,
            asignacion.tipo,
            asignacion.estado,
            asignacion.fechaLimite,
            asignacion.prioridad,
            JSON.stringify(asignacion.coordenadas),
            JSON.stringify(asignacion)
          ],
          resolve,
          reject
        );
      });
    });
  }
}