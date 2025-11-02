/**
 * Azure SQL Service
 * Conexión y operaciones con Azure SQL Database
 */

const sql = require('mssql');
const { DatabaseError } = require('../middlewares/errorHandler');

// Configuración de conexión
const sqlConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Azure requiere encrypt
    trustServerCertificate: false,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

class SQLService {
  constructor() {
    this.pool = null;
  }

  /**
   * Inicializa el pool de conexiones
   */
  async connect() {
    try {
      if (this.pool && this.pool.connected) {
        return this.pool;
      }

      console.log('🔌 Conectando a Azure SQL Database...');
      this.pool = await sql.connect(sqlConfig);
      console.log('✅ Conectado a Azure SQL Database');

      return this.pool;
    } catch (error) {
      console.error('❌ Error conectando a SQL:', error.message);
      throw new DatabaseError('No se pudo conectar a la base de datos', error);
    }
  }

  /**
   * Cierra el pool de conexiones
   */
  async disconnect() {
    try {
      if (this.pool) {
        await this.pool.close();
        console.log('👋 Conexión a SQL cerrada');
      }
    } catch (error) {
      console.error('❌ Error cerrando conexión:', error.message);
    }
  }

  // ========== OPERACIONES DE CASOS ==========

  /**
   * Crea un nuevo caso
   */
  async crearCaso(casoData) {
    try {
      const pool = await this.connect();
      const result = await pool.request()
        .input('codigo', sql.VarChar(50), casoData.codigo)
        .input('direccion', sql.VarChar(500), casoData.direccion)
        .input('ciudad', sql.VarChar(100), casoData.ciudad)
        .input('barrio', sql.VarChar(100), casoData.barrio)
        .input('tipoInmueble', sql.VarChar(50), casoData.tipoInmueble)
        .input('estado', sql.VarChar(50), casoData.estado || 'pendiente')
        .input('prioridad', sql.VarChar(20), casoData.prioridad || 'media')
        .input('peritoId', sql.VarChar(100), casoData.peritoId || null)
        .input('peritoNombre', sql.VarChar(200), casoData.peritoNombre || null)
        .input('coordinadorId', sql.VarChar(100), casoData.coordinadorId)
        .query(`
          INSERT INTO Casos (
            codigo, direccion, ciudad, barrio, tipoInmueble,
            estado, prioridad, peritoId, peritoNombre, coordinadorId,
            fechaCreacion, fechaActualizacion
          )
          VALUES (
            @codigo, @direccion, @ciudad, @barrio, @tipoInmueble,
            @estado, @prioridad, @peritoId, @peritoNombre, @coordinadorId,
            GETDATE(), GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS id;
        `);

      const casoId = result.recordset[0].id;
      console.log(`✅ Caso creado: ${casoData.codigo} (ID: ${casoId})`);

      return { id: casoId, ...casoData };
    } catch (error) {
      console.error('❌ Error creando caso:', error.message);
      throw new DatabaseError('Error creando caso', error);
    }
  }

  /**
   * Obtiene un caso por ID
   */
  async obtenerCasoPorId(casoId) {
    try {
      const pool = await this.connect();
      const result = await pool.request()
        .input('id', sql.Int, casoId)
        .query('SELECT * FROM Casos WHERE id = @id');

      if (result.recordset.length === 0) {
        return null;
      }

      return result.recordset[0];
    } catch (error) {
      console.error('❌ Error obteniendo caso:', error.message);
      throw new DatabaseError('Error obteniendo caso', error);
    }
  }

  /**
   * Obtiene un caso por código
   */
  async obtenerCasoPorCodigo(codigo) {
    try {
      const pool = await this.connect();
      const result = await pool.request()
        .input('codigo', sql.VarChar(50), codigo)
        .query('SELECT * FROM Casos WHERE codigo = @codigo');

      if (result.recordset.length === 0) {
        return null;
      }

      return result.recordset[0];
    } catch (error) {
      console.error('❌ Error obteniendo caso:', error.message);
      throw new DatabaseError('Error obteniendo caso', error);
    }
  }

