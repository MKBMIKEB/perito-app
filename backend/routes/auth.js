/**
 * Rutas de Autenticación
 */

const express = require('express');
const router = express.Router();
const graphService = require('../services/graphService');
const sqlService = require('../services/sqlService');
const { ValidationError, AuthenticationError } = require('../middlewares/errorHandler');

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

    const userProfile = await graphService.getUserProfile(token);

    res.json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
