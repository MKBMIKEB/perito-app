/**
 * Azure Casos Service
 * Reemplazo de Firebase con Azure Cosmos DB
 */

import { CosmosClient } from "@azure/cosmos";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { azureConfig } from '../config/azureConfig';

class AzureCasosService {
  constructor() {
    this.client = null;
    this.database = null;
    this.containers = {};
    this.listeners = [];
    this.pollInterval = null;
    this.initialized = false;
  }

  /**
   * Inicializa la conexión con Azure Cosmos DB
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔵 Inicializando Azure Cosmos DB...');

      // Crear cliente de Cosmos DB
      this.client = new CosmosClient({
        endpoint: azureConfig.cosmosDB.endpoint,
        key: azureConfig.cosmosDB.key
      });

      // Obtener referencia a la base de datos
      this.database = this.client.database(azureConfig.cosmosDB.databaseId);

      // Obtener referencias a los contenedores
      this.containers.casos = this.database.container(azureConfig.cosmosDB.containers.casos);
      this.containers.peritos = this.database.container(azureConfig.cosmosDB.containers.peritos);
      this.containers.formularios = this.database.container(azureConfig.cosmosDB.containers.formularios);

      this.initialized = true;
      console.log('✅ Azure Cosmos DB inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando Azure Cosmos DB:', error);
      throw error;
    }
  }

  /**
   * Escucha cambios en casos asignados (polling cada 5 segundos)
   * Cosmos DB no tiene listeners en tiempo real como Firestore,
   * pero podemos usar Change Feed o polling
   */
  async listenToCasosAsignados(peritoId, callback) {
    await this.initialize();

    console.log('👂 Iniciando escucha de casos para perito:', peritoId);

    // Función de polling
    const pollCasos = async () => {
      try {
        const { resources: casos } = await this.containers.casos.items
          .query({
            query: "SELECT * FROM c WHERE c.peritoId = @peritoId",
            parameters: [{ name: "@peritoId", value: peritoId }]
          })
          .fetchAll();

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
   * Guarda formulario de campo en Cosmos DB
   */
  async guardarFormularioCampo(formularioData) {
    await this.initialize();

    try {
      console.log('💾 Guardando formulario en Azure Cosmos DB...');

      const formulario = {
        id: formularioData.id || `form_${Date.now()}`,
        ...formularioData,
        fechaCreacion: new Date().toISOString(),
        sincronizado: true
      };

      const { resource } = await this.containers.formularios.items.create(formulario);

      console.log('✅ Formulario guardado exitosamente:', resource.id);
      return { success: true, id: resource.id };

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

      // Obtener el caso actual
      const { resource: caso } = await this.containers.casos.item(casoId, casoId).read();

      // Actualizar estado
      caso.estado = nuevoEstado;
      caso.fechaActualizacion = new Date().toISOString();

      // Guardar cambios
      await this.containers.casos.item(casoId, casoId).replace(caso);

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
      const { resources: casos } = await this.containers.casos.items
        .query({
          query: "SELECT * FROM c WHERE c.peritoId = @peritoId ORDER BY c.fechaAsignacion DESC",
          parameters: [{ name: "@peritoId", value: peritoId }]
        })
        .fetchAll();

      return casos;
    } catch (error) {
      console.error('❌ Error obteniendo casos:', error);
      return [];
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
      await this.database.read();
      console.log('✅ Conexión con Azure verificada');
      return true;
    } catch (error) {
      console.error('❌ Sin conexión con Azure:', error);
      return false;
    }
  }
}

// Exportar instancia única (singleton)
const azureCasosService = new AzureCasosService();
export default azureCasosService;
