/**
 * WatermarkService.js
 * Servicio para aplicar marcas de agua a imágenes con GPS, fecha, hora y datos del perito
 */

import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { PERITO_CONFIG } from '../config/peritoConfig';

export class WatermarkService {

  /**
   * Aplicar marca de agua completa a una foto
   * @param {Object} photoData - Datos de la foto capturada
   * @param {Object} metadata - Metadatos (GPS, perito, asignación)
   * @returns {Object} - Foto procesada con marca de agua
   */
  static async applyWatermark(photoData, metadata) {
    try {
      const {
        latitude,
        longitude,
        peritoNombre,
        peritoCedula,
        asignacionId,
        timestamp = new Date(),
      } = metadata;

      // Generar texto de marca de agua
      const watermarkText = this.generateWatermarkText({
        latitude,
        longitude,
        peritoNombre,
        peritoCedula,
        asignacionId,
        timestamp,
      });

      // Por ahora, solo agregamos metadatos sin modificar la imagen visualmente
      // Para marca de agua visible, necesitarías una librería como react-native-image-marker
      // o procesar en backend

      const processedPhoto = {
        ...photoData,
        watermarkApplied: true,
        watermarkText,
        metadata: {
          ...metadata,
          watermark: watermarkText,
          processedAt: new Date().toISOString(),
        },
      };

      // Guardar metadatos en archivo separado
      await this.saveMetadataFile(photoData.uri, processedPhoto.metadata);

      return processedPhoto;

    } catch (error) {
      console.error('Error aplicando marca de agua:', error);
      return photoData;
    }
  }

  /**
   * Generar texto de marca de agua
   */
  static generateWatermarkText(data) {
    const {
      latitude,
      longitude,
      peritoNombre,
      peritoCedula,
      asignacionId,
      timestamp,
    } = data;

    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timeStr = date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const lat = latitude ? latitude.toFixed(6) : 'N/A';
    const lng = longitude ? longitude.toFixed(6) : 'N/A';

    return {
      line1: `📍 GPS: ${lat}, ${lng}`,
      line2: `📅 Fecha: ${dateStr}`,
      line3: `⏰ Hora: ${timeStr}`,
      line4: `👤 Perito: ${peritoNombre || 'N/A'}`,
      line5: `🆔 CC: ${peritoCedula || 'N/A'}`,
      line6: `🏷️ Caso: ${asignacionId || 'General'}`,
      raw: {
        gps: { latitude: lat, longitude: lng },
        fecha: dateStr,
        hora: timeStr,
        perito: peritoNombre,
        cedula: peritoCedula,
        caso: asignacionId,
      },
    };
  }

  /**
   * Guardar archivo de metadatos JSON
   */
  static async saveMetadataFile(photoUri, metadata) {
    try {
      const fileName = photoUri.split('/').pop();
      const metadataFileName = fileName.replace(/\.(jpg|jpeg|png)$/i, '_metadata.json');
      const metadataPath = photoUri.replace(fileName, metadataFileName);

      const metadataJson = JSON.stringify(metadata, null, 2);
      await FileSystem.writeAsStringAsync(metadataPath, metadataJson);

      console.log('Metadatos guardados:', metadataPath);
      return metadataPath;

    } catch (error) {
      console.error('Error guardando metadatos:', error);
      return null;
    }
  }

  /**
   * Leer metadatos de una foto
   */
  static async readMetadataFile(photoUri) {
    try {
      const fileName = photoUri.split('/').pop();
      const metadataFileName = fileName.replace(/\.(jpg|jpeg|png)$/i, '_metadata.json');
      const metadataPath = photoUri.replace(fileName, metadataFileName);

      const metadataJson = await FileSystem.readAsStringAsync(metadataPath);
      return JSON.parse(metadataJson);

    } catch (error) {
      console.error('Error leyendo metadatos:', error);
      return null;
    }
  }

  /**
   * Crear miniatura de la foto
   */
  static async createThumbnail(photoUri, size = 200) {
    try {
      const manipResult = await manipulateAsync(
        photoUri,
        [{ resize: { width: size } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );

      return manipResult.uri;

    } catch (error) {
      console.error('Error creando miniatura:', error);
      return photoUri;
    }
  }

  /**
   * Comprimir foto para optimizar almacenamiento
   */
  static async compressPhoto(photoUri, quality = 0.8) {
    try {
      const manipResult = await manipulateAsync(
        photoUri,
        [],
        { compress: quality, format: SaveFormat.JPEG }
      );

      return manipResult.uri;

    } catch (error) {
      console.error('Error comprimiendo foto:', error);
      return photoUri;
    }
  }

  /**
   * Generar nombre de archivo único
   */
  static generateFileName(asignacionId, peritoCedula, extension = 'jpg') {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0];

    const asignacion = asignacionId || 'GENERAL';
    const perito = peritoCedula || 'UNKNOWN';

    return `PERITO_${perito}_CASO_${asignacion}_${timestamp}.${extension}`;
  }

  /**
   * Obtener ruta de carpeta para una asignación específica
   */
  static getFolderPath(peritoCedula, asignacionId) {
    const peritoFolder = PERITO_CONFIG.ONEDRIVE_FOLDERS[peritoCedula] ||
                        `/Perito_Apps/Perito_${peritoCedula}`;

    if (asignacionId) {
      return `${peritoFolder}/Caso_${asignacionId}`;
    }

    return `${peritoFolder}/General`;
  }

  /**
   * Validar que la foto tiene coordenadas GPS
   */
  static validateGPSData(metadata) {
    const { latitude, longitude } = metadata;

    if (!latitude || !longitude) {
      return {
        valid: false,
        message: 'Coordenadas GPS no disponibles',
      };
    }

    // Validar rangos válidos
    if (latitude < -90 || latitude > 90) {
      return {
        valid: false,
        message: 'Latitud fuera de rango válido',
      };
    }

    if (longitude < -180 || longitude > 180) {
      return {
        valid: false,
        message: 'Longitud fuera de rango válido',
      };
    }

    return {
      valid: true,
      message: 'Coordenadas GPS válidas',
    };
  }

  /**
   * Obtener resumen de foto para mostrar en lista
   */
  static getPhotoSummary(metadata) {
    const watermark = metadata.watermark || {};

    return {
      id: metadata.fileName || 'unknown',
      ubicacion: watermark.raw?.gps || { latitude: 'N/A', longitude: 'N/A' },
      fecha: watermark.raw?.fecha || 'N/A',
      hora: watermark.raw?.hora || 'N/A',
      perito: watermark.raw?.perito || 'N/A',
      caso: watermark.raw?.caso || 'N/A',
      sincronizado: metadata.sincronizado || false,
    };
  }
}

export default WatermarkService;
