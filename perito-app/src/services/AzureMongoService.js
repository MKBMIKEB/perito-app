/**
 * Azure MongoDB Service
 * Servicio para Azure Cosmos DB for MongoDB (vCore)
 * Reemplazo de Firebase con MongoDB API
 */

import { MongoClient } from 'mongodb';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { azureConfig } from '../config/azureConfig';

class AzureMongoService {
  constructor() {
    this.client = null;
    this.db = null;
    this.collections = {};
    this.listeners = [];
    this.pollInterval = null;
    this.initialized = false;
  }

  /**
   * Inicializa la conexión con Azure Cosmos DB for MongoDB
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔵 Inicializando Azure Cosmos DB for MongoDB...');

      // Crear cliente MongoDB usando connection string
      this.client = new MongoClient(azureConfig.mongodb.connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ssl: azureConfig.mongodb.options.ssl,
        retryWrites: azureConfig.mongodb.options.retryWrites,
        maxIdleTimeMS: azureConfig.mongodb.options.maxIdleTimeMS,
        appName: azureConfig.mongodb.options.appName
      });

      // Conectar
      await this.client.connect();
      console.log('✅ Conectado a Azure Cosmos DB for MongoDB');

      // Obtener referencia a la base de datos
      this.db = this.client.db(azureConfig.mongodb.database);

      // Obtener referencias a las colecciones
      this.collections.casos = this.db.collection(azureConfig.mongodb.collections.casos);
      this.collections.peritos = this.db.collection(azureConfig.mongodb.collections.peritos);
      this.collections.formularios = this.db.collection(azureConfig.mongodb.collections.formularios);

      // Crear índices para mejorar rendimiento
      await this.createIndexes();

      this.initialized = true;
      console.log('✅ Azure MongoDB Service inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando Azure MongoDB:', error);
      throw error;
    }
  }

  /**
   * Crea índices para optimizar consultas
   */
  async createIndexes() {
    try {
      console.log('📑 Creando índices...');

      // Índices para casos
      await this.collections.casos.createIndex({ peritoId: 1 });
      await this.collections.casos.createIndex({ estado: 1 });
      await this.collections.casos.createIndex({ fechaCreacion: -1 });

      // Índices para peritos
      await this.collections.peritos.createIndex({ cedula: 1 }, { unique: true });
      await this.collections.peritos.createIndex({ estado: 1 });

      // Índices para formularios
      await this.collections.formularios.createIndex({ casoId: 1 });
      await this.collections.formularios.createIndex({ fechaCreacion: -1 });

      console.log('✅ Índices creados');
    } catch (error) {
      console.warn('⚠️ Algunos índices ya existen o no se pudieron crear:', error.message);
    }
  }

  /**
   * Escucha cambios en casos asignados (polling cada 5 segundos)
   * MongoDB Change Streams requieren replica set, usamos polling como alternativa
   */
  async listenToCasosAsignados(peritoId, callback) {
    await this.initialize();

    console.log('👂 Iniciando escucha de casos para perito:', peritoId);

    // Función de polling
    const pollCasos = async () => {
      try {
        const casos = await this.collections.casos
          .find({ peritoId: peritoId })
          .sort({ fechaCreacion: -1 })
          .toArray();

        console.log(`📦 ${casos.length} casos encontrados`);
        callback(casos);
      } catch (error) {
        console.error('❌ Error en polling de casos:', error);
      }
    };

    // Primera consulta inmediata
    await pollCasos();

    // Polling cada 5 segundos
    this.pollInterval = setInterval(pollCasos, 5000);

    // Guardar listener para poder detenerlo después
    this.listeners.push({ peritoId, interval: this.pollInterval });
  }

