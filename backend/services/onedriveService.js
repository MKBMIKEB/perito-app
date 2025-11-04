/**
 * OneDrive Service
 * Operaciones específicas para gestionar archivos en OneDrive
 */

const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');
const { getAppOnlyToken } = require('../middlewares/auth');
const { GraphAPIError } = require('../middlewares/errorHandler');
const path = require('path');

const ONEDRIVE_ROOT = process.env.ONEDRIVE_FOLDER_ROOT || 'DatosPeritos';
const ONEDRIVE_USER_EMAIL = process.env.ONEDRIVE_USER_EMAIL || 'michael.ramirez@ingenierialegal.com';

class OnedriveService {
  constructor() {
    this.driveId = null;
    this.userDriveCache = {};
  }

  /**
   * Obtiene el driveId del usuario logueado
   */
  async getDriveId(client) {
    if (this.driveId) {
      return this.driveId;
    }

    try {
      // Usar /me/drive para token delegado (usuario logueado)
      const drive = await client.api('/me/drive').get();

      this.driveId = drive.id;
      console.log(`📂 Drive ID obtenido: ${this.driveId}`);
      return this.driveId;
    } catch (error) {
      console.error(`❌ Error obteniendo driveId:`, error.message);
      throw error;
    }
  }

  /**
   * Inicializa el cliente de Graph
   */
  async getClient(userToken) {
    return Client.init({
      authProvider: (done) => {
        done(null, userToken);
      }
    });
  }

  /**
   * Crea la estructura de carpetas para un caso
   * /DatosPeritos/CASO_XXX/Fotos
   * /DatosPeritos/CASO_XXX/Formularios
   */
  async crearEstructuraCaso(userToken, codigoCaso) {
    try {
      const client = await this.getClient(userToken);

      console.log(`📁 Creando estructura de carpetas para ${codigoCaso}...`);

      // Obtener driveId
      const driveId = await this.getDriveId(client);

      // 1. Verificar/crear carpeta raíz "DatosPeritos"
      const folderRaiz = await this.crearCarpetaSiNoExiste(client, 'root', ONEDRIVE_ROOT, driveId);

      // Compartir carpeta raíz con la organización
      await this.compartirCarpeta(client, driveId, folderRaiz.id, ONEDRIVE_ROOT);

      // 2. Crear carpeta del caso
      const folderCaso = await this.crearCarpetaSiNoExiste(client, folderRaiz.id, codigoCaso, driveId);

      // 3. Crear subcarpeta "Fotos"
      const folderFotos = await this.crearCarpetaSiNoExiste(client, folderCaso.id, 'Fotos', driveId);

      // 4. Crear subcarpeta "Formularios"
      const folderFormularios = await this.crearCarpetaSiNoExiste(client, folderCaso.id, 'Formularios', driveId);

      console.log(`✅ Estructura creada para ${codigoCaso}`);

      return {
        raiz: folderRaiz,
        caso: folderCaso,
        fotos: folderFotos,
        formularios: folderFormularios,
        paths: {
          fotos: `${ONEDRIVE_ROOT}/${codigoCaso}/Fotos`,
          formularios: `${ONEDRIVE_ROOT}/${codigoCaso}/Formularios`
        }
      };

    } catch (error) {
      console.error(`❌ Error creando estructura para ${codigoCaso}:`, error.message);
      throw new GraphAPIError(`Error creando carpetas del caso`, error);
    }
  }

  /**
   * Comparte una carpeta con permisos de edición para toda la organización
   */
  async compartirCarpeta(client, driveId, folderId, nombreCarpeta) {
    try {
      console.log(`🔓 Compartiendo carpeta "${nombreCarpeta}" con la organización...`);

      // Crear un link de compartición con permisos de edición para la organización
      const permission = await client
        .api(`/drives/${driveId}/items/${folderId}/createLink`)
        .post({
          type: 'edit',
          scope: 'organization'
        });

      console.log(`✅ Carpeta "${nombreCarpeta}" compartida con la organización`);
      return permission;

    } catch (error) {
      console.warn(`⚠️  No se pudo compartir carpeta "${nombreCarpeta}":`, error.message);
      // No fallar si el compartir falla, solo advertir
      return null;
    }
  }