  /**
   * Lista todos los casos (con filtros opcionales)
   */
  async listarCasos(filtros = {}) {
    try {
      const pool = await this.connect();
      let query = 'SELECT * FROM Casos WHERE 1=1';
      const request = pool.request();

      if (filtros.estado) {
        query += ' AND estado = @estado';
        request.input('estado', sql.VarChar(50), filtros.estado);
      }

      if (filtros.peritoId) {
        query += ' AND peritoId = @peritoId';
        request.input('peritoId', sql.VarChar(100), filtros.peritoId);
      }

      if (filtros.coordinadorId) {
        query += ' AND coordinadorId = @coordinadorId';
        request.input('coordinadorId', sql.VarChar(100), filtros.coordinadorId);
      }

      if (filtros.ciudad) {
        query += ' AND ciudad = @ciudad';
        request.input('ciudad', sql.VarChar(100), filtros.ciudad);
      }

      query += ' ORDER BY id DESC';

      const result = await request.query(query);

      console.log(`✅ ${result.recordset.length} casos encontrados`);
      return result.recordset;
    } catch (error) {
      console.error('❌ Error listando casos:', error.message);
      throw new DatabaseError('Error listando casos', error);
    }
  }

  /**
   * Actualiza un caso
   */
  async actualizarCaso(casoId, updates) {
    try {
      const pool = await this.connect();
      const request = pool.request();

      let query = 'UPDATE Casos SET ';
      const campos = [];

      // Agregar campos a actualizar dinámicamente
      Object.keys(updates).forEach(key => {
        if (key !== 'id') {
          campos.push(`${key} = @${key}`);
          request.input(key, updates[key]);
        }
      });

      query += campos.join(', ');
      query += ', fechaActualizacion = GETDATE() WHERE id = @id';
      request.input('id', sql.Int, casoId);

      const result = await request.query(query);

      console.log(`✅ Caso ${casoId} actualizado`);
      return { success: true, rowsAffected: result.rowsAffected[0] };
    } catch (error) {
      console.error('❌ Error actualizando caso:', error.message);
      throw new DatabaseError('Error actualizando caso', error);
    }
  }

  /**
   * Elimina un caso
   */
  async eliminarCaso(casoId) {
    try {
      const pool = await this.connect();
      const result = await pool.request()
        .input('id', sql.Int, casoId)
        .query('DELETE FROM Casos WHERE id = @id');

      console.log(`✅ Caso ${casoId} eliminado`);
      return { success: true, rowsAffected: result.rowsAffected[0] };
    } catch (error) {
      console.error('❌ Error eliminando caso:', error.message);
      throw new DatabaseError('Error eliminando caso', error);
    }
  }

  // ========== OPERACIONES DE ARCHIVOS ==========

  /**
   * Registra un archivo subido a OneDrive
   */
  async registrarArchivo(archivoData) {
    try {
      const pool = await this.connect();
      const result = await pool.request()
        .input('casoId', sql.Int, archivoData.casoId)
        .input('codigoCaso', sql.VarChar(50), archivoData.codigoCaso)
        .input('nombreArchivo', sql.VarChar(500), archivoData.nombreArchivo)
        .input('tipoArchivo', sql.VarChar(50), archivoData.tipoArchivo)
        .input('tamañoBytes', sql.BigInt, archivoData.tamañoBytes)
        .input('mimeType', sql.VarChar(100), archivoData.mimeType)
        .input('onedriveFileId', sql.VarChar(200), archivoData.onedriveFileId)
        .input('onedriveUrl', sql.VarChar(1000), archivoData.onedriveUrl)
        .input('onedriveUrlDescarga', sql.VarChar(1000), archivoData.onedriveUrlDescarga)
        .input('rutaOnedrive', sql.VarChar(1000), archivoData.rutaOnedrive)
        .input('usuarioId', sql.VarChar(100), archivoData.usuarioId)
        .input('usuarioNombre', sql.VarChar(200), archivoData.usuarioNombre)
        .input('latitud', sql.Decimal(10, 8), archivoData.latitud || null)
        .input('longitud', sql.Decimal(11, 8), archivoData.longitud || null)
        .query(`
          INSERT INTO Archivos (
            casoId, codigoCaso, nombreArchivo, tipoArchivo, tamañoBytes, mimeType,
            onedriveFileId, onedriveUrl, onedriveUrlDescarga, rutaOnedrive,
            usuarioId, usuarioNombre, latitud, longitud, fechaSubida
          )
          VALUES (
            @casoId, @codigoCaso, @nombreArchivo, @tipoArchivo, @tamañoBytes, @mimeType,
            @onedriveFileId, @onedriveUrl, @onedriveUrlDescarga, @rutaOnedrive,
            @usuarioId, @usuarioNombre, @latitud, @longitud, GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS id;
        `);

      const archivoId = result.recordset[0].id;
      console.log(`✅ Archivo registrado: ${archivoData.nombreArchivo} (ID: ${archivoId})`);

      return { id: archivoId, ...archivoData };
    } catch (error) {
      console.error('❌ Error registrando archivo:', error.message);
      throw new DatabaseError('Error registrando archivo', error);
    }
  }

