/**
 * Script de Inicialización de Azure Cosmos DB
 * Crea la base de datos, contenedores y datos de prueba
 */

const { CosmosClient } = require("@azure/cosmos");

// ===== CONFIGURACIÓN =====
// IMPORTANTE: Reemplaza estos valores con tus credenciales de Azure
const config = {
  endpoint: "https://perito-app-cosmos.documents.azure.com:443/",
  key: "TU_COSMOS_DB_PRIMARY_KEY_AQUI",
  databaseId: "PeritoAppDB",
  containers: {
    peritos: "peritos",
    casos: "casos",
    formularios: "formularios"
  }
};

// ===== DATOS DE PRUEBA =====

const peritosData = [
  {
    id: "perito_001",
    nombre: "Juan Pérez Gómez",
    cedula: "123456789",
    email: "juan.perez@peritoapp.com",
    password: "123456", // En producción, usar hash
    telefono: "3001234567",
    especialidad: "Avalúos Comerciales",
    estado: "activo",
    casosAsignados: 0,
    casosCompletados: 0,
    fechaRegistro: new Date().toISOString()
  },
  {
    id: "perito_002",
    nombre: "María López Rodríguez",
    cedula: "987654321",
    email: "maria.lopez@peritoapp.com",
    password: "123456",
    telefono: "3009876543",
    especialidad: "Avalúos Residenciales",
    estado: "activo",
    casosAsignados: 0,
    casosCompletados: 0,
    fechaRegistro: new Date().toISOString()
  },
  {
    id: "perito_003",
    nombre: "Carlos Ramírez Silva",
    cedula: "456789123",
    email: "carlos.ramirez@peritoapp.com",
    password: "123456",
    telefono: "3004567891",
    especialidad: "Avalúos Industriales",
    estado: "activo",
    casosAsignados: 0,
    casosCompletados: 0,
    fechaRegistro: new Date().toISOString()
  }
];

const casosData = [
  {
    id: "caso_001",
    codigo: "CASO-001",
    direccion: "Calle 123 #45-67",
    ciudad: "Bogotá",
    barrio: "Chapinero",
    tipoInmueble: "Apartamento",
    estado: "pendiente",
    prioridad: "alta",
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "caso_002",
    codigo: "CASO-002",
    direccion: "Carrera 7 #32-16",
    ciudad: "Bogotá",
    barrio: "Teusaquillo",
    tipoInmueble: "Casa",
    estado: "pendiente",
    prioridad: "media",
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "caso_003",
    codigo: "CASO-003",
    direccion: "Avenida 68 #98-23",
    ciudad: "Bogotá",
    barrio: "Suba",
    tipoInmueble: "Local Comercial",
    estado: "pendiente",
    prioridad: "baja",
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "caso_004",
    codigo: "CASO-004",
    direccion: "Calle 100 #15-20",
    ciudad: "Bogotá",
    barrio: "Chicó",
    tipoInmueble: "Oficina",
    estado: "asignado",
    prioridad: "alta",
    peritoId: "perito_001",
    peritoNombre: "Juan Pérez Gómez",
    fechaAsignacion: new Date().toISOString(),
    fechaCreacion: new Date(Date.now() - 86400000).toISOString(),
    fechaActualizacion: new Date().toISOString()
  }
];

// ===== FUNCIONES =====

async function createDatabaseIfNotExists(client) {
  console.log('\n📦 Verificando base de datos...');

  try {
    const { database } = await client.databases.createIfNotExists({
      id: config.databaseId
    });
    console.log(`✅ Base de datos "${config.databaseId}" lista`);
    return database;
  } catch (error) {
    console.error('❌ Error creando base de datos:', error.message);
    throw error;
  }
}

async function createContainerIfNotExists(database, containerId) {
  console.log(`\n📁 Verificando contenedor "${containerId}"...`);

  try {
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: ["/id"] }
    });
    console.log(`✅ Contenedor "${containerId}" listo`);
    return container;
  } catch (error) {
    console.error(`❌ Error creando contenedor "${containerId}":`, error.message);
    throw error;
  }
}

