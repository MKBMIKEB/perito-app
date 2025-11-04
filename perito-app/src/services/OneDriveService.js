/**
 * OneDriveService
 * Servicio para gestionar la subida de archivos a OneDrive
 */

import * as FileSystem from 'expo-file-system';
import { PERITO_CONFIG, PeritoConfigUtils } from '../config/peritoConfig';

class OneDriveServiceClass {
  constructor() {
    this.baseURL = PERITO_CONFIG.MICROSOFT_CONFIG.GRAPH_BASE_URL;
    this.accessToken = null;
    this.msalInstance = null;
    
    // Configuración Microsoft OneDrive
    this.clientId = PERITO_CONFIG.MICROSOFT_CONFIG.CLIENT_ID;
    this.authority = PERITO_CONFIG.MICROSOFT_CONFIG.AUTHORITY;
    this.redirectUri = PERITO_CONFIG.MICROSOFT_CONFIG.REDIRECT_URI;
    this.scopes = PERITO_CONFIG.MICROSOFT_CONFIG.SCOPES;
    
    console.log('📁 Microsoft OneDrive Service iniciado');
    console.log('🔧 Peritos configurados:', Object.keys(PERITO_CONFIG.ONEDRIVE_FOLDERS).length);
  }

  /**
   * Configurar token de acceso a OneDrive
   */
  setAccessToken(token) {
    this.accessToken = token;
  }

  /**
   * Obtener carpeta de Microsoft OneDrive para un perito específico
   */
  getPeritoFolder(peritoCedula) {
    return PeritoConfigUtils.getOneDriveFolder(peritoCedula);
  }

  /**
   * Configurar nueva carpeta para un perito
   */
  setPeritoFolder(peritoCedula, folderPath) {
    PERITO_CONFIG.ONEDRIVE_FOLDERS[peritoCedula] = folderPath;
    console.log(`📁 Carpeta Microsoft OneDrive configurada para perito ${peritoCedula}: ${folderPath}`);
    
    // En producción, guardar en base de datos o AsyncStorage
    // await AsyncStorage.setItem(`perito_${peritoCedula}_folder`, folderPath);
  }

  /**
   * Subir foto a OneDrive con organización por caso
   * @param {Object} photoData - Datos de la foto
   * @param {String} peritoCedula - Cédula del perito
   * @param {String} asignacionId - ID de la asignación
   * @param {Boolean} isRetry - Si es un reintento de sincronización (no guardar localmente de nuevo)
   */
  async uploadPhoto(photoData, peritoCedula, asignacionId = null, isRetry = false) {
    try {
      if (!this.accessToken) {
        // Si es un reintento, no volver a guardar localmente
        if (isRetry) {
          console.log('⚠️ No hay token de OneDrive, omitiendo reintento');
          return { success: false, error: 'No OneDrive token available', pendingSync: true };
        }
        console.log('⚠️ No hay token de OneDrive, guardando localmente');
        return this.savePhotoLocally(photoData, peritoCedula, asignacionId);
      }

      // Construir ruta de carpeta organizada
      const folder = this.buildFolderPath(peritoCedula, asignacionId);
      const fileName = photoData.fileName || PeritoConfigUtils.generateFileName(asignacionId || 'GENERAL');

      console.log(`📁 Subiendo a OneDrive: ${folder}/${fileName}`);

      // Crear carpeta si no existe
      await this.ensureFolderExists(folder);

      // Leer el archivo
      const fileContent = await FileSystem.readAsStringAsync(photoData.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Subir a OneDrive usando Microsoft Graph API
      const uploadUrl = `${this.baseURL}/me/drive/root:${folder}/${fileName}:/content`;

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'image/jpeg',
        },
        body: fileContent,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Archivo subido a OneDrive:', result.name);

        // También subir metadatos si existen
        if (photoData.metadata) {
          await this.uploadMetadata(photoData.metadata, folder);
        }

        return {
          success: true,
          oneDrivePath: `${folder}/${fileName}`,
          oneDriveId: result.id,
          webUrl: result.webUrl,
          result,
        };
      } else {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

    } catch (error) {
      console.error('❌ Error en uploadPhoto:', error);
      // Fallback: guardar localmente para sincronización posterior
      return this.savePhotoLocally(photoData, peritoCedula, asignacionId);
    }
  }

  /**
   * Construir ruta de carpeta organizada por perito y caso
   */
  buildFolderPath(peritoCedula, asignacionId = null) {
    // Carpeta base del perito
    const peritoFolder = PERITO_CONFIG.ONEDRIVE_FOLDERS[peritoCedula] ||
                        `/Perito_Apps/Perito_${peritoCedula}`;

    // Si hay asignación, crear subcarpeta por caso
    if (asignacionId) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      return `${peritoFolder}/${year}/${month}/Caso_${asignacionId}`;
    }

