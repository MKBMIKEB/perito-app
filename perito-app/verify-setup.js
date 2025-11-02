/**
 * Script de verificación del sistema de fotos GPS
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando sistema de captura de fotos...\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Verificar archivos de servicios
const servicesToCheck = [
  'src/services/WatermarkService.js',
  'src/services/OneDriveService.js',
  'src/services/LocationService.js'
];

console.log('📁 Verificando servicios...');
servicesToCheck.forEach(service => {
  if (fs.existsSync(service)) {
    console.log(`  ✅ ${service}`);
    checks.passed++;
  } else {
    console.log(`  ❌ ${service} - NO ENCONTRADO`);
    checks.failed++;
  }
});

// Verificar pantallas
const screensToCheck = [
  'src/screens/CameraScreen.js',
  'src/screens/PhotoManagerScreen.js',
  'src/screens/HomeScreen.js'
];

console.log('\n📱 Verificando pantallas...');
screensToCheck.forEach(screen => {
  if (fs.existsSync(screen)) {
    console.log(`  ✅ ${screen}`);
    checks.passed++;
  } else {
    console.log(`  ❌ ${screen} - NO ENCONTRADO`);
    checks.failed++;
  }
});

// Verificar App.js tiene las importaciones
console.log('\n🔧 Verificando App.js...');
const appContent = fs.readFileSync('App.js', 'utf8');
if (appContent.includes('CameraScreen')) {
  console.log('  ✅ CameraScreen importado');
  checks.passed++;
} else {
  console.log('  ❌ CameraScreen NO importado');
  checks.failed++;
}

if (appContent.includes('PhotoManagerScreen')) {
  console.log('  ✅ PhotoManagerScreen importado');
  checks.passed++;
} else {
  console.log('  ❌ PhotoManagerScreen NO importado');
  checks.failed++;
}

// Verificar configuración
console.log('\n⚙️ Verificando configuración...');
if (fs.existsSync('src/config/peritoConfig.js')) {
  console.log('  ✅ peritoConfig.js existe');
  checks.passed++;
  
  const configContent = fs.readFileSync('src/config/peritoConfig.js', 'utf8');
  if (configContent.includes('TU_CLIENT_ID_AZURE_AQUI')) {
    console.log('  ⚠️  CLIENT_ID no configurado (opcional)');
    checks.warnings++;
  } else {
    console.log('  ✅ CLIENT_ID configurado');
  }
} else {
  console.log('  ❌ peritoConfig.js NO encontrado');
  checks.failed++;
}

// Verificar dependencias en package.json
console.log('\n📦 Verificando dependencias...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
  'expo-camera',
  'expo-location',
  'expo-file-system',
  'lucide-react-native'
];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`  ✅ ${dep}`);
    checks.passed++;
  } else {
    console.log(`  ❌ ${dep} - NO INSTALADO`);
    checks.failed++;
  }
});

// Verificar expo-image-manipulator (opcional pero recomendado)
if (packageJson.dependencies['expo-image-manipulator']) {
  console.log('  ✅ expo-image-manipulator');
  checks.passed++;
} else {
  console.log('  ⚠️  expo-image-manipulator no instalado (opcional)');
  checks.warnings++;
}

// Verificar documentación
console.log('\n📄 Verificando documentación...');
const docs = [
  'CONFIGURACION_ONEDRIVE.md',
  'GUIA_DESPLIEGUE.md'
];

docs.forEach(doc => {
  if (fs.existsSync(doc)) {
    console.log(`  ✅ ${doc}`);
    checks.passed++;
  } else {
    console.log(`  ⚠️  ${doc} - NO ENCONTRADO`);
    checks.warnings++;
  }
});

// Resumen
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN DE VERIFICACIÓN');
console.log('='.repeat(50));
console.log(`✅ Verificaciones pasadas: ${checks.passed}`);
console.log(`❌ Verificaciones fallidas: ${checks.failed}`);
console.log(`⚠️  Advertencias: ${checks.warnings}`);

if (checks.failed === 0) {
  console.log('\n🎉 ¡Sistema listo para desplegar!');
  console.log('\nPróximos pasos:');
  console.log('1. npm install (si no lo has hecho)');
  console.log('2. npm run start:dev (para testing)');
  console.log('3. Configurar OneDrive CLIENT_ID (opcional)');
  process.exit(0);
} else {
  console.log('\n⚠️  Hay problemas que deben resolverse antes de desplegar');
  console.log('Revisa los archivos faltantes arriba.');
  process.exit(1);
}
