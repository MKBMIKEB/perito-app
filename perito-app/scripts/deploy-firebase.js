#!/usr/bin/env node

/**
 * Script de despliegue a Firebase App Distribution
 * Perito App - Automatización de despliegue
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  PROJECT_ID: 'savia-424d0',
  APP_ID: '1:273873873725:android:32d55788c3cc7293733354',
  GROUPS: 'testers',
  PROFILE: 'firebase-dist'
};

console.log('🚀 Iniciando despliegue a Firebase App Distribution...\n');

try {
  // 1. Verificar autenticación
  console.log('1️⃣ Verificando autenticación EAS...');
  execSync('eas whoami', { stdio: 'inherit' });

  // 2. Build APK
  console.log('\n2️⃣ Construyendo APK...');
  execSync(`eas build --platform android --profile ${CONFIG.PROFILE} --non-interactive`, { 
    stdio: 'inherit' 
  });

  // 3. Obtener URL del APK (esto lo haríamos manualmente por ahora)
  console.log('\n3️⃣ APK construido exitosamente!');
  console.log('📋 Próximos pasos manuales:');
  console.log('   1. Ir a https://expo.dev/builds');
  console.log('   2. Descargar el APK generado');
  console.log('   3. Subir a Firebase App Distribution');

  console.log('\n✅ Script de despliegue completado!');

} catch (error) {
  console.error('❌ Error en el despliegue:', error.message);
  process.exit(1);
}