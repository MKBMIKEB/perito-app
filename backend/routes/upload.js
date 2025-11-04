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

    const logCtx = {
      usuario: req.user?.email,
      userId: req.user?.id,
      casoId,
      codigoCaso,
      tipoFoto,
    };
    const t0 = Date.now();
    console.log('📥 [UPLOAD/FOTO] Solicitud recibida', {
      ...logCtx,
      base64Provided: Boolean(fotoBase64),
      base64Length: fotoBase64 ? fotoBase64.length : 0,
      coords: coordenadas ? { lat: coordenadas.latitud, lng: coordenadas.longitud } : null,
    });

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
    console.log('📏 [UPLOAD/FOTO] Tamaño buffer (bytes):', buffer.length);

    // Generar nombre de archivo si no se proporciona
    const timestamp = Date.now();
    const extension = fotoBase64.match(/data:image\/(\w+);base64/)?.[1] || 'jpg';
    const fileName = nombreArchivo || `${tipoFoto || 'foto'}_${timestamp}.${extension}`;
    console.log('📝 [UPLOAD/FOTO] Archivo a subir:', {
      fileName,
      extension,
      ruta: `DatosPeritos/${codigoCaso}/Fotos/${fileName}`,
    });

    // Subir a OneDrive
    const uploadStart = Date.now();
    const uploadResult = await onedriveService.subirArchivo(
      req.user.token,
      codigoCaso,
      'foto',
      fileName,
      buffer
    );
    console.log('✅ [UPLOAD/FOTO] Subida OneDrive OK', {
      driveItemId: uploadResult?.id,
      webUrl: uploadResult?.webUrl,
      msDurationMs: Date.now() - uploadStart,
    });

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

    const regStart = Date.now();
    const archivo = await sqlService.registrarArchivo(archivoData);
    console.log('✅ [UPLOAD/FOTO] Registro SQL OK', {
      archivoId: archivo?.id,
      sqlDurationMs: Date.now() - regStart,
      totalDurationMs: Date.now() - t0,
    });

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
    console.error('❌ [UPLOAD/FOTO] Error', {
      mensaje: error.message,
      stack: error.stack,
    });
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
    const t0 = Date.now();
    console.log('📥 [UPLOAD/FORM] Solicitud recibida', {
      usuario: req.user?.email,
      userId: req.user?.id,
      casoId,
      codigoCaso,
      hasDatos: Boolean(datos),
      coords: coordenadas ? { lat: coordenadas.latitud, lng: coordenadas.longitud } : null,
    });

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

    const regFormStart = Date.now();
    const formulario = await sqlService.guardarFormulario(formularioData);
    console.log('✅ [UPLOAD/FORM] Guardado SQL formulario OK', {
      formularioId: formulario?.id,
      sqlFormMs: Date.now() - regFormStart,
    });

    // También guardar JSON en OneDrive
    try {
      const jsonContent = JSON.stringify(datos, null, 2);
      const buffer = Buffer.from(jsonContent, 'utf-8');
      const fileName = `formulario_${Date.now()}.json`;

      console.log('📝 [UPLOAD/FORM] Subiendo a OneDrive', {
        fileName,
        bytes: buffer.length,
        ruta: `DatosPeritos/${codigoCaso}/Formularios/${fileName}`,
      });
      const uploadStart = Date.now();
      const uploadResult = await onedriveService.subirArchivo(
        req.user.token,
        codigoCaso,
        'formulario',
        fileName,
        buffer
      );
      console.log('✅ [UPLOAD/FORM] Subida OneDrive OK', {
        driveItemId: uploadResult?.id,
        webUrl: uploadResult?.webUrl,
        msDurationMs: Date.now() - uploadStart,
      });

      // Registrar archivo en SQL
      const regStart = Date.now();
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
      console.log('✅ [UPLOAD/FORM] Registro SQL archivo OK', {
        sqlDurationMs: Date.now() - regStart,
        totalDurationMs: Date.now() - t0,
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
      console.warn('⚠️  [UPLOAD/FORM] Guardado en SQL pero no en OneDrive:', error.message);

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
    console.error('❌ [UPLOAD/FORM] Error', {
      mensaje: error.message,
      stack: error.stack,
    });
    next(error);
  }
});

module.exports = router;