  /**
   * Detiene todos los listeners activos
   */
  stopListening() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('🛑 Listeners detenidos');
    }
  }

  /**
   * Guarda formulario de campo en MongoDB
   */
  async guardarFormularioCampo(formularioData) {
    await this.initialize();

    try {
      console.log('💾 Guardando formulario en Azure MongoDB...');

      const formulario = {
        _id: formularioData.id || `form_${Date.now()}`,
        ...formularioData,
        fechaCreacion: new Date(),
        sincronizado: true
      };

      const result = await this.collections.formularios.insertOne(formulario);

      console.log('✅ Formulario guardado exitosamente:', result.insertedId);
      return { success: true, id: result.insertedId };

    } catch (error) {
      console.error('❌ Error guardando formulario:', error);

      // Guardar en cola offline
      await this.guardarEnColaOffline(formularioData);

      return {
        success: false,
        error: error.message,
        offline: true
      };
    }
  }

  /**
   * Actualiza el estado de un caso
   */
  async actualizarEstadoCaso(casoId, nuevoEstado) {
    await this.initialize();

    try {
      console.log(`📝 Actualizando caso ${casoId} a estado: ${nuevoEstado}`);

      const result = await this.collections.casos.updateOne(
        { _id: casoId },
        {
          $set: {
            estado: nuevoEstado,
            fechaActualizacion: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Caso no encontrado');
      }

      console.log('✅ Estado actualizado');
      return { success: true };

    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene todos los casos de un perito
   */
  async obtenerCasosPerito(peritoId) {
    await this.initialize();

    try {
      const casos = await this.collections.casos
        .find({ peritoId: peritoId })
        .sort({ fechaAsignacion: -1 })
        .toArray();

      return casos;
    } catch (error) {
      console.error('❌ Error obteniendo casos:', error);
      return [];
    }
  }

  /**
   * Busca un caso por ID
   */
  async obtenerCasoPorId(casoId) {
    await this.initialize();

    try {
      const caso = await this.collections.casos.findOne({ _id: casoId });
      return caso;
    } catch (error) {
      console.error('❌ Error obteniendo caso:', error);
      return null;
    }
  }

  /**
   * Guarda en cola offline para sincronizar después
   */
  async guardarEnColaOffline(formularioData) {
    try {
      const colaJSON = await AsyncStorage.getItem('cola_sincronizacion');
      const cola = colaJSON ? JSON.parse(colaJSON) : [];

      cola.push({
        tipo: 'formulario',
        data: formularioData,
        timestamp: Date.now()
      });

      await AsyncStorage.setItem('cola_sincronizacion', JSON.stringify(cola));
      console.log('💾 Formulario guardado en cola offline');
    } catch (error) {
      console.error('❌ Error guardando en cola offline:', error);
    }
  }

  /**
   * Sincroniza formularios pendientes de la cola offline
   */
  async sincronizarColaOffline() {
    await this.initialize();

    try {
      const colaJSON = await AsyncStorage.getItem('cola_sincronizacion');
      if (!colaJSON) {
        console.log('📭 No hay elementos en cola para sincronizar');
        return { success: true, sincronizados: 0 };
      }

      const cola = JSON.parse(colaJSON);
      let sincronizados = 0;

      for (const item of cola) {
        if (item.tipo === 'formulario') {
          const resultado = await this.guardarFormularioCampo(item.data);
          if (resultado.success) {
            sincronizados++;
          }
        }
      }

      // Limpiar cola
      await AsyncStorage.removeItem('cola_sincronizacion');

      console.log(`✅ ${sincronizados} elementos sincronizados`);
      return { success: true, sincronizados };

    } catch (error) {
      console.error('❌ Error sincronizando cola:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verifica conectividad con Azure
   */
  async verificarConexion() {
    try {
      await this.initialize();
      await this.db.command({ ping: 1 });
      console.log('✅ Conexión con Azure MongoDB verificada');
      return true;
    } catch (error) {
      console.error('❌ Sin conexión con Azure MongoDB:', error);
      return false;
    }
  }

  /**
   * Cierra la conexión
   */
  async close() {
    try {
      this.stopListening();
      if (this.client) {
        await this.client.close();
        this.initialized = false;
        console.log('👋 Conexión cerrada');
      }
    } catch (error) {
      console.error('❌ Error cerrando conexión:', error);
    }
  }
}

// Exportar instancia única (singleton)
const azureMongoService = new AzureMongoService();
export default azureMongoService;
