/**
 * NotificationService.js
 * Servicio de notificaciones
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class NotificationService {
  static async configure() {
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('Permisos de notificación denegados');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('trabajo-campo', {
        name: 'Trabajo de Campo',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1D4ED8',
      });
    }
  }

  static async scheduleLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null,
    });
  }
}