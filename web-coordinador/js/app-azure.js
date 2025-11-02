/**
 * Panel Web Coordinador - Integración con Azure
 * Reemplazo de Firebase con Azure Cosmos DB
 */

const { CosmosClient } = require("@azure/cosmos");
const { BlobServiceClient } = require("@azure/storage-blob");

// ===== CONFIGURACIÓN AZURE =====
const azureConfig = {
  cosmosDB: {
    endpoint: "https://perito-app-cosmos.documents.azure.com:443/",
    key: "TU_COSMOS_DB_PRIMARY_KEY_AQUI", // REEMPLAZAR
    databaseId: "PeritoAppDB"
  },
  storage: {
    accountName: "peritoappstorage",
    sasToken: "TU_SAS_TOKEN_AQUI", // REEMPLAZAR
    containerName: "fotos-evidencias"
  }
};

// ===== CLIENTE AZURE =====
let cosmosClient;
let database;
let containers = {};
let blobServiceClient;
let containerClient;

// ===== INICIALIZACIÓN =====
async function initAzure() {
  try {
    console.log('🔵 Inicializando Azure...');

    // Cosmos DB
    cosmosClient = new CosmosClient({
      endpoint: azureConfig.cosmosDB.endpoint,
      key: azureConfig.cosmosDB.key
    });

    database = cosmosClient.database(azureConfig.cosmosDB.databaseId);
    containers.casos = database.container('casos');
    containers.peritos = database.container('peritos');
    containers.formularios = database.container('formularios');

    // Blob Storage
    const accountUrl = `https://${azureConfig.storage.accountName}.blob.core.windows.net`;
    const sasUrl = `${accountUrl}?${azureConfig.storage.sasToken}`;
    blobServiceClient = new BlobServiceClient(sasUrl);
    containerClient = blobServiceClient.getContainerClient(azureConfig.storage.containerName);

    console.log('✅ Azure inicializado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando Azure:', error);
    return false;
  }
}

// ===== DATOS GLOBALES =====
let casos = [];
let peritos = [];
let currentUser = null;

// ===== CRUD CASOS =====

async function loadCasos() {
  try {
    console.log('📥 Cargando casos desde Azure...');

    const { resources } = await containers.casos.items
      .query("SELECT * FROM c ORDER BY c.fechaCreacion DESC")
      .fetchAll();

    casos = resources;
    console.log(`✅ ${casos.length} casos cargados`);
    updateDashboard();
    return casos;
  } catch (error) {
    console.error('❌ Error cargando casos:', error);
    mostrarNotificacion('Error cargando casos', 'error');
    return [];
  }
}

async function createCaso(casoData) {
  try {
    const nuevoCaso = {
      id: `caso_${Date.now()}`,
      codigo: `CASO-${Date.now().toString().slice(-6)}`,
      ...casoData,
      estado: 'pendiente',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    };

    const { resource } = await containers.casos.items.create(nuevoCaso);
    casos.unshift(resource);

    updateDashboard();
    mostrarNotificacion('Caso creado exitosamente', 'success');
    return resource;
  } catch (error) {
    console.error('❌ Error creando caso:', error);
    mostrarNotificacion('Error creando caso', 'error');
    throw error;
  }
}

async function updateCaso(casoId, updates) {
  try {
    const { resource: caso } = await containers.casos.item(casoId, casoId).read();

    const casoActualizado = {
      ...caso,
      ...updates,
      fechaActualizacion: new Date().toISOString()
    };

    await containers.casos.item(casoId, casoId).replace(casoActualizado);

    const index = casos.findIndex(c => c.id === casoId);
    if (index !== -1) {
      casos[index] = casoActualizado;
    }

    updateDashboard();
    mostrarNotificacion('Caso actualizado exitosamente', 'success');
    return casoActualizado;
  } catch (error) {
    console.error('❌ Error actualizando caso:', error);
    mostrarNotificacion('Error actualizando caso', 'error');
    throw error;
  }
}

