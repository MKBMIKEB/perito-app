/**
 * Script para inicializar Firestore con datos de prueba
 * Ejecutar: node scripts/init-firestore.js
 */

// Importar Firebase Admin SDK
const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('../google-services.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'savia-424d0'
});

const db = admin.firestore();

// Datos de prueba
const peritosData = [
  {
    nombre: 'Juan Pérez García',
    cedula: '12345678',
    telefono: '3001234567',
    email: 'juan.perez@example.com',
    especialidad: 'Especialista Urbano',
    password: '123456', // En producción, usa hash
    activo: true,
    fechaRegistro: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    nombre: 'María González López',
    cedula: '87654321',
    telefono: '3109876543',
    email: 'maria.gonzalez@example.com',
    especialidad: 'Especialista Rural',
    password: '123456',
    activo: true,
    fechaRegistro: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    nombre: 'Carlos Ramírez Soto',
    cedula: '11223344',
    telefono: '3201122334',
    email: 'carlos.ramirez@example.com',
    especialidad: 'Especialista Comercial',
    password: '123456',
    activo: true,
    fechaRegistro: admin.firestore.FieldValue.serverTimestamp()
  }
];

const casosData = [
  {
    codigo: 'AV001',
    direccion: 'Calle 123 #45-67, Chapinero',
    tipo: 'Avalúo Comercial',
    municipio: 'Bogotá',
    matricula: '50N-12345678',
    prioridad: 'alta',
    fechaLimite: '2025-11-30',
    observaciones: 'Requiere avalúo urgente para crédito hipotecario',
    estado: 'sin_asignar',
    peritoId: null,
    peritoNombre: null,
    fechaCreacion: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    codigo: 'AV002',
    direccion: 'Carrera 15 #80-20, Zona Rosa',
    tipo: 'Verificación Catastral',
    municipio: 'Bogotá',
    matricula: '50N-87654321',
    prioridad: 'normal',
    fechaLimite: '2025-12-15',
    observaciones: 'Verificación de linderos y áreas',
    estado: 'sin_asignar',
    peritoId: null,
    peritoNombre: null,
    fechaCreacion: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    codigo: 'AV003',
    direccion: 'Avenida 68 #45-23, Kennedy',
    tipo: 'Avalúo Hipotecario',
    municipio: 'Bogotá',
    matricula: '50N-11223344',
    prioridad: 'normal',
    fechaLimite: '2025-12-20',
    observaciones: 'Avalúo para proceso hipotecario banco XYZ',
    estado: 'sin_asignar',
    peritoId: null,
    peritoNombre: null,
    fechaCreacion: admin.firestore.FieldValue.serverTimestamp()
  }
];

async function initializeFirestore() {
  try {
    console.log('🔥 Iniciando configuración de Firestore...\n');

    // 1. Crear peritos
    console.log('👥 Creando peritos de prueba...');
    const peritosCreados = [];

    for (const perito of peritosData) {
      const docRef = await db.collection('peritos').add(perito);
      peritosCreados.push({ id: docRef.id, ...perito });
      console.log(`   ✅ Perito creado: ${perito.nombre} (ID: ${docRef.id})`);
    }

    console.log(`\n✅ ${peritosCreados.length} peritos creados exitosamente\n`);

    // 2. Crear casos
    console.log('📋 Creando casos de prueba...');
    const casosCreados = [];

    for (const caso of casosData) {
      const docRef = await db.collection('casos').add(caso);
      casosCreados.push({ id: docRef.id, ...caso });
      console.log(`   ✅ Caso creado: ${caso.codigo} - ${caso.direccion}`);
    }

    console.log(`\n✅ ${casosCreados.length} casos creados exitosamente\n`);

    // 3. Asignar un caso de ejemplo al primer perito
    if (peritosCreados.length > 0 && casosCreados.length > 0) {
      console.log('🔗 Asignando caso de ejemplo...');
      const primerPerito = peritosCreados[0];
      const primerCaso = casosCreados[0];

      await db.collection('casos').doc(primerCaso.id).update({
        peritoId: primerPerito.id,
        peritoNombre: primerPerito.nombre,
        estado: 'asignado',
        fechaAsignacion: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`   ✅ Caso ${primerCaso.codigo} asignado a ${primerPerito.nombre}\n`);
    }

    // 4. Mostrar resumen
    console.log('═════════════════════════════════════════════════════');
    console.log('🎉 ¡Firestore configurado exitosamente!\n');
    console.log('📊 RESUMEN:');
    console.log(`   • ${peritosCreados.length} peritos creados`);
    console.log(`   • ${casosCreados.length} casos creados`);
    console.log(`   • 1 caso asignado de ejemplo\n`);

    console.log('👥 PERITOS CREADOS:');
    peritosCreados.forEach(p => {
      console.log(`   • Cédula: ${p.cedula} | Nombre: ${p.nombre} | Password: ${p.password}`);
    });

    console.log('\n📱 CREDENCIALES PARA LA APP MÓVIL:');
    console.log('   Usuario (Cédula): 12345678');
    console.log('   Contraseña: 123456\n');

    console.log('💻 CREDENCIALES PANEL WEB:');
    console.log('   Usuario: coordinador');
    console.log('   Contraseña: admin123\n');

    console.log('🌐 Panel Web: http://localhost:8000/index.html');
    console.log('═════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error configurando Firestore:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Ejecutar
initializeFirestore();
