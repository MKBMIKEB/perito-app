/**
 * Script de Inicialización de Azure Cosmos DB for MongoDB (vCore)
 * Crea la base de datos, colecciones, índices y datos de prueba
 */

const { MongoClient } = require("mongodb");

// ===== CONFIGURACIÓN =====
// IMPORTANTE: Reemplaza con tu connection string de Azure Portal
const config = {
  connectionString: "mongodb://TU_USUARIO:TU_PASSWORD@perito-app-mongo.mongocluster.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000",
  database: "PeritoAppDB",
  collections: {
    peritos: "peritos",
    casos: "casos",
    formularios: "formularios"
  }
};

// ===== DATOS DE PRUEBA =====

const peritosData = [
  {
    _id: "perito_001",
    nombre: "Juan Pérez Gómez",
    cedula: "123456789",
    email: "juan.perez@peritoapp.com",
    password: "123456", // En producción, usar bcrypt
    telefono: "3001234567",
    especialidad: "Avalúos Comerciales",
    estado: "activo",
    casosAsignados: 0,
    casosCompletados: 0,
    fechaRegistro: new Date()
  },
  {
    _id: "perito_002",
    nombre: "María López Rodríguez",
    cedula: "987654321",
    email: "maria.lopez@peritoapp.com",
    password: "123456",
    telefono: "3009876543",
    especialidad: "Avalúos Residenciales",
    estado: "activo",
    casosAsignados: 0,
    casosCompletados: 0,
    fechaRegistro: new Date()
  },
  {
    _id: "perito_003",
    nombre: "Carlos Ramírez Silva",
    cedula: "456789123",
    email: "carlos.ramirez@peritoapp.com",
    password: "123456",
    telefono: "3004567891",
    especialidad: "Avalúos Industriales",
    estado: "activo",
    casosAsignados: 0,
    casosCompletados: 0,
    fechaRegistro: new Date()
  }
];

const casosData = [
  {
    _id: "caso_001",
    codigo: "CASO-001",
    direccion: "Calle 123 #45-67",
    ciudad: "Bogotá",
    barrio: "Chapinero",
    tipoInmueble: "Apartamento",
    estado: "pendiente",
    prioridad: "alta",
    fechaCreacion: new Date(),
    fechaActualizacion: new Date()
  },
  {
    _id: "caso_002",
    codigo: "CASO-002",
    direccion: "Carrera 7 #32-16",
    ciudad: "Bogotá",
    barrio: "Teusaquillo",
    tipoInmueble: "Casa",
    estado: "pendiente",
    prioridad: "media",
    fechaCreacion: new Date(),
    fechaActualizacion: new Date()
  },
  {
    _id: "caso_003",
    codigo: "CASO-003",
    direccion: "Avenida 68 #98-23",
    ciudad: "Bogotá",
    barrio: "Suba",
    tipoInmueble: "Local Comercial",
    estado: "pendiente",
    prioridad: "baja",
    fechaCreacion: new Date(),
    fechaActualizacion: new Date()
  },
  {
    _id: "caso_004",
    codigo: "CASO-004",
    direccion: "Calle 100 #15-20",
    ciudad: "Bogotá",
    barrio: "Chicó",
    tipoInmueble: "Oficina",
    estado: "asignado",
    prioridad: "alta",
    peritoId: "perito_001",
    peritoNombre: "Juan Pérez Gómez",
    fechaAsignacion: new Date(),
    fechaCreacion: new Date(Date.now() - 86400000),
    fechaActualizacion: new Date()
  },
  {
    _id: "caso_005",
    codigo: "CASO-005",
    direccion: "Transversal 45 #67-89",
    ciudad: "Medellín",
    barrio: "El Poblado",
    tipoInmueble: "Apartamento",
    estado: "asignado",
    prioridad: "media",
    peritoId: "perito_002",
    peritoNombre: "María López Rodríguez",
    fechaAsignacion: new Date(),
    fechaCreacion: new Date(Date.now() - 172800000),
    fechaActualizacion: new Date()
  }
];

