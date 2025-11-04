/**
 * Configuración de Peritos y Microsoft OneDrive
 * Perito App - Gestión de carpetas por perito
 */

export const PERITO_CONFIG = {
  // URL del backend API
  API_BASE_URL: 'http://172.20.10.6:5000',

  // Configuración de carpetas Microsoft OneDrive por perito
  ONEDRIVE_FOLDERS: {
    '12345678': '/Perito_Apps/Juan_Perez_12345678',
    '87654321': '/Perito_Apps/Maria_Garcia_87654321', 
    '11223344': '/Perito_Apps/Carlos_Rodriguez_11223344',
    '55667788': '/Perito_Apps/Ana_Lopez_55667788',
    '99887766': '/Perito_Apps/Luis_Martinez_99887766',
    
    // Agregar más peritos según sea necesario
    // Formato: 'cedula': '/Perito_Apps/Nombre_Apellido_Cedula'
  },

  // Carpetas por especialidad (opcional)
  ESPECIALIDADES: {
    'urbano': '/Especialidad_Urbano',
    'rural': '/Especialidad_Rural', 
    'comercial': '/Especialidad_Comercial',
    'industrial': '/Especialidad_Industrial'
  },

  // Configuración Microsoft OneDrive
  MICROSOFT_CONFIG: {
    // Client ID de Azure AD (mismo que azureConfig.js)
    CLIENT_ID: 'c8256ffe-b0fc-406d-8832-736240ae5570',

    // Authority para tenant específico (ingenieria legal)
    AUTHORITY: 'https://login.microsoftonline.com/fd32daf0-141c-4cb5-a224-10255204f33d',

    // URI de redirección (debe coincidir con app.json scheme)
    REDIRECT_URI: 'msauth.c8256ffe-b0fc-406d-8832-736240ae5570://auth',
    
    // Scopes de Microsoft Graph API
    SCOPES: [
      'https://graph.microsoft.com/Files.ReadWrite',
      'https://graph.microsoft.com/Files.ReadWrite.All',
      'https://graph.microsoft.com/User.Read'
    ],
    
    // Base URL para Microsoft Graph API
    GRAPH_BASE_URL: 'https://graph.microsoft.com/v1.0'
  },

  // Configuración de archivos
  FILE_CONFIG: {
    // Calidad de imagen (0.1 - 1.0)
    PHOTO_QUALITY: 0.8,
    
    // Formato de nombres de archivo
    FILENAME_FORMAT: 'PERITO_{ASIGNACION}_{TIMESTAMP}.jpg',
    
    // Prefijo para archivos de metadata
    METADATA_SUFFIX: '.json',
    
    // Directorio local de respaldo
    LOCAL_BACKUP_DIR: 'perito_photos',
    
    // Tamaño máximo de archivo en MB
    MAX_FILE_SIZE_MB: 10
  },

  // Configuración GPS
  GPS_CONFIG: {
    // Precisión GPS requerida
    ACCURACY: 'high', // 'low', 'balanced', 'high'
    
    // Tiempo máximo de espera para GPS (ms)
    TIMEOUT: 15000,
    
    // Número de decimales para coordenadas
    COORDINATE_PRECISION: 6
  },

  // Plantillas de marca de agua
  WATERMARK_TEMPLATES: {
    STANDARD: {
      line1: '📍 {LAT}, {LNG}',
      line2: '📅 {DATE} - ⏰ {TIME}',
      line3: '👤 {PERITO_NOMBRE} - CC: {PERITO_CEDULA}',
      line4: '🏷️ {ASIGNACION_ID}'
    },
    
    COMPACT: {
      line1: 'GPS: {LAT}, {LNG}',
      line2: '{DATE} {TIME}',
      line3: '{PERITO_NOMBRE} - {PERITO_CEDULA}',
      line4: 'ID: {ASIGNACION_ID}'
    },
    
    DETAILED: {
      line1: '📍 Coordenadas: {LAT}, {LNG}',
      line2: '📅 Fecha: {DATE} - ⏰ Hora: {TIME}',
      line3: '👤 Perito: {PERITO_NOMBRE}',
      line4: '🆔 Cédula: {PERITO_CEDULA}',
      line5: '🏷️ Asignación: {ASIGNACION_ID}'
    }
  }
};

