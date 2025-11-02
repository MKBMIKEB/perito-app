/**
 * Microsoft Graph API Service
 * Cliente para interactuar con Microsoft Graph
 */

const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');
const { getAppOnlyToken } = require('../middlewares/auth');
const { GraphAPIError } = require('../middlewares/errorHandler');

class GraphService {
  constructor() {
    this.client = null;
  }

  /**
   * Inicializa el cliente de Graph con token de usuario
   */
  async getClientWithUserToken(userToken) {
    return Client.init({
      authProvider: (done) => {
        done(null, userToken);
      }
    });
  }

  /**
   * Inicializa el cliente de Graph con token de aplicación
   */
  async getClientWithAppToken() {
    const appToken = await getAppOnlyToken();
    return Client.init({
      authProvider: (done) => {
        done(null, appToken);
      }
    });
  }

  /**
   * Obtiene información del usuario autenticado
   */
  async getUserProfile(userToken) {
    try {
      const client = await this.getClientWithUserToken(userToken);
      const user = await client.api('/me').get();

      console.log(`✅ Perfil obtenido: ${user.displayName} (${user.userPrincipalName})`);
      return user;
    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error.message);
      throw new GraphAPIError('No se pudo obtener el perfil del usuario', error);
    }
  }

  /**
   * Obtiene la foto de perfil del usuario
   */
  async getUserPhoto(userToken) {
    try {
      const client = await this.getClientWithUserToken(userToken);
      const photo = await client.api('/me/photo/$value').get();
      return photo;
    } catch (error) {
      console.warn('⚠️  No se pudo obtener foto de perfil:', error.message);
      return null;
    }
  }

  /**
   * Obtiene el Drive del usuario
   */
  async getUserDrive(userToken) {
    try {
      const client = await this.getClientWithUserToken(userToken);
      const drive = await client.api('/me/drive').get();

      console.log(`✅ Drive obtenido: ${drive.id}`);
      return drive;
    } catch (error) {
      console.error('❌ Error obteniendo drive:', error.message);
      throw new GraphAPIError('No se pudo obtener el drive del usuario', error);
    }
  }

  /**
   * Lista archivos en una carpeta
   */
  async listFilesInFolder(userToken, folderId = 'root') {
    try {
      const client = await this.getClientWithUserToken(userToken);
      const items = await client
        .api(`/me/drive/items/${folderId}/children`)
        .select('id,name,size,createdDateTime,lastModifiedDateTime,folder,file')
        .get();

      console.log(`✅ ${items.value.length} archivos encontrados en carpeta ${folderId}`);
      return items.value;
    } catch (error) {
      console.error('❌ Error listando archivos:', error.message);
      throw new GraphAPIError('No se pudieron listar los archivos', error);
    }
  }

  /**
   * Busca archivos por nombre
   */
  async searchFiles(userToken, query) {
    try {
      const client = await this.getClientWithUserToken(userToken);
      const items = await client
        .api('/me/drive/root/search')
        .query({ q: query })
        .get();

      console.log(`✅ ${items.value.length} archivos encontrados para: "${query}"`);
      return items.value;
    } catch (error) {
      console.error('❌ Error buscando archivos:', error.message);
      throw new GraphAPIError('Error en búsqueda de archivos', error);
    }
  }

  /**
   * Obtiene el contenido de un archivo
   */
  async getFileContent(userToken, fileId) {
    try {
      const client = await this.getClientWithUserToken(userToken);
      const content = await client.api(`/me/drive/items/${fileId}/content`).get();

      console.log(`✅ Contenido de archivo ${fileId} obtenido`);
      return content;
    } catch (error) {
      console.error('❌ Error obteniendo contenido:', error.message);
      throw new GraphAPIError('No se pudo obtener el contenido del archivo', error);
    }
  }

  /**
   * Elimina un archivo
   */
  async deleteFile(userToken, fileId) {
    try {
      const client = await this.getClientWithUserToken(userToken);
      await client.api(`/me/drive/items/${fileId}`).delete();

      console.log(`✅ Archivo ${fileId} eliminado`);
      return { success: true, message: 'Archivo eliminado correctamente' };
    } catch (error) {
      console.error('❌ Error eliminando archivo:', error.message);
      throw new GraphAPIError('No se pudo eliminar el archivo', error);
    }
  }

  /**
   * Mueve un archivo a otra carpeta
   */
  async moveFile(userToken, fileId, newParentId) {
    try {
      const client = await this.getClientWithUserToken(userToken);
      const updatedItem = await client
        .api(`/me/drive/items/${fileId}`)
        .patch({
          parentReference: { id: newParentId }
        });

      console.log(`✅ Archivo movido a carpeta ${newParentId}`);
      return updatedItem;
    } catch (error) {
      console.error('❌ Error moviendo archivo:', error.message);
      throw new GraphAPIError('No se pudo mover el archivo', error);
    }
  }

  /**
   * Copia un archivo
   */
  async copyFile(userToken, fileId, newParentId, newName = null) {
    try {
      const client = await this.getClientWithUserToken(userToken);

      const copyRequest = {
        parentReference: { id: newParentId }
      };

      if (newName) {
        copyRequest.name = newName;
      }

      const response = await client
        .api(`/me/drive/items/${fileId}/copy`)
        .post(copyRequest);

      console.log(`✅ Archivo copiado`);
      return response;
    } catch (error) {
      console.error('❌ Error copiando archivo:', error.message);
      throw new GraphAPIError('No se pudo copiar el archivo', error);
    }
  }

  /**
   * Obtiene información de un usuario específico (requiere permisos de app)
   */
  async getUserById(userId) {
    try {
      const client = await this.getClientWithAppToken();
      const user = await client.api(`/users/${userId}`).get();

      console.log(`✅ Usuario obtenido: ${user.displayName}`);
      return user;
    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error.message);
      throw new GraphAPIError('No se pudo obtener el usuario', error);
    }
  }

  /**
   * Lista todos los usuarios (requiere permisos de app)
   */
  async listUsers(filter = null) {
    try {
      const client = await this.getClientWithAppToken();
      let query = client.api('/users').select('id,displayName,userPrincipalName,mail');

      if (filter) {
        query = query.filter(filter);
      }

      const users = await query.get();

      console.log(`✅ ${users.value.length} usuarios encontrados`);
      return users.value;
    } catch (error) {
      console.error('❌ Error listando usuarios:', error.message);
      throw new GraphAPIError('No se pudieron listar los usuarios', error);
    }
  }
}

// Exportar instancia singleton
const graphService = new GraphService();
module.exports = graphService;
