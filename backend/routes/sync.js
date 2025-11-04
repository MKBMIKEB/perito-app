/**
 * Rutas de Sincronización
 * Endpoints para sincronizar datos entre app móvil y servidor
 */

const express = require('express');
const router = express.Router();
const sqlService = require('../services/sqlService');
const onedriveService = require('../services/onedriveService');
const { ValidationError, NotFoundError } = require('../middlewares/errorHandler');

/**
 * POST /api/sync/datos
 * Sincronizar datos desde app móvil (fotos, formularios, asignaciones)
 */
router.post('/datos', async (req, res, next) => {
  try {
    const {
      formularios = [],
      evidencias = [],
      peritoId
    } = req.body;

    if (!peritoId) {
      throw new ValidationError('peritoId es requerido');
    }

    // Obtener token de Microsoft desde header personalizado
    const microsoftToken = req.headers['x-microsoft-token'] || req.user?.token || null;

    const resultados = {
      success: true,
      formularios: { sincronizados: 0, fallidos: 0, errores: [] },
      evidencias: { sincronizados: 0, fallidos: 0, errores: [] },
      timestamp: new Date().toISOString()
    };

    console.log(`📤 Iniciando sincronización para perito ${peritoId}`);
    console.log(`   - ${formularios.length} formularios`);
    console.log(`   - ${evidencias.length} evidencias`);

    // Sincronizar formularios
    for (const formulario of formularios) {
      try {
        // Verificar que el caso existe
        const caso = await sqlService.obtenerCasoPorId(formulario.asignacionId || formulario.casoId);

        if (!caso) {
          resultados.formularios.fallidos++;
          resultados.formularios.errores.push({
            id: formulario.id,
            error: 'Caso no encontrado'
          });
          continue;
        }

        // Guardar formulario
        const formularioData = {
          casoId: caso.id,
          codigoCaso: caso.codigo,
          peritoId: formulario.peritoId || peritoId,
          peritoNombre: formulario.peritoNombre || req.user?.name || 'Perito',
          datos: formulario,
          latitud: formulario.coordenadas?.latitude || formulario.latitud,
          longitud: formulario.coordenadas?.longitude || formulario.longitud
        };

        await sqlService.guardarFormulario(formularioData);

        // Guardar JSON en OneDrive
        try {
          const jsonContent = JSON.stringify(formulario, null, 2);
          const buffer = Buffer.from(jsonContent, 'utf-8');
          const fileName = `formulario_${formulario.id || Date.now()}.json`;

          if (microsoftToken) {
            await onedriveService.subirArchivo(
              microsoftToken,
              caso.codigo,
              'formulario',
              fileName,
              buffer
            );
          } else {
            console.warn('⚠️ No hay token de Microsoft, saltando subida a OneDrive');
          }

          // Actualizar estado del caso
          await sqlService.actualizarCaso(caso.id, {
            estado: 'en_proceso',
            fechaVisita: new Date()
          });

        } catch (error) {
          console.warn(`⚠️ No se pudo subir formulario a OneDrive: ${error.message}`);
        }

        resultados.formularios.sincronizados++;
        console.log(`✅ Formulario ${formulario.id} sincronizado`);

      } catch (error) {
        console.error(`❌ Error sincronizando formulario:`, error.message);
        resultados.formularios.fallidos++;
        resultados.formularios.errores.push({
          id: formulario.id,
          error: error.message
        });
      }
    }

    // Sincronizar evidencias (fotos)
    for (const evidencia of evidencias) {
      try {
        // Verificar que el caso existe
        const caso = await sqlService.obtenerCasoPorId(evidencia.asignacionId || evidencia.casoId);

        if (!caso) {
          resultados.evidencias.fallidos++;
          resultados.evidencias.errores.push({
            id: evidencia.id,
            error: 'Caso no encontrado'
          });
          continue;
        }

        // Decodificar foto base64 o URI
        let buffer;
        let fileName = evidencia.fileName || `foto_${Date.now()}.jpg`;

        if (evidencia.base64) {
          const base64Data = evidencia.base64.replace(/^data:image\/\w+;base64,/, '');
          buffer = Buffer.from(base64Data, 'base64');
        } else if (evidencia.fotoBase64) {
          const base64Data = evidencia.fotoBase64.replace(/^data:image\/\w+;base64,/, '');
          buffer = Buffer.from(base64Data, 'base64');
        } else {
          throw new Error('No se encontró contenido de imagen');
        }

        // Subir a OneDrive
        if (!microsoftToken) {
          console.warn('⚠️ No hay token de Microsoft para subir foto, guardando solo en BD');
          continue;
        }

        const uploadResult = await onedriveService.subirArchivo(
          microsoftToken,
          caso.codigo,
          'foto',
          fileName,
          buffer
        );

        // Registrar en base de datos
        const archivoData = {
          casoId: caso.id,
          codigoCaso: caso.codigo,
          nombreArchivo: fileName,
          tipoArchivo: 'foto',
          tamañoBytes: buffer.length,
          mimeType: 'image/jpeg',
          onedriveFileId: uploadResult.id,
          onedriveUrl: uploadResult.webUrl,
          onedriveUrlDescarga: uploadResult['@microsoft.graph.downloadUrl'],
          rutaOnedrive: `DatosPeritos/${caso.codigo}/Fotos/${fileName}`,
          usuarioId: peritoId,
          usuarioNombre: req.user?.name || 'Perito',
          latitud: evidencia.coordenadas?.latitude || evidencia.latitud,
          longitud: evidencia.coordenadas?.longitude || evidencia.longitud
        };

        await sqlService.registrarArchivo(archivoData);

        resultados.evidencias.sincronizados++;
        console.log(`✅ Evidencia ${evidencia.id} sincronizada`);

      } catch (error) {
        console.error(`❌ Error sincronizando evidencia:`, error.message);
        resultados.evidencias.fallidos++;
        resultados.evidencias.errores.push({
          id: evidencia.id,
          error: error.message
        });
      }
    }

    // Resumen
    console.log(`\n📊 Sincronización completada:`);
    console.log(`   ✅ Formularios: ${resultados.formularios.sincronizados}`);
    console.log(`   ✅ Evidencias: ${resultados.evidencias.sincronizados}`);
    console.log(`   ❌ Formularios fallidos: ${resultados.formularios.fallidos}`);
    console.log(`   ❌ Evidencias fallidas: ${resultados.evidencias.fallidos}\n`);

    res.json(resultados);

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sync/asignaciones
 * Obtener asignaciones actualizadas para un perito
 */
router.post('/asignaciones', async (req, res, next) => {
  try {
    const { peritoId, ultimaActualizacion } = req.body;

    if (!peritoId) {
      throw new ValidationError('peritoId es requerido');
    }

    console.log(`📥 Obteniendo asignaciones para perito ${peritoId}`);

    // Obtener casos asignados al perito
    const casos = await sqlService.listarCasos({ peritoId });

    // Filtrar por última actualización si se proporciona
    const casosActualizados = ultimaActualizacion
      ? casos.filter(caso => new Date(caso.fechaActualizacion) > new Date(ultimaActualizacion))
      : casos;

    console.log(`✅ ${casosActualizados.length} asignaciones encontradas`);

    res.json({
      success: true,
      asignaciones: casosActualizados.map(caso => ({
        id: caso.id.toString(),
        peritoId: caso.peritoId,
        direccion: caso.direccion,
        municipio: caso.ciudad,
        tipo: caso.tipoInmueble,
        estado: caso.estado,
        fechaLimite: caso.fechaLimite,
        prioridad: caso.prioridad,
        coordenadas: null, // Agregar si existe en BD
        data: {
          codigo: caso.codigo,
          barrio: caso.barrio,
          fechaCreacion: caso.fechaCreacion,
          fechaActualizacion: caso.fechaActualizacion
        }
      })),
      total: casosActualizados.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sync/status/:peritoId
 * Obtener estado de sincronización de un perito
 */
router.get('/status/:peritoId', async (req, res, next) => {
  try {
    const { peritoId } = req.params;

    // Obtener estadísticas del perito
    const casos = await sqlService.listarCasos({ peritoId });

    const pendientes = casos.filter(c => c.estado === 'pendiente' || c.estado === 'asignado');
    const enProceso = casos.filter(c => c.estado === 'en_proceso');
    const completados = casos.filter(c => c.estado === 'completado');

    let totalArchivos = 0;
    let totalFormularios = 0;

    for (const caso of casos) {
      const archivos = await sqlService.listarArchivosDeCaso(caso.id);
      const formularios = await sqlService.obtenerFormulariosDeCaso(caso.id);
      totalArchivos += archivos.length;
      totalFormularios += formularios.length;
    }

    res.json({
      success: true,
      peritoId,
      estadisticas: {
        totalCasos: casos.length,
        pendientes: pendientes.length,
        enProceso: enProceso.length,
        completados: completados.length,
        totalArchivos,
        totalFormularios
      },
      ultimaActualizacion: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