  /**
   * Crea una carpeta si no existe, o retorna la existente
   */
  async crearCarpetaSiNoExiste(client, parentId, nombreCarpeta, driveId) {
    try {
      // Construir ruta usando driveId
      let rutaAPI;
      if (parentId === 'root') {
        rutaAPI = `/drives/${driveId}/root/children`;
      } else {
        rutaAPI = `/drives/${driveId}/items/${parentId}/children`;
      }

      // Primero intentar buscar si ya existe
      const existente = await this.buscarCarpetaEnParent(client, parentId, nombreCarpeta, driveId);
      if (existente) {
        console.log(`✅ Carpeta "${nombreCarpeta}" ya existe`);
        return existente;
      }

      // Crear nueva carpeta
      const newFolder = await client
        .api(rutaAPI)
        .post({
          name: nombreCarpeta,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'fail'
        });

      console.log(`✅ Carpeta "${nombreCarpeta}" creada`);
      return newFolder;

    } catch (error) {
      // Si falla la creación, intentar buscar de nuevo (puede que otro proceso la creó)
      try {
        const existente = await this.buscarCarpetaEnParent(client, parentId, nombreCarpeta, driveId);
        if (existente) {
          console.log(`✅ Carpeta "${nombreCarpeta}" encontrada en reintento`);
          return existente;
        }
      } catch (retryError) {
        console.error(`❌ Error en reintento buscando carpeta:`, retryError.message);
      }

      console.error(`❌ Error creando carpeta "${nombreCarpeta}":`, error.message);
      throw error;
    }
  }

  /**
   * Busca una carpeta específica dentro de un parent
   */
  async buscarCarpetaEnParent(client, parentId, nombreCarpeta, driveId) {
    try {
      let rutaBusqueda;
      if (parentId === 'root') {
        rutaBusqueda = `/drives/${driveId}/root/children`;
      } else {
        rutaBusqueda = `/drives/${driveId}/items/${parentId}/children`;
      }

      // Obtener todos los hijos y buscar manualmente
      const children = await client
        .api(rutaBusqueda)
        .get();

      // Buscar la carpeta por nombre manualmente
      const carpeta = children.value.find(item =>
        item.name === nombreCarpeta && item.folder !== undefined
      );

      return carpeta || null;
    } catch (error) {
      console.error(`⚠️  Error buscando carpeta "${nombreCarpeta}":`, error.message);
      return null;
    }
  }

  /**
   * Sube un archivo a OneDrive
   */
  async subirArchivo(userToken, codigoCaso, tipoArchivo, nombreArchivo, contenidoBuffer) {
    try {
      const client = await this.getClient(userToken);
      const driveId = await this.getDriveId(client);

      // Determinar subcarpeta según tipo
      const subcarpeta = tipoArchivo === 'foto' ? 'Fotos' : 'Formularios';
      const rutaCompleta = `${ONEDRIVE_ROOT}/${codigoCaso}/${subcarpeta}/${nombreArchivo}`;

      console.log(`📤 Subiendo archivo: ${rutaCompleta}`);

      // Para archivos pequeños (<4MB), usar PUT simple
      if (contenidoBuffer.length < 4 * 1024 * 1024) {
        const uploadedFile = await client
          .api(`/drives/${driveId}/root:/${rutaCompleta}:/content`)
          .put(contenidoBuffer);

        console.log(`✅ Archivo subido: ${nombreArchivo} (${contenidoBuffer.length} bytes)`);
        return uploadedFile;
      } else {
        // Para archivos grandes, usar upload session
        return await this.subirArchivoGrande(client, driveId, rutaCompleta, contenidoBuffer);
      }

    } catch (error) {
      console.error(`❌ Error subiendo archivo ${nombreArchivo}:`, error.message);
      throw new GraphAPIError('Error subiendo archivo a OneDrive', error);
    }
  }

  /**
   * Sube archivos grandes usando upload session (>4MB)
   */
  async subirArchivoGrande(client, driveId, rutaCompleta, contenidoBuffer) {
    try {
      console.log(`📤 Iniciando upload session para archivo grande...`);

      // Crear upload session
      const uploadSession = await client
        .api(`/drives/${driveId}/root:/${rutaCompleta}:/createUploadSession`)
        .post({
          item: {
            '@microsoft.graph.conflictBehavior': 'rename'
          }
        });

      const uploadUrl = uploadSession.uploadUrl;
      const fileSize = contenidoBuffer.length;
      const chunkSize = 327680; // 320 KB

      let uploadedBytes = 0;

      // Subir en chunks
      while (uploadedBytes < fileSize) {
        const chunk = contenidoBuffer.slice(uploadedBytes, uploadedBytes + chunkSize);
        const contentRange = `bytes ${uploadedBytes}-${uploadedBytes + chunk.length - 1}/${fileSize}`;

        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Range': contentRange,
            'Content-Length': chunk.length.toString()
          },
          body: chunk
        });

