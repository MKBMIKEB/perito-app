/**
 * Rutas de Casos
 */

const express = require('express');
const router = express.Router();
const sqlService = require('../services/sqlService');
const onedriveService = require('../services/onedriveService');
const { ValidationError, NotFoundError } = require('../middlewares/errorHandler');
const { requireRole } = require('../middlewares/auth');

/**
 * GET /api/casos
 * Listar todos los casos (con filtros opcionales)
 */
router.get('/', async (req, res, next) => {
  try {
    const { estado, peritoId, ciudad, coordinadorId } = req.query;

    const filtros = {};
    if (estado) filtros.estado = estado;
    if (peritoId) filtros.peritoId = peritoId;
    if (ciudad) filtros.ciudad = ciudad;
    if (coordinadorId) filtros.coordinadorId = coordinadorId;

    const casos = await sqlService.listarCasos(filtros);

    res.json({
      success: true,
      casos,
      total: casos.length,
      filtros: filtros
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/casos/:id
 * Obtener detalles de un caso específico
 */
router.get('/:id', async (req, res, next) => {
  try {
    const casoId = parseInt(req.params.id);

    if (isNaN(casoId)) {
      throw new ValidationError('ID de caso inválido');
    }

    const caso = await sqlService.obtenerCasoPorId(casoId);

    if (!caso) {
      throw new NotFoundError('Caso');
    }

    // Obtener archivos asociados
    const archivos = await sqlService.listarArchivosDeCaso(casoId);
    const formularios = await sqlService.obtenerFormulariosDeCaso(casoId);

    res.json({
      success: true,
      caso,
      archivos: {
        fotos: archivos.filter(a => a.tipoArchivo === 'foto'),
        documentos: archivos.filter(a => a.tipoArchivo === 'formulario'),
        total: archivos.length
      },
      formularios: {
        items: formularios,
        total: formularios.length
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/casos
 * Crear un nuevo caso
 */
router.post('/', requireRole(['Coordinador', 'Administrador']), async (req, res, next) => {
  try {
    const { codigo, direccion, ciudad, barrio, tipoInmueble, prioridad, peritoId, peritoNombre } = req.body;

    // Validaciones
    if (!codigo || !direccion) {
      throw new ValidationError('Código y dirección son requeridos');
    }

    // Verificar que el código no exista
    const existente = await sqlService.obtenerCasoPorCodigo(codigo);
    if (existente) {
      throw new ValidationError(`Ya existe un caso con el código ${codigo}`);
    }

    // Crear caso
    const casoData = {
      codigo,
      direccion,
      ciudad,
      barrio,
      tipoInmueble,
      prioridad: prioridad || 'media',
      estado: 'pendiente',
      coordinadorId: req.user.id,
      peritoId: peritoId || null,
      peritoNombre: peritoNombre || null,
      fechaAsignacion: peritoId ? new Date() : null
    };

    const caso = await sqlService.crearCaso(casoData);

    // Crear estructura de carpetas en OneDrive
    try {
      await onedriveService.crearEstructuraCaso(req.user.token, codigo);
    } catch (error) {
      console.warn('⚠️  No se pudo crear estructura en OneDrive:', error.message);
    }

    res.status(201).json({
      success: true,
      caso,
      message: 'Caso creado exitosamente'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/casos/:id
 * Actualizar un caso
 */
router.put('/:id', requireRole(['Coordinador', 'Administrador']), async (req, res, next) => {
  try {
    const casoId = parseInt(req.params.id);

    if (isNaN(casoId)) {
      throw new ValidationError('ID de caso inválido');
    }

    // Verificar que el caso existe
    const caso = await sqlService.obtenerCasoPorId(casoId);
    if (!caso) {
      throw new NotFoundError('Caso');
    }

    // Actualizar solo campos permitidos
    const updates = {};
    const camposPermitidos = ['direccion', 'ciudad', 'barrio', 'tipoInmueble', 'estado', 'prioridad', 'peritoId', 'peritoNombre', 'observaciones'];

    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        updates[campo] = req.body[campo];
      }
    });

    // Si se asigna un perito, actualizar fecha de asignación
    if (updates.peritoId && updates.peritoId !== caso.peritoId) {
      updates.fechaAsignacion = new Date();
      updates.estado = 'asignado';
    }

    const resultado = await sqlService.actualizarCaso(casoId, updates);

    res.json({
      success: true,
      message: 'Caso actualizado exitosamente',
      casoId,
      updates
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/casos/:id
 * Eliminar un caso
 */
router.delete('/:id', requireRole(['Administrador']), async (req, res, next) => {
  try {
    const casoId = parseInt(req.params.id);

    if (isNaN(casoId)) {
      throw new ValidationError('ID de caso inválido');
    }

    // Verificar que el caso existe
    const caso = await sqlService.obtenerCasoPorId(casoId);
    if (!caso) {
      throw new NotFoundError('Caso');
    }

    await sqlService.eliminarCaso(casoId);

    res.json({
      success: true,
      message: `Caso ${caso.codigo} eliminado exitosamente`
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/casos/perito/:peritoId
 * Obtener casos asignados a un perito específico
 */
router.get('/perito/:peritoId', async (req, res, next) => {
  try {
    const { peritoId } = req.params;

    const casos = await sqlService.listarCasos({ peritoId });

    res.json({
      success: true,
      casos,
      total: casos.length,
      peritoId
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
