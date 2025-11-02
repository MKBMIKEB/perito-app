/**
 * Middleware de Autenticación con Azure AD
 * Valida tokens JWT y extrae información del usuario
 */

const jwt = require('jsonwebtoken');
const msal = require('@azure/msal-node');
const { ConfidentialClientApplication } = msal;
const axios = require('axios');

// Configuración MSAL para validación de tokens
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  }
};

const cca = new ConfidentialClientApplication(msalConfig);

/**
 * Middleware para autenticar token de Azure AD
 */
async function authenticateToken(req, res, next) {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'No se proporcionó token de autenticación',
        message: 'Debes incluir el header: Authorization: Bearer <token>'
      });
    }

    // Validar token con Microsoft Graph
    const userInfo = await validateAzureADToken(token);

    if (!userInfo) {
      return res.status(403).json({
        error: 'Token inválido o expirado',
        message: 'Por favor, vuelve a iniciar sesión'
      });
    }

    // Adjuntar información del usuario al request
    req.user = {
      id: userInfo.id || userInfo.oid,
      email: userInfo.userPrincipalName || userInfo.email,
      name: userInfo.displayName || userInfo.name,
      roles: userInfo.roles || [],
      token: token
    };

    console.log(`✅ Usuario autenticado: ${req.user.email} (${req.user.roles.join(', ')})`);
    next();

  } catch (error) {
    console.error('❌ Error en autenticación:', error.message);
    return res.status(403).json({
      error: 'Error validando token',
      message: error.message
    });
  }
}

/**
 * Valida token llamando a Microsoft Graph API
 */
async function validateAzureADToken(token) {
  try {
    // Llamar a Graph API para obtener perfil del usuario
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;

  } catch (error) {
    if (error.response?.status === 401) {
      console.error('❌ Token expirado o inválido');
      return null;
    }
    throw new Error(`Error validando token: ${error.message}`);
  }
}

/**
 * Middleware para verificar roles específicos
 * Uso: app.get('/admin', authenticateToken, requireRole(['Administrador']), ...)
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes iniciar sesión primero'
      });
    }

    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      console.warn(`⚠️  Usuario ${req.user.email} intentó acceder sin permisos. Requiere: ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        error: 'Permisos insuficientes',
        message: `Se requiere uno de estos roles: ${allowedRoles.join(', ')}`,
        userRoles: userRoles
      });
    }

    console.log(`✅ Usuario ${req.user.email} autorizado con rol: ${allowedRoles.join(', ')}`);
    next();
  };
}

/**
 * Obtener token de aplicación (Client Credentials Flow)
 * Para operaciones backend sin usuario
 */
async function getAppOnlyToken() {
  try {
    const tokenRequest = {
      scopes: ['https://graph.microsoft.com/.default'],
    };

    const response = await cca.acquireTokenByClientCredential(tokenRequest);
    return response.accessToken;

  } catch (error) {
    console.error('❌ Error obteniendo app token:', error);
    throw new Error('No se pudo obtener token de aplicación');
  }
}

/**
 * Validar token JWT (opcional, si usas JWT custom)
 */
function validateJWT(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

module.exports = {
  authenticateToken,
  requireRole,
  getAppOnlyToken,
  validateAzureADToken,
  validateJWT
};