        if (!response.ok && response.status !== 202) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        uploadedBytes += chunk.length;
        console.log(`📊 Progreso: ${Math.round((uploadedBytes / fileSize) * 100)}%`);
      }

      console.log(`✅ Archivo grande subido completamente`);
      return { success: true, uploadedBytes };

    } catch (error) {
      console.error(`❌ Error en upload session:`, error.message);
      throw error;
    }
  }

  /**
   * Lista todos los archivos de un caso
   */
  async listarArchivosCaso(userToken, codigoCaso) {
    try {
      const client = await this.getClient(userToken);
      const driveId = await this.getDriveId(client);
      const rutaCaso = `${ONEDRIVE_ROOT}/${codigoCaso}`;

      console.log(`📋 Listando archivos de: ${rutaCaso}`);

      // Obtener carpeta del caso
      const casofolder = await client
        .api(`/drives/${driveId}/root:/${rutaCaso}`)
        .get();

      // Listar fotos
      const fotos = await this.listarArchivosEnCarpeta(client, driveId, `${rutaCaso}/Fotos`);

      // Listar formularios
      const formularios = await this.listarArchivosEnCarpeta(client, driveId, `${rutaCaso}/Formularios`);

      console.log(`✅ Encontrados: ${fotos.length} fotos, ${formularios.length} formularios`);

      return {
        codigoCaso,
        fotos,
        formularios,
        total: fotos.length + formularios.length
      };

    } catch (error) {
      console.error(`❌ Error listando archivos de ${codigoCaso}:`, error.message);
      throw new GraphAPIError('Error listando archivos del caso', error);
    }
  }

  /**
   * Lista archivos en una carpeta específica
   */
  async listarArchivosEnCarpeta(client, driveId, rutaCarpeta) {
    try {
      const items = await client
        .api(`/drives/${driveId}/root:/${rutaCarpeta}:/children`)
        .select('id,name,size,createdDateTime,lastModifiedDateTime,file,webUrl,@microsoft.graph.downloadUrl')
        .get();

      // Filtrar solo archivos (no carpetas)
      const archivos = items.value.filter(item => item.file);

      return archivos.map(archivo => ({
        id: archivo.id,
        nombre: archivo.name,
        tamaño: archivo.size,
        fechaCreacion: archivo.createdDateTime,
        fechaModificacion: archivo.lastModifiedDateTime,
        urlWeb: archivo.webUrl,
        urlDescarga: archivo['@microsoft.graph.downloadUrl'],
        mimeType: archivo.file?.mimeType
      }));

    } catch (error) {
      console.warn(`⚠️  Carpeta ${rutaCarpeta} no encontrada o vacía`);
      return [];
    }
  }

  /**
   * Elimina un archivo de OneDrive
   */
  async eliminarArchivo(userToken, archivoId) {
    try {
      const client = await this.getClient(userToken);
      const driveId = await this.getDriveId(client);

      await client.api(`/drives/${driveId}/items/${archivoId}`).delete();

      console.log(`✅ Archivo ${archivoId} eliminado`);
      return { success: true, message: 'Archivo eliminado correctamente' };

    } catch (error) {
      console.error(`❌ Error eliminando archivo ${archivoId}:`, error.message);
      throw new GraphAPIError('Error eliminando archivo', error);
    }
  }

  /**
   * Obtiene URL de descarga directa de un archivo
   */
  async obtenerUrlDescarga(userToken, archivoId) {
    try {
      const client = await this.getClient(userToken);
      const driveId = await this.getDriveId(client);

      const archivo = await client
        .api(`/drives/${driveId}/items/${archivoId}`)
        .select('@microsoft.graph.downloadUrl')
        .get();

      return archivo['@microsoft.graph.downloadUrl'];

    } catch (error) {
      console.error(`❌ Error obteniendo URL de descarga:`, error.message);
      throw new GraphAPIError('Error obteniendo URL de descarga', error);
    }
  }

  /**
   * Obtiene metadatos de un archivo
   */
  async obtenerMetadatosArchivo(userToken, archivoId) {
    try {
      const client = await this.getClient(userToken);
      const driveId = await this.getDriveId(client);

      const archivo = await client.api(`/drives/${driveId}/items/${archivoId}`).get();

      return {
        id: archivo.id,
        nombre: archivo.name,
        tamaño: archivo.size,
        fechaCreacion: archivo.createdDateTime,
        fechaModificacion: archivo.lastModifiedDateTime,
        ruta: archivo.parentReference?.path,
        urlWeb: archivo.webUrl,
        mimeType: archivo.file?.mimeType,
        hash: archivo.file?.hashes
      };

    } catch (error) {
      console.error(`❌ Error obteniendo metadatos:`, error.message);
      throw new GraphAPIError('Error obteniendo metadatos del archivo', error);
    }
  }
}

// Exportar instancia singleton
const onedriveService = new OnedriveService();
module.exports = onedriveService;