// ===== FUNCIONES =====

async function createIndexes(db) {
  console.log('\n📑 Creando índices...');

  try {
    // Índices para peritos
    await db.collection(config.collections.peritos).createIndex(
      { cedula: 1 },
      { unique: true, name: "idx_cedula_unique" }
    );
    await db.collection(config.collections.peritos).createIndex(
      { estado: 1 },
      { name: "idx_estado" }
    );
    console.log('   ✅ Índices de peritos creados');

    // Índices para casos
    await db.collection(config.collections.casos).createIndex(
      { peritoId: 1 },
      { name: "idx_peritoId" }
    );
    await db.collection(config.collections.casos).createIndex(
      { estado: 1 },
      { name: "idx_estado" }
    );
    await db.collection(config.collections.casos).createIndex(
      { fechaCreacion: -1 },
      { name: "idx_fechaCreacion_desc" }
    );
    await db.collection(config.collections.casos).createIndex(
      { codigo: 1 },
      { unique: true, name: "idx_codigo_unique" }
    );
    console.log('   ✅ Índices de casos creados');

    // Índices para formularios
    await db.collection(config.collections.formularios).createIndex(
      { casoId: 1 },
      { name: "idx_casoId" }
    );
    await db.collection(config.collections.formularios).createIndex(
      { fechaCreacion: -1 },
      { name: "idx_fechaCreacion_desc" }
    );
    console.log('   ✅ Índices de formularios creados');

  } catch (error) {
    if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
      console.log('   ⚠️  Algunos índices ya existen');
    } else {
      console.error('   ❌ Error creando índices:', error.message);
    }
  }
}

async function populatePeritos(db) {
  console.log('\n👥 Poblando datos de peritos...');

  const collection = db.collection(config.collections.peritos);

  for (const perito of peritosData) {
    try {
      await collection.insertOne(perito);
      console.log(`   ✅ Perito creado: ${perito.nombre} (${perito.cedula})`);
    } catch (error) {
      if (error.code === 11000) {
        console.log(`   ⚠️  Perito ya existe: ${perito.nombre}`);
      } else {
        console.error(`   ❌ Error creando perito ${perito.nombre}:`, error.message);
      }
    }
  }
}

async function populateCasos(db) {
  console.log('\n📋 Poblando datos de casos...');

  const collection = db.collection(config.collections.casos);

  for (const caso of casosData) {
    try {
      await collection.insertOne(caso);
      console.log(`   ✅ Caso creado: ${caso.codigo} - ${caso.direccion}`);
    } catch (error) {
      if (error.code === 11000) {
        console.log(`   ⚠️  Caso ya existe: ${caso.codigo}`);
      } else {
        console.error(`   ❌ Error creando caso ${caso.codigo}:`, error.message);
      }
    }
  }
}

async function verifyData(db) {
  console.log('\n🔍 Verificando datos creados...');

  try {
    // Verificar peritos
    const peritosCount = await db.collection(config.collections.peritos).countDocuments();
    console.log(`   📊 Total peritos: ${peritosCount}`);

    const peritosActivos = await db.collection(config.collections.peritos).countDocuments({ estado: 'activo' });
    console.log(`   └─ Activos: ${peritosActivos}`);

    // Verificar casos
    const casosCount = await db.collection(config.collections.casos).countDocuments();
    console.log(`   📊 Total casos: ${casosCount}`);

    const pendientes = await db.collection(config.collections.casos).countDocuments({ estado: 'pendiente' });
    const asignados = await db.collection(config.collections.casos).countDocuments({ estado: 'asignado' });

    console.log(`   └─ Pendientes: ${pendientes}`);
    console.log(`   └─ Asignados: ${asignados}`);

    // Mostrar ejemplo de consulta
    console.log('\n📝 Ejemplo de consulta - Casos asignados a Juan Pérez:');
    const casosJuan = await db.collection(config.collections.casos)
      .find({ peritoId: 'perito_001' })
      .toArray();

    casosJuan.forEach(caso => {
      console.log(`   • ${caso.codigo}: ${caso.direccion} (${caso.estado})`);
    });

  } catch (error) {
    console.error('❌ Error verificando datos:', error.message);
  }
}

