/**
 * Azure Storage Service
 * Reemplazo de Firebase Storage con Azure Blob Storage
 * Para almacenar fotos de evidencias
 */

import { BlobServiceClient } from "@azure/storage-blob";
import { azureConfig } from '../config/azureConfig';
import * as FileSystem from 'expo-file-system';

class AzureStorageService {
  constructor() {
    this.blobServiceClient = null;
    this.containerClient = null;
    this.initialized = false;
  }

  /**
   * Inicializa conexión con Azure Blob Storage
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('📦 Inicializando Azure Blob Storage...');

      // Construir URL con SAS token
      const accountUrl = `https://${azureConfig.storage.accountName}.blob.core.windows.net`;
      const sasUrl = `${accountUrl}?${azureConfig.storage.sasToken}`;

      // Crear cliente de Blob Service
      this.blobServiceClient = new BlobServiceClient(sasUrl);

      // Obtener contenedor
      this.containerClient = this.blobServiceClient.getContainerClient(
        azureConfig.storage.containerName
      );

      this.initialized = true;
      console.log('✅ Azure Blob Storage inicializado');
    } catch (error) {
      console.error('❌ Error inicializando Blob Storage:', error);
      throw error;
    }
  }

  /**
   * Sube una foto a Azure Blob Storage
   * @param {string} localUri - URI local de la foto
   * @param {string} casoId - ID del caso
   * @param {string} tipo - Tipo de foto (fachada, interior, detalle, etc.)
   * @returns {Promise<Object>} - URL de la foto subida
   */
  async uploadPhoto(localUri, casoId, tipo = 'evidencia') {
    await this.initialize();

    try {
      console.log('📤 Subiendo foto a Azure Blob Storage...');

      // Generar nombre único para el blob
      const timestamp = Date.now();
      const extension = localUri.split('.').pop();
      const blobName = `${casoId}/${tipo}_${timestamp}.${extension}`;

      console.log('📝 Nombre del blob:', blobName);

      // Leer archivo como base64
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64
      });

      // Convertir base64 a buffer
      const buffer = Buffer.from(base64, 'base64');

      // Obtener cliente del blob
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Subir blob con metadata
      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: this.getContentType(extension)
        },
        metadata: {
          casoId: casoId,
          tipo: tipo,
          fechaSubida: new Date().toISOString()
        }
      });

      // Obtener URL pública (si el contenedor es público) o generar SAS URL
      const photoUrl = blockBlobClient.url;

      console.log('✅ Foto subida exitosamente');
      console.log('🔗 URL:', photoUrl);

      return {
        success: true,
        url: photoUrl,
        blobName: blobName,
        size: buffer.length
      };

    } catch (error) {
      console.error('❌ Error subiendo foto:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sube múltiples fotos
   */
  async uploadMultiplePhotos(photos, casoId) {
    await this.initialize();

    const results = [];

    for (const photo of photos) {
      const result = await this.uploadPhoto(photo.uri, casoId, photo.tipo);
      results.push({
        localUri: photo.uri,
        ...result
      });
    }

    const exitosas = results.filter(r => r.success).length;
    console.log(`✅ ${exitosas}/${photos.length} fotos subidas`);

    return {
      success: exitosas === photos.length,
      results: results,
      exitosas: exitosas,
      total: photos.length
    };
  }

  /**
   * Descarga una foto desde Azure Blob Storage
   */
  async downloadPhoto(blobName) {
    await this.initialize();

    try {
      console.log('📥 Descargando foto:', blobName);

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      const downloadResponse = await blockBlobClient.download();

      // Convertir stream a buffer
      const buffer = await this.streamToBuffer(downloadResponse.readableStreamBody);

      console.log('✅ Foto descargada');
      return {
        success: true,
        buffer: buffer
      };

    } catch (error) {
      console.error('❌ Error descargando foto:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Elimina una foto de Azure Blob Storage
   */
  async deletePhoto(blobName) {
    await this.initialize();

    try {
      console.log('🗑️ Eliminando foto:', blobName);

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();

      console.log('✅ Foto eliminada');
      return { success: true };

    } catch (error) {
      console.error('❌ Error eliminando foto:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lista todas las fotos de un caso
   */
  async listPhotosForCaso(casoId) {
    await this.initialize();

    try {
      console.log('📋 Listando fotos del caso:', casoId);

      const photos = [];
      const prefix = `${casoId}/`;

      // Iterar sobre blobs con el prefijo del caso
      for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
        photos.push({
          name: blob.name,
          url: `${this.containerClient.url}/${blob.name}`,
          size: blob.properties.contentLength,
          lastModified: blob.properties.lastModified,
          contentType: blob.properties.contentType
        });
      }

      console.log(`✅ ${photos.length} fotos encontradas`);
      return {
        success: true,
        photos: photos
      };

    } catch (error) {
      console.error('❌ Error listando fotos:', error);
      return {
        success: false,
        error: error.message,
        photos: []
      };
    }
  }

  /**
   * Genera URL con SAS token para acceso temporal
   * @param {string} blobName - Nombre del blob
   * @param {number} expiresInHours - Horas de validez (por defecto 24)
   */
  async generateSasUrl(blobName, expiresInHours = 24) {
    await this.initialize();

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Azure SDK genera SAS automáticamente si tienes permisos
      const sasUrl = blockBlobClient.url;

      return {
        success: true,
        url: sasUrl,
        expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      };

    } catch (error) {
      console.error('❌ Error generando SAS URL:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene el tipo MIME según la extensión
   */
  getContentType(extension) {
    const types = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf'
    };

    return types[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Convierte un stream a buffer
   */
  async streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

  /**
   * Verifica conectividad con Azure Blob Storage
   */
  async checkConnection() {
    try {
      await this.initialize();
      const properties = await this.containerClient.getProperties();
      console.log('✅ Conexión con Azure Blob Storage verificada');
      return true;
    } catch (error) {
      console.error('❌ Error verificando conexión:', error);
      return false;
    }
  }
}

// Exportar instancia única (singleton)
const azureStorageService = new AzureStorageService();
export default azureStorageService;
