/**
 * Rutas de OneDrive
 */

const express = require('express');
const router = express.Router();
const onedriveService = require('../services/onedriveService');
const sqlService = require('../services/sqlService');
const { ValidationError, NotFoundError } = require('../middlewares/errorHandler');

/**
 * POST /api/onedrive/crear-carpeta
 * Crear estructura de carpetas para un caso
 */
router.post('/crear-carpeta', async (req, res, next) => {
  try {
    const { codigoCaso } = req.body;

    if (!codigoCaso) {
      throw new ValidationError('codigoCaso es requerido');
    }

    // Verificar que el caso existe
    const caso = await sqlService.obtenerCasoPorCodigo(codigoCaso);
    if (!caso) {
      throw new NotFoundError('Caso');
    }

    const estructura = await onedriveService.crearEstructuraCaso(req.user.token, codigoCaso);

    res.status(201).json({
      success: true,
      estructura,
      message: `Estructura de carpetas creada para ${codigoCaso}`
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/onedrive/listar/:codigoCaso
 * Listar todos los archivos de un caso
 */
router.get('/listar/:codigoCaso', async (req, res, next) => {
  try {
    const { codigoCaso } = req.params;

    // Verificar que el caso existe
    const caso = await sqlService.obtenerCasoPorCodigo(codigoCaso);
    if (!caso) {
      throw new NotFoundError('Caso');
    }

    const archivos = await onedriveService.listarArchivosCaso(req.user.token, codigoCaso);

    res.json({
      success: true,
      ...archivos
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