// Funciones de utilidad
export const PeritoConfigUtils = {
  
  /**
   * Obtener carpeta OneDrive para un perito
   */
  getOneDriveFolder(peritoCedula) {
    const folder = PERITO_CONFIG.ONEDRIVE_FOLDERS[peritoCedula];
    return folder || '/Perito_Apps/General';
  },

  /**
   * Agregar nuevo perito con carpeta OneDrive
   */
  addPerito(cedula, nombre, apellido) {
    const folderName = `/Perito_Apps/${nombre}_${apellido}_${cedula}`;
    PERITO_CONFIG.ONEDRIVE_FOLDERS[cedula] = folderName;
    
    // En producción, guardar en base de datos o AsyncStorage
    console.log(`Perito agregado: ${cedula} -> ${folderName}`);
    return folderName;
  },

  /**
   * Validar configuración Microsoft
   */
  validateMicrosoftConfig() {
    const config = PERITO_CONFIG.MICROSOFT_CONFIG;
    
    const errors = [];
    
    if (!config.CLIENT_ID || config.CLIENT_ID === 'TU_CLIENT_ID_AZURE_AQUI') {
      errors.push('Client ID no configurado');
    }
    
    if (!config.REDIRECT_URI.includes('msauth.')) {
      errors.push('Redirect URI no válida');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  /**
   * Generar nombre de archivo
   */
  generateFileName(asignacionId, timestamp = null) {
    const now = timestamp || new Date();
    const timestampStr = now.toISOString().replace(/[:.]/g, '-');
    
    return PERITO_CONFIG.FILE_CONFIG.FILENAME_FORMAT
      .replace('{ASIGNACION}', asignacionId || 'GENERAL')
      .replace('{TIMESTAMP}', timestampStr);
  },

  /**
   * Formatear coordenadas GPS
   */
  formatCoordinates(latitude, longitude) {
    const precision = PERITO_CONFIG.GPS_CONFIG.COORDINATE_PRECISION;
    
    return {
      lat: parseFloat(latitude).toFixed(precision),
      lng: parseFloat(longitude).toFixed(precision)
    };
  },

  /**
   * Generar marca de agua personalizada
   */
  generateWatermark(templateType = 'STANDARD', data) {
    const template = PERITO_CONFIG.WATERMARK_TEMPLATES[templateType];
    
    if (!template) {
      throw new Error(`Template '${templateType}' no encontrado`);
    }

    const result = {};
    
    Object.keys(template).forEach(key => {
      let line = template[key];
      
      // Reemplazar placeholders
      line = line.replace('{LAT}', data.latitude || 'N/A');
      line = line.replace('{LNG}', data.longitude || 'N/A');
      line = line.replace('{DATE}', data.date || 'N/A');
      line = line.replace('{TIME}', data.time || 'N/A');
      line = line.replace('{PERITO_NOMBRE}', data.peritoNombre || 'N/A');
      line = line.replace('{PERITO_CEDULA}', data.peritoCedula || 'N/A');
      line = line.replace('{ASIGNACION_ID}', data.asignacionId || 'N/A');
      
      result[key] = line;
    });

    return result;
  },

  /**
   * Obtener lista de peritos configurados
   */
  getConfiguredPeritos() {
    const folders = PERITO_CONFIG.ONEDRIVE_FOLDERS;
    
    return Object.keys(folders).map(cedula => {
      const folder = folders[cedula];
      const folderParts = folder.split('/').pop().split('_');
      
      return {
        cedula: cedula,
        folder: folder,
        nombre: folderParts[1] || 'Nombre',
        apellido: folderParts[2] || 'Apellido'
      };
    });
  }
};

// Validar configuración al cargar
const validation = PeritoConfigUtils.validateMicrosoftConfig();
if (!validation.isValid) {
  console.warn('⚠️ Configuración Microsoft OneDrive incompleta:', validation.errors);
  console.warn('📖 Ver CONFIGURACION_ONEDRIVE.md para instrucciones completas');
}