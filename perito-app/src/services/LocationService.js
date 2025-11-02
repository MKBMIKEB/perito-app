/**
 * LocationService.js
 * Servicio de geolocalización
 */

import * as Location from 'expo-location';

export class LocationService {
  static async getCurrentLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Permisos de ubicación denegados');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      precision: location.coords.accuracy,
      timestamp: new Date().toISOString(),
    };
  }

  static async startLocationTracking(asignacionId) {
    await Location.startLocationUpdatesAsync('background-location', {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60000,
      distanceInterval: 50,
    });
  }

  static async stopLocationTracking() {
    await Location.stopLocationUpdatesAsync('background-location');
  }
}