async function populatePeritos(container) {
  console.log('\n👥 Poblando datos de peritos...');

  for (const perito of peritosData) {
    try {
      await container.items.create(perito);
      console.log(`   ✅ Perito creado: ${perito.nombre} (${perito.cedula})`);
    } catch (error) {
      if (error.code === 409) {
        console.log(`   ⚠️  Perito ya existe: ${perito.nombre}`);
      } else {
        console.error(`   ❌ Error creando perito ${perito.nombre}:`, error.message);
      }
    }
  }
}

async function populateCasos(container) {
  console.log('\n📋 Poblando datos de casos...');

  for (const caso of casosData) {
    try {
      await container.items.create(caso);
      console.log(`   ✅ Caso creado: ${caso.codigo} - ${caso.direccion}`);
    } catch (error) {
      if (error.code === 409) {
        console.log(`   ⚠️  Caso ya existe: ${caso.codigo}`);
      } else {
        console.error(`   ❌ Error creando caso ${caso.codigo}:`, error.message);
      }
    }
  }
}

async function verifyData(database) {
  console.log('\n🔍 Verificando datos creados...');

  try {
    // Verificar peritos
    const peritosContainer = database.container(config.containers.peritos);
    const { resources: peritos } = await peritosContainer.items
      .query("SELECT * FROM c")
      .fetchAll();
    console.log(`   📊 Total peritos: ${peritos.length}`);

    // Verificar casos
    const casosContainer = database.container(config.containers.casos);
    const { resources: casos } = await casosContainer.items
      .query("SELECT * FROM c")
      .fetchAll();
    console.log(`   📊 Total casos: ${casos.length}`);

    // Mostrar resumen por estado
    const pendientes = casos.filter(c => c.estado === 'pendiente').length;
    const asignados = casos.filter(c => c.estado === 'asignado').length;

    console.log(`   └─ Pendientes: ${pendientes}`);
    console.log(`   └─ Asignados: ${asignados}`);

  } catch (error) {
    console.error('❌ Error verificando datos:', error.message);
  }
}

// ===== FUNCIÓN PRINCIPAL =====

async function main() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║  🔵 Inicialización de Azure Cosmos DB            ║');
  console.log('║     Perito App - Sistema de Gestión             ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  // Verificar configuración
  if (config.key === "TU_COSMOS_DB_PRIMARY_KEY_AQUI") {
    console.error('\n❌ ERROR: Debes configurar tus credenciales de Azure en este archivo');
    console.error('   Edita el archivo y reemplaza:');
    console.error('   - endpoint: Tu Cosmos DB endpoint');
    console.error('   - key: Tu Cosmos DB primary key\n');
    process.exit(1);
  }

  try {
    // Crear cliente de Cosmos DB
    console.log('\n🔌 Conectando a Azure Cosmos DB...');
    const client = new CosmosClient({
      endpoint: config.endpoint,
      key: config.key
    });
    console.log('✅ Conexión establecida');

    // Crear base de datos
    const database = await createDatabaseIfNotExists(client);

    // Crear contenedores
    const peritosContainer = await createContainerIfNotExists(database, config.containers.peritos);
    const casosContainer = await createContainerIfNotExists(database, config.containers.casos);
    await createContainerIfNotExists(database, config.containers.formularios);

    // Poblar datos de prueba
    await populatePeritos(peritosContainer);
    await populateCasos(casosContainer);

    // Verificar datos
    await verifyData(database);

    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║  ✅ Inicialización completada exitosamente       ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    console.log('📱 Credenciales de prueba para login:');
    console.log('   Cédula: 123456789');
    console.log('   Password: 123456\n');

    console.log('🌐 Puedes verificar los datos en:');
    console.log('   https://portal.azure.com → Tu Cosmos DB → Data Explorer\n');

  } catch (error) {
    console.error('\n╔═══════════════════════════════════════════════════╗');
    console.error('║  ❌ Error durante la inicialización              ║');
    console.error('╚═══════════════════════════════════════════════════╝\n');
    console.error('Error:', error.message);
    console.error('\nPosibles soluciones:');
    console.error('1. Verifica que el endpoint y key sean correctos');
    console.error('2. Verifica que tengas acceso a Azure Cosmos DB');
    console.error('3. Verifica tu conexión a internet\n');
    process.exit(1);
  }
}

// ===== EJECUTAR =====

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