// ===== FUNCIÓN PRINCIPAL =====

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🔵 Inicialización de Azure Cosmos DB for MongoDB        ║');
  console.log('║     Perito App - Sistema de Gestión                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Verificar configuración
  if (config.connectionString.includes("TU_USUARIO") || config.connectionString.includes("TU_PASSWORD")) {
    console.error('\n❌ ERROR: Debes configurar tu connection string de Azure');
    console.error('   1. Ve a Azure Portal → Tu Cosmos DB → Connection strings');
    console.error('   2. Copia el "Primary Connection String"');
    console.error('   3. Reemplázalo en este archivo en la línea 11\n');
    process.exit(1);
  }

  let client;

  try {
    // Crear cliente MongoDB
    console.log('\n🔌 Conectando a Azure Cosmos DB for MongoDB...');
    client = new MongoClient(config.connectionString, {
      ssl: true,
      retryWrites: false,
      maxIdleTimeMS: 120000
    });

    await client.connect();
    console.log('✅ Conexión establecida');

    // Verificar conexión con ping
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Servidor respondió correctamente');

    // Obtener referencia a la base de datos
    const db = client.db(config.database);
    console.log(`✅ Base de datos "${config.database}" seleccionada`);

    // Crear colecciones si no existen (MongoDB las crea automáticamente al insertar)
    console.log('\n📦 Verificando colecciones...');
    const collections = await db.listCollections().toArray();
    console.log(`   Colecciones existentes: ${collections.map(c => c.name).join(', ') || 'ninguna'}`);

    // Crear índices
    await createIndexes(db);

    // Poblar datos de prueba
    await populatePeritos(db);
    await populateCasos(db);

    // Verificar datos
    await verifyData(db);

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║  ✅ Inicialización completada exitosamente               ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('📱 Credenciales de prueba para login en la app:');
    console.log('   ┌─────────────────────────────────────┐');
    console.log('   │ Perito 1:                           │');
    console.log('   │ Cédula:   123456789                 │');
    console.log('   │ Password: 123456                    │');
    console.log('   ├─────────────────────────────────────┤');
    console.log('   │ Perito 2:                           │');
    console.log('   │ Cédula:   987654321                 │');
    console.log('   │ Password: 123456                    │');
    console.log('   └─────────────────────────────────────┘\n');

    console.log('🌐 Puedes verificar los datos en:');
    console.log('   https://portal.azure.com → Tu Cosmos DB → Data Explorer\n');

  } catch (error) {
    console.error('\n╔═══════════════════════════════════════════════════════════╗');
    console.error('║  ❌ Error durante la inicialización                      ║');
    console.error('╚═══════════════════════════════════════════════════════════╝\n');
    console.error('Error:', error.message);
    console.error('\nPosibles soluciones:');
    console.error('1. Verifica que el connection string sea correcto');
    console.error('2. Verifica que tu IP esté permitida en Azure Firewall');
    console.error('3. Verifica que el cluster de MongoDB esté activo');
    console.error('4. Verifica tu conexión a internet\n');

    if (error.message.includes('authentication')) {
      console.error('💡 Error de autenticación: Verifica usuario y contraseña en el connection string\n');
    }

    if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.error('💡 Error de red: Verifica firewall de Azure y tu conexión\n');
    }

    process.exit(1);
  } finally {
    // Cerrar conexión
    if (client) {
      await client.close();
      console.log('👋 Conexión cerrada\n');
    }
  }
}

// ===== EJECUTAR =====

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