async function deleteCaso(casoId) {
  try {
    await containers.casos.item(casoId, casoId).delete();

    casos = casos.filter(c => c.id !== casoId);
    updateDashboard();
    mostrarNotificacion('Caso eliminado exitosamente', 'success');
  } catch (error) {
    console.error('❌ Error eliminando caso:', error);
    mostrarNotificacion('Error eliminando caso', 'error');
  }
}

// ===== CRUD PERITOS =====

async function loadPeritos() {
  try {
    console.log('📥 Cargando peritos desde Azure...');

    const { resources } = await containers.peritos.items
      .query("SELECT * FROM c ORDER BY c.nombre ASC")
      .fetchAll();

    peritos = resources;
    console.log(`✅ ${peritos.length} peritos cargados`);
    updateDashboard();
    return peritos;
  } catch (error) {
    console.error('❌ Error cargando peritos:', error);
    mostrarNotificacion('Error cargando peritos', 'error');
    return [];
  }
}

async function createPerito(peritoData) {
  try {
    const nuevoPerito = {
      id: `perito_${Date.now()}`,
      ...peritoData,
      estado: 'activo',
      casosAsignados: 0,
      casosCompletados: 0,
      fechaRegistro: new Date().toISOString()
    };

    const { resource } = await containers.peritos.items.create(nuevoPerito);
    peritos.push(resource);

    updateDashboard();
    mostrarNotificacion('Perito registrado exitosamente', 'success');
    return resource;
  } catch (error) {
    console.error('❌ Error creando perito:', error);
    mostrarNotificacion('Error registrando perito', 'error');
    throw error;
  }
}

async function updatePerito(peritoId, updates) {
  try {
    const { resource: perito } = await containers.peritos.item(peritoId, peritoId).read();

    const peritoActualizado = {
      ...perito,
      ...updates,
      fechaActualizacion: new Date().toISOString()
    };

    await containers.peritos.item(peritoId, peritoId).replace(peritoActualizado);

    const index = peritos.findIndex(p => p.id === peritoId);
    if (index !== -1) {
      peritos[index] = peritoActualizado;
    }

    updateDashboard();
    mostrarNotificacion('Perito actualizado exitosamente', 'success');
    return peritoActualizado;
  } catch (error) {
    console.error('❌ Error actualizando perito:', error);
    mostrarNotificacion('Error actualizando perito', 'error');
    throw error;
  }
}

async function deletePerito(peritoId) {
  try {
    await containers.peritos.item(peritoId, peritoId).delete();

    peritos = peritos.filter(p => p.id !== peritoId);
    updateDashboard();
    mostrarNotificacion('Perito eliminado exitosamente', 'success');
  } catch (error) {
    console.error('❌ Error eliminando perito:', error);
    mostrarNotificacion('Error eliminando perito', 'error');
  }
}

// ===== ASIGNACIÓN DE CASOS =====

async function asignarCaso(casoId, peritoId) {
  try {
    const perito = peritos.find(p => p.id === peritoId);
    if (!perito) {
      throw new Error('Perito no encontrado');
    }

    await updateCaso(casoId, {
      peritoId: peritoId,
      peritoNombre: perito.nombre,
      estado: 'asignado',
      fechaAsignacion: new Date().toISOString()
    });

    // Actualizar contador del perito
    await updatePerito(peritoId, {
      casosAsignados: (perito.casosAsignados || 0) + 1
    });

    mostrarNotificacion(`Caso asignado a ${perito.nombre}`, 'success');
  } catch (error) {
    console.error('❌ Error asignando caso:', error);
    mostrarNotificacion('Error asignando caso', 'error');
  }
}

// ===== POLLING PARA ACTUALIZACIONES =====

let pollInterval;

function startPolling() {
  // Polling cada 10 segundos
  pollInterval = setInterval(async () => {
    await loadCasos();
    await loadPeritos();
  }, 10000);

  console.log('🔄 Polling iniciado (cada 10 segundos)');
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    console.log('🛑 Polling detenido');
  }
}

