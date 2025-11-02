/**
 * Script de prueba para insertar datos en la base de datos
 * Ejecutar con: node scripts/test-insert.js
 */

require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function testInsert() {
  try {
    console.log('🔌 Conectando a Azure SQL Database...');
    const pool = await sql.connect(config);
    console.log('✅ Conectado exitosamente');

    // Verificar casos existentes
    console.log('\n📊 Verificando casos existentes...');
    const countResult = await pool.request().query('SELECT COUNT(*) as total FROM Casos');
    console.log(`   Total de casos: ${countResult.recordset[0].total}`);

    if (countResult.recordset[0].total === 0) {
      console.log('\n➕ Insertando casos de prueba...');

      await pool.request().query(`
        INSERT INTO Casos (codigo, direccion, ciudad, barrio, tipoInmueble, estado, prioridad, coordinadorId)
        VALUES
        ('CASO-001', 'Calle 123 #45-67', 'Bogotá', 'Chapinero', 'Apartamento', 'pendiente', 'alta', 'admin'),
        ('CASO-002', 'Carrera 7 #32-16', 'Bogotá', 'Teusaquillo', 'Casa', 'pendiente', 'media', 'admin'),
        ('CASO-003', 'Avenida 68 #98-23', 'Bogotá', 'Suba', 'Local Comercial', 'pendiente', 'baja', 'admin')
      `);

      console.log('✅ 3 casos insertados exitosamente');
    }

    // Listar todos los casos
    console.log('\n📋 Listando todos los casos:');
    const result = await pool.request().query('SELECT * FROM Casos ORDER BY id DESC');

    result.recordset.forEach(caso => {
      console.log(`   - ${caso.codigo}: ${caso.direccion} (${caso.estado})`);
    });

    console.log(`\n✅ Total: ${result.recordset.length} casos en la base de datos`);

    await pool.close();
    console.log('\n🎉 Script completado exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detalles:', error);
  }
}

testInsert();