    // Carpeta general
    return `${peritoFolder}/General`;
  }

  /**
   * Asegurar que existe la carpeta en OneDrive
   */
  async ensureFolderExists(folderPath) {
    try {
      if (!this.accessToken) return;

      // Verificar si la carpeta existe
      const checkUrl = `${this.baseURL}/me/drive/root:${folderPath}`;

      const checkResponse = await fetch(checkUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (checkResponse.ok) {
        console.log('✅ Carpeta existe:', folderPath);
        return true;
      }

      // Si no existe, crear carpeta (Microsoft Graph crea automáticamente)
      console.log('📁 Carpeta se creará automáticamente:', folderPath);
      return true;

    } catch (error) {
      console.log('ℹ️ La carpeta se creará al subir el primer archivo');
      return false;
    }
  }

  /**
   * Subir metadatos de la foto
   */
  async uploadMetadata(metadata, folder) {
    try {
      const metadataFileName = `${metadata.fileName}.json`;
      const metadataContent = JSON.stringify(metadata, null, 2);
      
      const uploadUrl = `${this.baseURL}/me/drive/root:${folder}/${metadataFileName}:/content`;
      
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: metadataContent,
      });

      if (response.ok) {
        console.log('Metadatos subidos exitosamente');
      }
      
    } catch (error) {
      console.error('Error subiendo metadatos:', error);
    }
  }

  /**
   * Guardar foto localmente como fallback con estructura organizada
   */
  async savePhotoLocally(photoData, peritoCedula, asignacionId = null) {
    try {
      // Construir estructura de carpetas local similar a OneDrive
      const baseDir = FileSystem.documentDirectory + 'perito_photos/';
      const peritoDir = `${baseDir}Perito_${peritoCedula}/`;

      let targetDir;
      if (asignacionId) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        targetDir = `${peritoDir}${year}/${month}/Caso_${asignacionId}/`;
      } else {
        targetDir = `${peritoDir}General/`;
      }

      // Crear estructura de directorios
      const dirInfo = await FileSystem.getInfoAsync(targetDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
      }

      const fileName = photoData.fileName || `photo_${Date.now()}.jpg`;
      const localPath = targetDir + fileName;

      // Copiar archivo solo si origen y destino son diferentes
      if (photoData.uri !== localPath) {
        await FileSystem.copyAsync({
          from: photoData.uri,
          to: localPath,
        });
        console.log(`📋 Foto copiada: ${photoData.uri} → ${localPath}`);
      } else {
        console.log(`ℹ️ Foto ya está en la ubicación correcta: ${localPath}`);
      }

      // Guardar metadatos si existen
      if (photoData.metadata) {
        const metadataPath = localPath.replace(/\.(jpg|jpeg)$/i, '_metadata.json');
        await FileSystem.writeAsStringAsync(
          metadataPath,
          JSON.stringify(photoData.metadata, null, 2)
        );
      }

      // Guardar en cola de sincronización
      await this.addToSyncQueue({
        localPath,
        fileName,
        peritoCedula,
        asignacionId,
        metadata: photoData.metadata,
        timestamp: new Date().toISOString(),
      });

      console.log('💾 Foto guardada localmente:', localPath);

      return {
        success: true,
        localPath: localPath,
        pendingSync: true,
        message: 'Foto guardada localmente. Se sincronizará con OneDrive cuando haya conexión.',
      };

    } catch (error) {
      console.error('❌ Error guardando foto localmente:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Agregar foto a cola de sincronización
   */
  async addToSyncQueue(photoInfo) {
    try {
      const queueFile = FileSystem.documentDirectory + 'sync_queue.json';

      let queue = [];
      const fileInfo = await FileSystem.getInfoAsync(queueFile);

      if (fileInfo.exists) {
        const queueContent = await FileSystem.readAsStringAsync(queueFile);
        queue = JSON.parse(queueContent);
      }

      queue.push(photoInfo);

      await FileSystem.writeAsStringAsync(queueFile, JSON.stringify(queue, null, 2));
      console.log(`📋 Foto agregada a cola de sincronización (${queue.length} pendientes)`);

    } catch (error) {
      console.error('Error agregando a cola de sincronización:', error);
    }
  }

  /**
   * Obtener cola de sincronización
   */
  async getSyncQueue() {
    try {
      const queueFile = FileSystem.documentDirectory + 'sync_queue.json';
      const fileInfo = await FileSystem.getInfoAsync(queueFile);

      if (!fileInfo.exists) {
        return [];
      }

      const queueContent = await FileSystem.readAsStringAsync(queueFile);
      return JSON.parse(queueContent);

    } catch (error) {
      console.error('Error leyendo cola de sincronización:', error);
      return [];
    }
  }

  /**
   * Sincronizar fotos pendientes de la cola
   */
  async syncPendingPhotos() {
    try {
      const queue = await this.getSyncQueue();

      if (queue.length === 0) {
        console.log('✅ No hay fotos pendientes de sincronización');
        return { success: true, synced: 0, failed: 0 };
      }

      console.log(`🔄 Sincronizando ${queue.length} fotos pendientes...`);

      let synced = 0;
      let failed = 0;
      const remainingQueue = [];

      for (const item of queue) {
        try {
          const photoData = {
            uri: item.localPath,
            fileName: item.fileName,
            metadata: item.metadata,
          };

          const result = await this.uploadPhoto(
            photoData,
            item.peritoCedula,
            item.asignacionId,
            true // isRetry = true para evitar guardar localmente de nuevo
          );

          if (result.success) {
            synced++;
            console.log(`✅ Sincronizado: ${item.fileName}`);
          } else {
            failed++;
            remainingQueue.push(item);
          }

        } catch (error) {
          console.error(`❌ Error sincronizando ${item.fileName}:`, error);
          failed++;
          remainingQueue.push(item);
        }

        // Pausa entre uploads para no saturar
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Actualizar cola solo con los que fallaron
      const queueFile = FileSystem.documentDirectory + 'sync_queue.json';
      await FileSystem.writeAsStringAsync(
        queueFile,
        JSON.stringify(remainingQueue, null, 2)
      );

      console.log(`🎯 Sincronización completada: ${synced} exitosas, ${failed} fallidas`);

      return {
        success: true,
        synced,
        failed,
        remaining: remainingQueue.length,
      };

    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sincronizar fotos locales con OneDrive
   */
  async syncLocalPhotos() {
    try {
      const documentsDir = FileSystem.documentDirectory + 'perito_photos/';
      const dirInfo = await FileSystem.getInfoAsync(documentsDir);
      
      if (!dirInfo.exists) {
        console.log('No hay fotos locales para sincronizar');
        return;
      }

      const files = await FileSystem.readDirectoryAsync(documentsDir);
      const photoFiles = files.filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg'));
      
      console.log(`Sincronizando ${photoFiles.length} fotos locales...`);
      
      for (const file of photoFiles) {
        const filePath = documentsDir + file;
        const photoData = {
          uri: filePath,
          fileName: file,
        };
        
        // Intentar subir cada foto
        await this.uploadPhoto(photoData);
        
        // Pequeña pausa entre uploads
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('Sincronización completada');
      
    } catch (error) {
      console.error('Error sincronizando fotos:', error);
    }
  }

  /**
   * Autenticar con Microsoft OneDrive usando Graph API
   */
  async authenticateWithMicrosoft() {
    try {
      // Configuración para Microsoft OneDrive
      console.log('Iniciando autenticación con Microsoft OneDrive...');
      
      // En producción, implementar MSAL (Microsoft Authentication Library)
      const msalConfig = {
        auth: {
          clientId: 'TU_CLIENT_ID_AZURE', // Obtener de Azure App Registration
          authority: 'https://login.microsoftonline.com/common',
          redirectUri: 'msauth.com.ingenierialegal.saviaapp://auth', // URI personalizada
        },
        scopes: [
          'https://graph.microsoft.com/Files.ReadWrite',
          'https://graph.microsoft.com/Files.ReadWrite.All',
          'https://graph.microsoft.com/User.Read'
        ]
      };
      
      // Para desarrollo/testing, puedes usar un token temporal
      // En producción, implementar el flujo OAuth completo
      
      return {
        success: false, // Cambiar a true cuando configures Azure
        message: 'Para habilitar Microsoft OneDrive:\n\n1. Registra la app en Azure Portal\n2. Configura Client ID en el código\n3. Habilita permisos Microsoft Graph\n\nMientras tanto, las fotos se guardan localmente.',
        config: msalConfig,
      };
      
    } catch (error) {
      console.error('Error autenticando Microsoft OneDrive:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtener estadísticas de almacenamiento
   */
  async getStorageStats() {
    try {
      const localDir = FileSystem.documentDirectory + 'perito_photos/';
      const dirInfo = await FileSystem.getInfoAsync(localDir);
      
      if (!dirInfo.exists) {
        return {
          localPhotos: 0,
          localSizeMB: 0,
          oneDriveConnected: !!this.accessToken,
        };
      }

      const files = await FileSystem.readDirectoryAsync(localDir);
      const photoFiles = files.filter(file => 
        file.endsWith('.jpg') || file.endsWith('.jpeg')
      );

      let totalSize = 0;
      for (const file of photoFiles) {
        const fileInfo = await FileSystem.getInfoAsync(localDir + file);
        totalSize += fileInfo.size || 0;
      }

      return {
        localPhotos: photoFiles.length,
        localSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        oneDriveConnected: !!this.accessToken,
      };
      
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        localPhotos: 0,
        localSizeMB: 0,
        oneDriveConnected: false,
        error: error.message,
      };
    }
  }
}

// Exportar instancia singleton
export const OneDriveService = new OneDriveServiceClass();