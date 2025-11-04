/**
 * Rutas de Autenticación
 */

const express = require('express');
const router = express.Router();
const graphService = require('../services/graphService');
const sqlService = require('../services/sqlService');
const { ValidationError, AuthenticationError } = require('../middlewares/errorHandler');
const axios = require('axios');
const jwt = require('jsonwebtoken');

/**
 * POST /api/auth/login
 * Login con token de Azure AD
 */
router.post('/login', async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      throw new ValidationError('Se requiere accessToken');
    }

    // Modo desarrollo: aceptar tokens fake para testing
    if (accessToken.startsWith('fake-token-')) {
      console.log('🔧 Modo desarrollo: usando token fake');

      const demoUser = {
        id: 'demo-user-123',
        email: 'demo@perito.com',
        displayName: 'Usuario Demo',
        givenName: 'Usuario',
        surname: 'Demo',
        jobTitle: 'Perito',
        officeLocation: 'Oficina Demo'
      };

      console.log(`✅ Login exitoso (modo demo): ${demoUser.displayName}`);

      return res.json({
        success: true,
        user: demoUser,
        token: accessToken
      });
    }

    // Obtener perfil del usuario desde Graph API
    const userProfile = await graphService.getUserProfile(accessToken);

    if (!userProfile) {
      throw new AuthenticationError('Token inválido o expirado');
    }

    // Verificar que el usuario existe en la base de datos
    // (Opcional: crear usuario si no existe)

    console.log(`✅ Login exitoso: ${userProfile.displayName} (${userProfile.userPrincipalName})`);

    res.json({
      success: true,
      user: {
        id: userProfile.id,
        email: userProfile.userPrincipalName,
        displayName: userProfile.displayName,
        givenName: userProfile.givenName,
        surname: userProfile.surname,
        jobTitle: userProfile.jobTitle,
        officeLocation: userProfile.officeLocation
      },
      token: accessToken
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Obtener información del usuario actual
 */
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('No se proporcionó token');
    }

    // Modo desarrollo: aceptar tokens fake para testing
    if (token.startsWith('fake-token-')) {
      const demoUser = {
        id: 'demo-user-123',
        email: 'demo@perito.com',
        displayName: 'Usuario Demo',
        givenName: 'Usuario',
        surname: 'Demo',
        jobTitle: 'Perito',
        officeLocation: 'Oficina Demo'
      };

      return res.json({
        success: true,
        user: demoUser
      });
    }

    const userProfile = await graphService.getUserProfile(token);

    res.json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login-mobile
 * Login para app móvil con usuario/contraseña
 * Valida contra Azure AD y retorna token JWT + token Microsoft
 */
router.post('/login-mobile', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email y contraseña son requeridos');
    }

    // Utilidades locales para logging seguro y parsing de errores Azure AD
    const maskEmail = (value) => {
      if (!value || typeof value !== 'string') return '(empty)';
      const parts = value.split('@');
      if (parts.length < 2) return value;
      const user = parts[0];
      const domain = parts.slice(1).join('@');
      const maskedUser = user.length <= 2
        ? user[0] + '*'
        : user[0] + '*'.repeat(Math.max(user.length - 2, 1)) + user.slice(-1);
      return `${maskedUser}@${domain}`;
    };

    const parseAADSTS = (text) => {
      const m = (text || '').match(/AADSTS\d+/);
      return m ? m[0] : null;
    };

    const logAzureError = (context, azureError) => {
      const data = azureError.response?.data || {};
      const status = azureError.response?.status;
      const code = parseAADSTS(data.error_description || data.error);
      const details = {
        status,
        error: data.error,
        code,
        error_codes: data.error_codes,
        trace_id: data.trace_id,
        correlation_id: data.correlation_id,
        timestamp: data.timestamp,
        headers: {
          requestId: azureError.response?.headers?.['x-ms-request-id'],
          ests: azureError.response?.headers?.['x-ms-ests-server'],
        },
      };
      console.error(`❌ Azure AD error (${context})`, details);
      try {
        logger.warn('Azure ROPC error', {
          context,
          ...details,
        });
      } catch {}
    };

    console.log('🔐 Intento de login móvil (ROPC):', {
      username: maskEmail(email),
      tenant: process.env.AZURE_AD_TENANT_ID,
      clientId: process.env.AZURE_AD_CLIENT_ID,
    });

    // Validar credenciales contra Azure AD usando ROPC (Resource Owner Password Credentials)
    try {
      const t0 = Date.now();
      const tokenResponse = await axios.post(
        `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: process.env.AZURE_AD_CLIENT_ID,
          client_secret: process.env.AZURE_AD_CLIENT_SECRET,
          // Scopes explícitos para ROPC (evita depender de .default)
          // Requiere consentimientos otorgados en el App Registration
          // Ajustado a Files.ReadWrite.All para coincidir con permisos concedidos
          scope: 'openid profile offline_access https://graph.microsoft.com/User.Read https://graph.microsoft.com/Files.ReadWrite.All',
          grant_type: 'password',
          username: email,
          password: password
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      console.log('⏱️  Azure ROPC token OK en', `${Date.now() - t0}ms`);

      const microsoftToken = tokenResponse.data.access_token;
      const refreshToken = tokenResponse.data.refresh_token;

      // Obtener información del usuario desde Microsoft Graph
      const userInfoResponse = await axios.get(
        'https://graph.microsoft.com/v1.0/me',
        {
          headers: {
            'Authorization': `Bearer ${microsoftToken}`
          }
        }
      );

      const userInfo = userInfoResponse.data;

      console.log(`✅ Usuario autenticado: ${userInfo.displayName}`);

      // Buscar o crear usuario en base de datos
      let usuario = await sqlService.buscarUsuarioPorEmail(email);

      if (!usuario) {
        console.log(`📝 Creando nuevo usuario: ${email}`);
        usuario = await sqlService.crearUsuario({
          email: userInfo.mail || userInfo.userPrincipalName,
          nombre: userInfo.displayName,
          rol: 'Perito', // Por defecto, después puedes consultar Azure AD Groups
          activo: true
        });
      }

      // Generar JWT propio del backend
      const jwtToken = jwt.sign(
        {
          userId: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol
        },
        process.env.JWT_SECRET || 'perito-app-secret-key-2025',
        { expiresIn: process.env.JWT_EXPIRATION || '24h' }
      );

      console.log(`✅ Login móvil exitoso: ${usuario.nombre} (${usuario.rol})`);

      // Responder con ambos tokens
      res.json({
        success: true,
        user: {
          id: usuario.id,
          nombre: userInfo.displayName,
          email: userInfo.mail || userInfo.userPrincipalName,
          rol: usuario.rol,
          foto: null // Puedes agregar foto después
        },
        tokens: {
          jwt: jwtToken,              // Token para autenticar en backend
          microsoft: microsoftToken,   // Token para subir a OneDrive
          refresh: refreshToken        // Token para renovar sesión
        },
        expiresIn: '24h'
      });

    } catch (azureError) {
      logAzureError('ROPC', azureError);

      const desc = azureError.response?.data?.error_description || '';
      const aadsts = parseAADSTS(desc);
      const status = azureError.response?.status;
      const details = {
        aadsts,
        status,
        trace_id: azureError.response?.data?.trace_id,
        correlation_id: azureError.response?.data?.correlation_id,
        error: azureError.response?.data?.error,
      };

      // Logs más legibles por tipo de fallo (respuesta al cliente se mantiene genérica)
      if (aadsts === 'AADSTS50126' || aadsts === 'AADSTS50034' || aadsts === 'AADSTS50056') {
        console.warn('🔑 Usuario y/o contraseña no válidos o usuario inexistente');
      } else if (aadsts === 'AADSTS50076' || aadsts === 'AADSTS50079') {
        console.warn('🔐 MFA requerido. ROPC no compatible con MFA');
      } else if (aadsts === 'AADSTS50053') {
        console.warn('🔒 Cuenta bloqueada o demasiados intentos fallidos');
      } else if (aadsts === 'AADSTS65001') {
        console.warn('🔓 Consentimiento requerido para los scopes. Falta admin consent.');
      } else if (aadsts === 'AADSTS700016' || aadsts === 'AADSTS7000218') {
        console.warn('⚙️ Configuración de App Registration inválida (clientId/secret)');
      }

      // Si Azure AD rechaza las credenciales
      if (status === 400 || status === 401) {
        let message = 'Credenciales inválidas';
        if (aadsts === 'AADSTS50076' || aadsts === 'AADSTS50079') {
          message = 'MFA requerido. Este flujo de login (ROPC) no es compatible con MFA. Usa OAuth (APK de desarrollo) o una cuenta sin MFA.';
        } else if (aadsts === 'AADSTS50126' || aadsts === 'AADSTS50034' || aadsts === 'AADSTS50056') {
          message = 'Usuario o contraseña incorrectos.';
        } else if (aadsts === 'AADSTS50053') {
          message = 'Demasiados intentos fallidos o cuenta temporalmente bloqueada.';
        } else if (aadsts === 'AADSTS65001') {
          message = 'Falta consentimiento para los permisos solicitados. Solicita a un administrador que otorgue consentimiento en Azure AD (User.Read, Files.ReadWrite).';
        } else if (aadsts === 'AADSTS700016' || aadsts === 'AADSTS7000218') {
          message = 'Aplicación no configurada correctamente (clientId/secret). Contacta al administrador.';
        }
        throw new AuthenticationError(message, details);
      }

      throw new Error('Error conectando con Azure AD: ' + (azureError.response?.data?.error_description || azureError.message));
    }

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/oauth-callback
 * Callback para OAuth 2.0 - Registra usuario autenticado
 */
router.post('/oauth-callback', async (req, res, next) => {
  try {
    const { accessToken, refreshToken, userInfo } = req.body;

    if (!accessToken || !userInfo) {
      throw new ValidationError('Access token y userInfo son requeridos');
    }

    console.log(`✅ OAuth callback recibido para: ${userInfo.displayName}`);

    // Buscar o crear usuario en base de datos
    const email = userInfo.mail || userInfo.userPrincipalName;
    let usuario = await sqlService.buscarUsuarioPorEmail(email);

    if (!usuario) {
      console.log(`📝 Creando nuevo usuario desde OAuth: ${email}`);
      usuario = await sqlService.crearUsuario({
        email: email,
        nombre: userInfo.displayName,
        rol: 'Perito',
        activo: true
      });
    }

    // Generar JWT propio del backend
    const jwtToken = jwt.sign(
      {
        userId: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol
      },
      process.env.JWT_SECRET || 'perito-app-secret-key-2025',
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );

    console.log(`✅ OAuth callback completado para: ${usuario.nombre}`);

    res.json({
      success: true,
      user: {
        id: usuario.id,
        nombre: userInfo.displayName,
        email: email,
        rol: usuario.rol
      },
      tokens: {
        jwt: jwtToken,
        microsoft: accessToken,
        refresh: refreshToken
      }
    });

  } catch (error) {
    console.error('❌ Error en OAuth callback:', error);
    next(error);
  }
});

/**
 * POST /api/auth/refresh-mobile
 * Renovar token usando refresh token
 */
router.post('/refresh-mobile', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token es requerido');
    }

    // Renovar token con Azure AD
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID,
        client_secret: process.env.AZURE_AD_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default offline_access',
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const microsoftToken = tokenResponse.data.access_token;
    const newRefreshToken = tokenResponse.data.refresh_token;

    console.log('✅ Token renovado exitosamente');

    res.json({
      success: true,
      tokens: {
        microsoft: microsoftToken,
        refresh: newRefreshToken
      }
    });

  } catch (error) {
    console.error('❌ Error renovando token:', error.response?.data || error.message);
    next(new AuthenticationError('No se pudo renovar el token'));
  }
});

module.exports = router;
const { logger } = require('../middlewares/logger');
