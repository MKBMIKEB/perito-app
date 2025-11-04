/**
 * Configuración de Azure AD y Backend API
 */

export const AZURE_CONFIG = {
  // Configuración de Azure AD
  auth: {
    clientId: 'c8256ffe-b0fc-406d-8832-736240ae5570',
    tenantId: 'fd32daf0-141c-4cb5-a224-10255204f33d',
    authority: 'https://login.microsoftonline.com/fd32daf0-141c-4cb5-a224-10255204f33d',
  },

  // Scopes requeridos
  scopes: [
    'User.Read',
    'Files.ReadWrite.All',
  ],

  // Redirect URI (para autenticación móvil)
  redirectUri: 'msauth.c8256ffe-b0fc-406d-8832-736240ae5570://auth',
};

import { PERITO_CONFIG } from './peritoConfig';

export const API_CONFIG = {
  // URL del backend (unificada con PERITO_CONFIG)
  baseURL: (PERITO_CONFIG?.API_BASE_URL || (__DEV__ ? 'http://localhost:5000' : 'https://perito-app-backend.azurewebsites.net')).replace(/\/$/, ''),

  // Timeout de requests
  timeout: 30000,

  // Headers por defecto
  headers: {
    'Content-Type': 'application/json',
  },
};

// Configuración de OneDrive
export const ONEDRIVE_CONFIG = {
  folderRoot: 'DatosPeritos',
  fotosFolder: 'Fotos',
  formulariosFolder: 'Formularios',
};

// Endpoints del API
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  ME: '/api/auth/me',

  // Casos
  CASOS: '/api/casos',
  CASO_BY_ID: (id) => `/api/casos/${id}`,
  CASOS_BY_PERITO: (peritoId) => `/api/casos/perito/${peritoId}`,

  // OneDrive
  CREATE_FOLDER: '/api/onedrive/crear-carpeta',
  LIST_FILES: (codigoCaso) => `/api/onedrive/listar/${codigoCaso}`,

  // Upload
  UPLOAD_FOTO: '/api/upload/foto',
  UPLOAD_FORMULARIO: '/api/upload/formulario',

  // Peritos
  PERITOS: '/api/peritos',
  PERITO_BY_ID: (id) => `/api/peritos/${id}`,

  // Health
  HEALTH: '/health',
};

export default {
  AZURE_CONFIG,
  API_CONFIG,
  ONEDRIVE_CONFIG,
  API_ENDPOINTS,
};
