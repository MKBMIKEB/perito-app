/**
 * Rutas de Upload (Subida de Archivos)
 */

const express = require('express');
const router = express.Router();
const sqlService = require('../services/sqlService');
const onedriveService = require('../services/onedriveService');
const { ValidationError, NotFoundError } = require('../middlewares/errorHandler');

/**
 * POST /api/upload/foto
 * Subir foto a OneDrive
 */
router.post('/foto', async (req, res, next) => {
  try {
    const { casoId, codigoCaso, tipoFoto, nombreArchivo, fotoBase64, coordenadas } = req.body;

    // Validaciones
    if (!casoId || !codigoCaso || !fotoBase64) {
      throw new ValidationError('casoId, codigoCaso y fotoBase64 son requeridos');
    }

    // Verificar que el caso existe
    const caso = await sqlService.obtenerCasoPorId(casoId);
    if (!caso) {
      throw new NotFoundError('Caso');
    }

    // Convertir base64 a buffer
    const base64Data = fotoBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generar nombre de archivo si no se proporciona
    const timestamp = Date.now();
    const extension = fotoBase64.match(/data:image\/(\w+);base64/)?.[1] || 'jpg';
    const fileName = nombreArchivo || `${tipoFoto || 'foto'}_${timestamp}.${extension}`;

    // Subir a OneDrive
    const uploadResult = await onedriveService.subirArchivo(
      req.user.token,
      codigoCaso,
      'foto',
      fileName,
      buffer
    );

    // Registrar en base de datos
    const archivoData = {
      casoId,
      codigoCaso,
      nombreArchivo: fileName,
      tipoArchivo: 'foto',
      tamañoBytes: buffer.length,
      mimeType: `image/${extension}`,
      onedriveFileId: uploadResult.id,
      onedriveUrl: uploadResult.webUrl,
      onedriveUrlDescarga: uploadResult['@microsoft.graph.downloadUrl'],
      rutaOnedrive: `DatosPeritos/${codigoCaso}/Fotos/${fileName}`,
      usuarioId: req.user.id,
      usuarioNombre: req.user.name,
      latitud: coordenadas?.latitud || null,
      longitud: coordenadas?.longitud || null
    };

    const archivo = await sqlService.registrarArchivo(archivoData);

    res.status(201).json({
      success: true,
      archivo: {
        id: archivo.id,
        nombreArchivo: fileName,
        onedriveUrl: uploadResult.webUrl,
        onedriveUrlDescarga: uploadResult['@microsoft.graph.downloadUrl'],
        tamañoBytes: buffer.length,
        fechaSubida: new Date().toISOString()
      },
      message: 'Foto subida exitosamente a OneDrive'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/upload/formulario
 * Subir formulario de campo
 */
router.post('/formulario', async (req, res, next) => {
  try {
    const { casoId, codigoCaso, datos, coordenadas } = req.body;

    // Validaciones
    if (!casoId || !codigoCaso || !datos) {
      throw new ValidationError('casoId, codigoCaso y datos son requeridos');
    }

    // Verificar que el caso existe
    const caso = await sqlService.obtenerCasoPorId(casoId);
    if (!caso) {
      throw new NotFoundError('Caso');
    }

    // Guardar formulario en SQL
    const formularioData = {
      casoId,
      codigoCaso,
      peritoId: req.user.id,
      peritoNombre: req.user.name,
      datos: datos,
      latitud: coordenadas?.latitud || null,
      longitud: coordenadas?.longitud || null
    };

    const formulario = await sqlService.guardarFormulario(formularioData);

    // También guardar JSON en OneDrive
    try {
      const jsonContent = JSON.stringify(datos, null, 2);
      const buffer = Buffer.from(jsonContent, 'utf-8');
      const fileName = `formulario_${Date.now()}.json`;

      const uploadResult = await onedriveService.subirArchivo(
        req.user.token,
        codigoCaso,
        'formulario',
        fileName,
        buffer
      );

      // Registrar archivo en SQL
      await sqlService.registrarArchivo({
        casoId,
        codigoCaso,
        nombreArchivo: fileName,
        tipoArchivo: 'formulario',
        tamañoBytes: buffer.length,
        mimeType: 'application/json',
        onedriveFileId: uploadResult.id,
        onedriveUrl: uploadResult.webUrl,
        onedriveUrlDescarga: uploadResult['@microsoft.graph.downloadUrl'],
        rutaOnedrive: `DatosPeritos/${codigoCaso}/Formularios/${fileName}`,
        usuarioId: req.user.id,
        usuarioNombre: req.user.name
      });

      res.status(201).json({
        success: true,
        formulario: {
          id: formulario.id,
          casoId,
          onedriveUrl: uploadResult.webUrl,
          fechaCreacion: new Date().toISOString()
        },
        message: 'Formulario guardado exitosamente'
      });

    } catch (error) {
      console.warn('⚠️  Formulario guardado en SQL pero no en OneDrive:', error.message);

      res.status(201).json({
        success: true,
        formulario: {
          id: formulario.id,
          casoId
        },
        message: 'Formulario guardado en base de datos',
        warning: 'No se pudo guardar en OneDrive'
      });
    }

  } catch (error) {
    next(error);
  }
});

module.exports = router;
