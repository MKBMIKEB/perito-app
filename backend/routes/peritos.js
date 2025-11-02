/**
 * Rutas de Peritos
 */

const express = require('express');
const router = express.Router();
const graphService = require('../services/graphService');
const { requireRole } = require('../middlewares/auth');

/**
 * GET /api/peritos
 * Listar todos los peritos (usuarios de Azure AD)
 */
router.get('/', requireRole(['Coordinador', 'Administrador']), async (req, res, next) => {
  try {
    // Obtener usuarios de Azure AD
    const usuarios = await graphService.listUsers();

    // Filtrar solo peritos (opcional: basado en un atributo)
    const peritos = usuarios.map(user => ({
      id: user.id,
      nombre: user.displayName,
      email: user.userPrincipalName || user.mail,
      puesto: user.jobTitle,
      ubicacion: user.officeLocation
    }));

    res.json({
      success: true,
      peritos,
      total: peritos.length
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/peritos/:id
 * Obtener información de un perito específico
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const usuario = await graphService.getUserById(id);

    res.json({
      success: true,
      perito: {
        id: usuario.id,
        nombre: usuario.displayName,
        email: usuario.userPrincipalName || usuario.mail,
        puesto: usuario.jobTitle,
        ubicacion: usuario.officeLocation,
        telefono: usuario.mobilePhone || usuario.businessPhones?.[0]
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