  /**
   * Lista archivos de un caso
   */
  async listarArchivosDeCaso(casoId) {
    try {
      const pool = await this.connect();
      const result = await pool.request()
        .input('casoId', sql.Int, casoId)
        .query('SELECT * FROM Archivos WHERE casoId = @casoId ORDER BY fechaSubida DESC');

      console.log(`✅ ${result.recordset.length} archivos encontrados para caso ${casoId}`);
      return result.recordset;
    } catch (error) {
      console.error('❌ Error listando archivos:', error.message);
      throw new DatabaseError('Error listando archivos', error);
    }
  }

  // ========== OPERACIONES DE FORMULARIOS ==========

  /**
   * Guarda formulario de campo
   */
  async guardarFormulario(formularioData) {
    try {
      const pool = await this.connect();
      const result = await pool.request()
        .input('casoId', sql.Int, formularioData.casoId)
        .input('codigoCaso', sql.VarChar(50), formularioData.codigoCaso)
        .input('peritoId', sql.VarChar(100), formularioData.peritoId)
        .input('peritoNombre', sql.VarChar(200), formularioData.peritoNombre)
        .input('datosJson', sql.NVarChar(sql.MAX), JSON.stringify(formularioData.datos))
        .input('latitud', sql.Decimal(10, 8), formularioData.latitud || null)
        .input('longitud', sql.Decimal(11, 8), formularioData.longitud || null)
        .query(`
          INSERT INTO Formularios (
            casoId, codigoCaso, peritoId, peritoNombre,
            datosJson, latitud, longitud, fechaCreacion
          )
          VALUES (
            @casoId, @codigoCaso, @peritoId, @peritoNombre,
            @datosJson, @latitud, @longitud, GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS id;
        `);

      const formularioId = result.recordset[0].id;
      console.log(`✅ Formulario guardado para caso ${formularioData.codigoCaso} (ID: ${formularioId})`);

      return { id: formularioId, ...formularioData };
    } catch (error) {
      console.error('❌ Error guardando formulario:', error.message);
      throw new DatabaseError('Error guardando formulario', error);
    }
  }

  /**
   * Obtiene formularios de un caso
   */
  async obtenerFormulariosDeCaso(casoId) {
    try {
      const pool = await this.connect();
      const result = await pool.request()
        .input('casoId', sql.Int, casoId)
        .query('SELECT * FROM Formularios WHERE casoId = @casoId ORDER BY fechaCreacion DESC');

      // Parsear JSON de datos
      const formularios = result.recordset.map(form => ({
        ...form,
        datos: JSON.parse(form.datosJson)
      }));

      console.log(`✅ ${formularios.length} formularios encontrados para caso ${casoId}`);
      return formularios;
    } catch (error) {
      console.error('❌ Error obteniendo formularios:', error.message);
      throw new DatabaseError('Error obteniendo formularios', error);
    }
  }

  // ========== ESTADÍSTICAS ==========

  /**
   * Obtiene estadísticas generales
   */
  async obtenerEstadisticas() {
    try {
      const pool = await this.connect();
      const result = await pool.request().query(`
        SELECT
          (SELECT COUNT(*) FROM Casos) AS totalCasos,
          (SELECT COUNT(*) FROM Casos WHERE estado = 'pendiente') AS casosPendientes,
          (SELECT COUNT(*) FROM Casos WHERE estado = 'asignado') AS casosAsignados,
          (SELECT COUNT(*) FROM Casos WHERE estado = 'en_proceso') AS casosEnProceso,
          (SELECT COUNT(*) FROM Casos WHERE estado = 'completado') AS casosCompletados,
          (SELECT COUNT(*) FROM Archivos) AS totalArchivos,
          (SELECT COUNT(*) FROM Formularios) AS totalFormularios
      `);

      return result.recordset[0];
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.message);
      throw new DatabaseError('Error obteniendo estadísticas', error);
    }
  }
}

// Exportar instancia singleton
const sqlService = new SQLService();

// Conectar automáticamente al iniciar
sqlService.connect().catch(err => {
  console.error('❌ Error conectando a SQL al iniciar:', err.message);
});

module.exports = sqlService;
