/**
 * firebase-deploy.js
 * Script para desplegar APK a Firebase App Distribution
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración Firebase App Distribution
const FIREBASE_CONFIG = {
  projectId: 'savia-424d0',
  appId: '1:123456789:android:abcdef123456789', // Tu App ID de Firebase
  
  // Grupos de distribución
  groups: {
    internal: 'internal-testers',
    perito: 'perito-team', 
    clients: 'client-preview'
  },
  
  // Rutas de archivos
  apkPath: '../android/app/build/outputs/apk/release/app-release.apk',
  serviceAccountKey: './firebase-service-account.json',
  
  // Configuración de release
  releaseNotes: {
    file: './RELEASE_NOTES.txt',
    default: 'Nueva versión con mejoras y correcciones'
  }
};

class FirebaseDistributionDeployer {
  constructor() {
    this.config = FIREBASE_CONFIG;
    console.log('🔥 Firebase App Distribution Deployer iniciado');
  }

  /**
   * Verificar dependencias
   */
  checkDependencies() {
    try {
      console.log('🔍 Verificando dependencias...');
      
      // Verificar Firebase CLI
      execSync('firebase --version', { stdio: 'ignore' });
      console.log('✅ Firebase CLI instalado');
      
      // Verificar APK existe
      if (!fs.existsSync(this.config.apkPath)) {
        throw new Error(`APK no encontrado en: ${this.config.apkPath}`);
      }
      console.log('✅ APK encontrado');
      
      return true;
    } catch (error) {
      console.error('❌ Error verificando dependencias:', error.message);
      return false;
    }
  }

  /**
   * Generar release notes automáticas
   */
  generateReleaseNotes() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('../package.json', 'utf8'));
      const version = packageJson.version;
      const date = new Date().toLocaleDateString('es-CO');
      
      // Intentar leer notas personalizadas
      let customNotes = '';
      if (fs.existsSync(this.config.releaseNotes.file)) {
        customNotes = fs.readFileSync(this.config.releaseNotes.file, 'utf8');
      }
      
      const releaseNotes = `
📱 Perito App v${version}
📅 Fecha: ${date}

${customNotes || this.config.releaseNotes.default}

🔧 Funcionalidades incluidas:
• Sistema de fotografía con marca de agua GPS
• Integración con Microsoft OneDrive
• Gestión de asignaciones de peritaje
• Sincronización automática de datos
• Modo offline completo

🚀 Para instalar:
1. Descarga el APK
2. Habilita "Instalar desde fuentes desconocidas"
3. Ejecuta la instalación
4. Inicia sesión con tus credenciales

📞 Soporte: soporte@ingenierialegal.com
      `.trim();

      return releaseNotes;
    } catch (error) {
      console.error('❌ Error generando release notes:', error);
      return this.config.releaseNotes.default;
    }
  }

  /**
   * Desplegar a Firebase App Distribution
   */
  async deployToFirebase(group = 'internal') {
    try {
      console.log(`🚀 Iniciando despliegue a Firebase (${group})...`);
      
      if (!this.checkDependencies()) {
        throw new Error('Dependencias no satisfechas');
      }

      const releaseNotes = this.generateReleaseNotes();
      const groupName = this.config.groups[group] || group;
      
      // Crear archivo temporal con release notes
      const notesFile = './temp-release-notes.txt';
      fs.writeFileSync(notesFile, releaseNotes);

      // Comando Firebase CLI
      const command = `firebase appdistribution:distribute ${this.config.apkPath} \
        --app ${this.config.appId} \
        --groups ${groupName} \
        --release-notes-file ${notesFile}`;

      console.log('📤 Subiendo APK a Firebase...');
      const output = execSync(command, { encoding: 'utf8' });
      
      console.log('✅ Despliegue exitoso!');
      console.log(output);

      // Limpiar archivo temporal
      if (fs.existsSync(notesFile)) {
        fs.unlinkSync(notesFile);
      }

      return {
        success: true,
        group: groupName,
        apkPath: this.config.apkPath,
        releaseNotes: releaseNotes
      };

    } catch (error) {
      console.error('❌ Error en despliegue:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Desplegar a múltiples grupos
   */
  async deployToMultipleGroups(groups = ['internal']) {
    console.log(`🎯 Desplegando a múltiples grupos: ${groups.join(', ')}`);
    
    const results = [];
    
    for (const group of groups) {
      console.log(`\n📤 Desplegando a grupo: ${group}`);
      const result = await this.deployToFirebase(group);
      results.push({ group, ...result });
      
      // Pausa entre despliegues
      if (groups.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    return results;
  }

  /**
   * Configurar Firebase proyecto
   */
  setupFirebaseProject() {
    try {
      console.log('⚙️ Configurando proyecto Firebase...');
      
      // Login a Firebase
      console.log('🔐 Iniciando sesión en Firebase...');
      execSync('firebase login', { stdio: 'inherit' });
      
      // Inicializar proyecto si no existe
      if (!fs.existsSync('../firebase.json')) {
        console.log('🔧 Inicializando proyecto Firebase...');
        execSync('firebase init', { stdio: 'inherit', cwd: '..' });
      }
      
      // Verificar configuración App Distribution
      execSync('firebase apps:list', { stdio: 'inherit' });
      
      console.log('✅ Configuración Firebase completada');
      return true;
      
    } catch (error) {
      console.error('❌ Error configurando Firebase:', error.message);
      return false;
    }
  }

  /**
   * Obtener estadísticas de distribución
   */
  async getDistributionStats() {
    try {
      console.log('📊 Obteniendo estadísticas de distribución...');
      
      const command = `firebase appdistribution:releases:list --app ${this.config.appId}`;
      const output = execSync(command, { encoding: 'utf8' });
      
      console.log(output);
      return output;
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.message);
      return null;
    }
  }
}

// Funciones CLI
async function main() {
  const deployer = new FirebaseDistributionDeployer();
  
  const args = process.argv.slice(2);
  const command = args[0] || 'deploy';
  const group = args[1] || 'internal';
  
  switch (command) {
    case 'setup':
      deployer.setupFirebaseProject();
      break;
      
    case 'deploy':
      await deployer.deployToFirebase(group);
      break;
      
    case 'deploy-all':
      await deployer.deployToMultipleGroups(['internal', 'perito']);
      break;
      
    case 'stats':
      await deployer.getDistributionStats();
      break;
      
    default:
      console.log(`
🔥 Firebase App Distribution Deployer

Comandos disponibles:
  npm run deploy:firebase setup     - Configurar Firebase
  npm run deploy:firebase deploy    - Desplegar a internal
  npm run deploy:firebase deploy perito - Desplegar a grupo específico
  npm run deploy:firebase deploy-all - Desplegar a todos los grupos
  npm run deploy:firebase stats     - Ver estadísticas
  
Ejemplos:
  node scripts/firebase-deploy.js deploy internal
  node scripts/firebase-deploy.js deploy perito
  node scripts/firebase-deploy.js deploy-all
      `);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { FirebaseDistributionDeployer };