#!/usr/bin/env node

/**
 * Script de verificación de configuración
 * Verifica que todo esté listo para el despliegue
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Verificando configuración de despliegue...\n');

const checks = [
  {
    name: '📱 EAS CLI instalado',
    check: () => {
      try {
        execSync('eas --version', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    fix: 'npm install -g eas-cli'
  },
  {
    name: '🔐 EAS autenticado',
    check: () => {
      try {
        execSync('eas whoami', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    fix: 'eas login'
  },
  {
    name: '📋 eas.json existe',
    check: () => fs.existsSync('eas.json'),
    fix: 'Archivo eas.json creado automáticamente'
  },
  {
    name: '🔥 google-services.json existe',
    check: () => fs.existsSync('google-services.json'),
    fix: 'Archivo google-services.json creado'
  },
  {
    name: '⚙️ Firebase configurado en app.json',
    check: () => {
      const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
      return appJson.expo?.android?.googleServicesFile === './google-services.json';
    },
    fix: 'Configuración Firebase agregada a app.json'
  },
  {
    name: '📦 Dependencias instaladas',
    check: () => fs.existsSync('node_modules'),
    fix: 'npm install --legacy-peer-deps'
  }
];

let allPassed = true;

for (const check of checks) {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  
  if (!passed) {
    console.log(`   💡 Fix: ${check.fix}`);
    allPassed = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 ¡Todo está listo para el despliegue!');
  console.log('\n📋 Próximos pasos:');
  console.log('   1. npm run build:firebase');
  console.log('   2. Configurar GitHub Actions');
  console.log('   3. git push origin main');
} else {
  console.log('⚠️  Hay configuraciones pendientes.');
  console.log('   Completa los fixes sugeridos arriba.');
}

console.log('\n🔗 Guía completa: docs/DEPLOYMENT_SETUP.md');