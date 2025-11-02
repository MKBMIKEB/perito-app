/**
 * NotificationService-native.js - Servicio de notificaciones nativas
 * Reemplaza expo-notifications con react-native-push-notification
 */

// Servicio de notificaciones simplificado sin dependencias nativas
export class NotificationService {
  static async configure() {
    try {
      console.log('Configurando notificaciones (mock)...');
      
      // Mock de configuración sin PushNotification
      // En producción necesitará configuración nativa completa
      
      console.log('Notificaciones configuradas (modo mock)');
      return Promise.resolve();
    } catch (error) {
      console.error('Error configurando notificaciones:', error);
      return Promise.resolve();
    }
  }

  static async scheduleNotification(title, body, date) {
    try {
      console.log(`Mock: Programando notificación "${title}" para ${date}`);
      return Promise.resolve();
    } catch (error) {
      console.error('Error programando notificación:', error);
      return Promise.resolve();
    }
  }

  static async showNotification(title, body) {
    try {
      console.log(`Mock: Mostrando notificación "${title}": ${body}`);
      return Promise.resolve();
    } catch (error) {
      console.error('Error mostrando notificación:', error);
      return Promise.resolve();
    }
  }
}