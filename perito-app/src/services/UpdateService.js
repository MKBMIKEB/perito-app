/**
 * UpdateService
 * Sistema de actualizaciones automáticas para Perito App
 */

import * as Updates from 'expo-updates';
import * as Application from 'expo-application';
import { Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from './NotificationService-native';

class UpdateServiceClass {
  constructor() {
    this.currentVersion = Application.nativeApplicationVersion;
    this.buildVersion = Application.nativeBuildVersion;
    this.isUpdateAvailable = false;
    this.updateInfo = null;
    
    // URLs de configuración
    this.config = {
      // Firebase App Distribution
      firebaseDistributionUrl: 'https://appdistribution.firebase.dev/i/your-app-id',
      
      // API propia para verificar versiones
      versionCheckUrl: 'https://tu-api.com/perito-app/version-check',
      
      // Configuración Expo Updates
      expoUpdatesEnabled: true,
      
      // Configuración de verificación automática
      autoCheckInterval: 24 * 60 * 60 * 1000, // 24 horas
    };

    console.log(`📱 UpdateService iniciado - Versión: ${this.currentVersion} (${this.buildVersion})`);
  }

  /**
   * 🚀 EXPO UPDATES - Actualizaciones OTA
   */
  async checkForExpoUpdates() {
    try {
      console.log('🔍 Verificando actualizaciones Expo...');

      if (!Updates.isEnabled) {
        console.log('⚠️ Expo Updates deshabilitado en desarrollo');
        return { available: false, reason: 'disabled_in_dev' };
      }

      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        console.log('✅ Actualización Expo disponible');
        this.updateInfo = update;
        this.isUpdateAvailable = true;
        
        // Mostrar notificación al usuario
        await this.showExpoUpdateNotification();
        
        return { available: true, type: 'expo', info: update };
      } else {
        console.log('✅ App está actualizada (Expo)');
        return { available: false, reason: 'up_to_date' };
      }

    } catch (error) {
      console.error('❌ Error verificando actualizaciones Expo:', error);
      return { available: false, error: error.message };
    }
  }

  async downloadAndApplyExpoUpdate() {
    try {
      console.log('📥 Descargando actualización Expo...');
      
      await Updates.fetchUpdateAsync();
      
      Alert.alert(
        '🎉 Actualización Lista',
        'La actualización se ha descargado. La aplicación se reiniciará para aplicar los cambios.',
        [
          {
            text: 'Reiniciar Ahora',
            onPress: () => Updates.reloadAsync()
          },
          {
            text: 'Después',
            style: 'cancel'
          }
        ]
      );

      return { success: true };

    } catch (error) {
      console.error('❌ Error aplicando actualización Expo:', error);
      Alert.alert('Error', 'No se pudo aplicar la actualización');
      return { success: false, error: error.message };
    }
  }

  async showExpoUpdateNotification() {
    Alert.alert(
      '🔄 Actualización Disponible',
      'Hay una nueva versión de Perito App disponible con mejoras y correcciones.',
      [
        {
          text: 'Actualizar',
          onPress: () => this.downloadAndApplyExpoUpdate()
        },
        {
          text: 'Después',
          style: 'cancel'
        }
      ]
    );
  }

  /**
   * 🔥 FIREBASE APP DISTRIBUTION
   */
  async checkFirebaseDistribution() {
    try {
      console.log('🔍 Verificando Firebase App Distribution...');

      const response = await fetch(`${this.config.versionCheckUrl}?current=${this.currentVersion}`);
      const data = await response.json();

      if (data.hasUpdate) {
        console.log('✅ Nueva versión disponible en Firebase:', data.latestVersion);
        
        await this.showFirebaseUpdateNotification(data);
        
        return { 
          available: true, 
          type: 'firebase', 
          currentVersion: this.currentVersion,
          latestVersion: data.latestVersion,
          downloadUrl: data.downloadUrl,
          releaseNotes: data.releaseNotes
        };
      }

      return { available: false, reason: 'up_to_date' };

    } catch (error) {
      console.error('❌ Error verificando Firebase Distribution:', error);
      return { available: false, error: error.message };
    }
  }

  async showFirebaseUpdateNotification(updateData) {
    const message = `Versión ${updateData.latestVersion} disponible\n\n${updateData.releaseNotes || 'Mejoras y correcciones'}`;

    Alert.alert(
      '🔄 Nueva Versión',
      message,
      [
        {
          text: 'Descargar',
          onPress: () => this.downloadFromFirebase(updateData.downloadUrl)
        },
        {
          text: 'Ver Detalles',
          onPress: () => this.showUpdateDetails(updateData)
        },
        {
          text: 'Después',
          style: 'cancel'
        }
      ]
    );
  }

  async downloadFromFirebase(downloadUrl) {
    try {
      const canOpen = await Linking.canOpenURL(downloadUrl);
      
      if (canOpen) {
        await Linking.openURL(downloadUrl);
      } else {
        Alert.alert('Error', 'No se puede abrir el enlace de descarga');
      }

    } catch (error) {
      console.error('❌ Error abriendo enlace:', error);
      Alert.alert('Error', 'No se pudo abrir la descarga');
    }
  }

  /**
   * 📱 GOOGLE PLAY IN-APP UPDATES
   */
  async checkPlayStoreUpdate() {
    // Nota: Requiere implementación nativa para funcionar completamente
    try {
      console.log('🔍 Verificando Google Play Store...');
      
      // Esta función requeriría un módulo nativo o una librería especializada
      // como react-native-in-app-update
      
      return { 
        available: false, 
        reason: 'requires_native_implementation',
        message: 'Implementar con react-native-in-app-update'
      };

    } catch (error) {
      console.error('❌ Error verificando Play Store:', error);
      return { available: false, error: error.message };
    }
  }

  /**
   * 🔄 VERIFICACIÓN AUTOMÁTICA
   */
  async performFullUpdateCheck() {
    try {
      console.log('🔍 Realizando verificación completa de actualizaciones...');

      const results = {
        expo: await this.checkForExpoUpdates(),
        firebase: await this.checkFirebaseDistribution(),
        playStore: await this.checkPlayStoreUpdate(),
        timestamp: new Date().toISOString()
      };

      // Guardar resultado de última verificación
      await AsyncStorage.setItem('lastUpdateCheck', JSON.stringify(results));

      // Determinar prioridad de actualización
      if (results.expo.available) {
        console.log('🚀 Prioridad: Actualización Expo (más rápida)');
        return results.expo;
      } else if (results.firebase.available) {
        console.log('🔥 Prioridad: Actualización Firebase');
        return results.firebase;
      } else if (results.playStore.available) {
        console.log('📱 Prioridad: Actualización Play Store');
        return results.playStore;
      }

      console.log('✅ App completamente actualizada');
      return { available: false, allResults: results };

    } catch (error) {
      console.error('❌ Error en verificación completa:', error);
      return { available: false, error: error.message };
    }
  }

  /**
   * ⏰ CONFIGURAR VERIFICACIÓN AUTOMÁTICA
   */
  startAutoUpdateCheck() {
    console.log('⏰ Iniciando verificación automática de actualizaciones');

    // Verificar inmediatamente
    setTimeout(() => this.performFullUpdateCheck(), 5000);

    // Verificar periódicamente
    setInterval(() => {
      console.log('⏰ Verificación automática programada');
      this.performFullUpdateCheck();
    }, this.config.autoCheckInterval);
  }

  /**
   * 📊 INFORMACIÓN DE VERSIÓN
   */
  async getVersionInfo() {
    try {
      const lastCheck = await AsyncStorage.getItem('lastUpdateCheck');
      const updateHistory = await AsyncStorage.getItem('updateHistory') || '[]';

      return {
        current: {
          version: this.currentVersion,
          build: this.buildVersion,
          platform: 'Android'
        },
        lastCheck: lastCheck ? JSON.parse(lastCheck) : null,
        history: JSON.parse(updateHistory),
        config: this.config
      };

    } catch (error) {
      console.error('❌ Error obteniendo info de versión:', error);
      return null;
    }
  }

  /**
   * 📝 MOSTRAR DETALLES DE ACTUALIZACIÓN
   */
  showUpdateDetails(updateData) {
    const details = `
📱 Versión Actual: ${this.currentVersion}
🆕 Nueva Versión: ${updateData.latestVersion}
📅 Fecha: ${updateData.releaseDate || 'No disponible'}

📋 Novedades:
${updateData.releaseNotes || 'Mejoras generales y corrección de errores'}

🔗 Tipo: ${updateData.type || 'Firebase App Distribution'}
    `;

    Alert.alert('📋 Detalles de Actualización', details, [
      { text: 'Cerrar', style: 'cancel' }
    ]);
  }

  /**
   * ⚙️ CONFIGURACIÓN DE ACTUALIZACIONES
   */
  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    await AsyncStorage.setItem('updateConfig', JSON.stringify(this.config));
    console.log('⚙️ Configuración de actualizaciones actualizada');
  }

  /**
   * 🔄 FORZAR VERIFICACIÓN MANUAL
   */
  async forceUpdateCheck() {
    console.log('🔄 Verificación manual forzada');
    
    // Mostrar indicador de carga
    Alert.alert('🔍 Verificando', 'Buscando actualizaciones...');
    
    const result = await this.performFullUpdateCheck();
    
    if (!result.available) {
      Alert.alert('✅ Actualizado', 'Tu app está en la versión más reciente');
    }

    return result;
  }
}

// Exportar instancia singleton
export const UpdateService = new UpdateServiceClass();