// ===== ACTUALIZACIÓN DE DASHBOARD =====

function updateDashboard() {
  updateEstadisticas();
  renderCasosTable();
  renderPeritosTable();
  updateGraficos();
}

function updateEstadisticas() {
  const totalCasos = casos.length;
  const casosPendientes = casos.filter(c => c.estado === 'pendiente').length;
  const casosAsignados = casos.filter(c => c.estado === 'asignado').length;
  const casosCompletados = casos.filter(c => c.estado === 'completado').length;
  const totalPeritos = peritos.filter(p => p.estado === 'activo').length;

  document.getElementById('totalCasos').textContent = totalCasos;
  document.getElementById('casosPendientes').textContent = casosPendientes;
  document.getElementById('casosAsignados').textContent = casosAsignados;
  document.getElementById('casosCompletados').textContent = casosCompletados;
  document.getElementById('totalPeritos').textContent = totalPeritos;
}

function renderCasosTable() {
  const tbody = document.getElementById('casosTableBody');
  if (!tbody) return;

  if (casos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay casos registrados</td></tr>';
    return;
  }

  tbody.innerHTML = casos.map(caso => `
    <tr>
      <td>${caso.codigo}</td>
      <td>${caso.direccion}</td>
      <td>${caso.ciudad || 'N/A'}</td>
      <td>${caso.peritoNombre || 'Sin asignar'}</td>
      <td><span class="badge badge-${getEstadoColor(caso.estado)}">${caso.estado}</span></td>
      <td>
        <button class="btn-icon" onclick="editarCaso('${caso.id}')" title="Editar">
          <i class="icon-edit"></i>
        </button>
        <button class="btn-icon" onclick="verDetalleCaso('${caso.id}')" title="Ver detalle">
          <i class="icon-eye"></i>
        </button>
        <button class="btn-icon btn-danger" onclick="confirmarEliminarCaso('${caso.id}')" title="Eliminar">
          <i class="icon-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function renderPeritosTable() {
  const tbody = document.getElementById('peritosTableBody');
  if (!tbody) return;

  if (peritos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay peritos registrados</td></tr>';
    return;
  }

  tbody.innerHTML = peritos.map(perito => `
    <tr>
      <td>${perito.nombre}</td>
      <td>${perito.cedula}</td>
      <td>${perito.especialidad || 'N/A'}</td>
      <td>${perito.telefono || 'N/A'}</td>
      <td>${perito.casosAsignados || 0}</td>
      <td><span class="badge badge-${perito.estado === 'activo' ? 'success' : 'danger'}">${perito.estado}</span></td>
      <td>
        <button class="btn-icon" onclick="editarPerito('${perito.id}')" title="Editar">
          <i class="icon-edit"></i>
        </button>
        <button class="btn-icon btn-danger" onclick="confirmarEliminarPerito('${perito.id}')" title="Eliminar">
          <i class="icon-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function getEstadoColor(estado) {
  const colores = {
    'pendiente': 'warning',
    'asignado': 'info',
    'en_proceso': 'primary',
    'completado': 'success',
    'cancelado': 'danger'
  };
  return colores[estado] || 'secondary';
}

// ===== NOTIFICACIONES =====

function mostrarNotificacion(mensaje, tipo = 'info') {
  // Implementar sistema de notificaciones toast
  console.log(`${tipo.toUpperCase()}: ${mensaje}`);
  alert(mensaje); // Temporal
}

// ===== INICIALIZACIÓN AL CARGAR =====

window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Iniciando panel coordinador con Azure...');

  const inicializado = await initAzure();

  if (inicializado) {
    await loadCasos();
    await loadPeritos();
    startPolling();
  } else {
    mostrarNotificacion('Error conectando con Azure. Verifique la configuración.', 'error');
  }
});

// Limpiar al salir
window.addEventListener('beforeunload', () => {
  stopPolling();
});

console.log('✅ app-azure.js cargado');
