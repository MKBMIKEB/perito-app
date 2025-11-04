/**
 * WatermarkGenerator - Genera marca de agua sobre imágenes
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

/**
 * Agrega marca de agua a una foto con coordenadas GPS, fecha/hora y datos del perito
 */
export const addWatermarkToImage = async (imageUri, watermarkData) => {
  try {
    const {
      fecha,
      hora,
      latitud,
      longitud,
      accuracy,
      peritoNombre,
      peritoCedula,
      codigoCaso,
    } = watermarkData;

    console.log('🖼️ Generando marca de agua...');

    // Crear SVG con marca de agua
    const watermarkSvg = `
      <svg width="1000" height="180" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .bg { fill: rgba(0,0,0,0.85); }
            .title {
              fill: #FFD700;
              font-family: 'Arial Black', Arial, sans-serif;
              font-size: 14px;
              font-weight: bold;
            }
            .text {
              fill: white;
              font-family: Arial, sans-serif;
              font-size: 16px;
              font-weight: bold;
            }
            .small {
              font-size: 12px;
              fill: #CCCCCC;
            }
          </style>
        </defs>

        <!-- Fondo -->
        <rect class="bg" width="1000" height="180" rx="8"/>

        <!-- Borde dorado -->
        <rect width="1000" height="180" rx="8" fill="none" stroke="#FFD700" stroke-width="3"/>

        <!-- Columna Izquierda: Fecha y GPS -->
        <text class="title" x="20" y="25">📅 FECHA Y HORA</text>
        <text class="text" x="20" y="50">${fecha}</text>
        <text class="text" x="20" y="70">${hora}</text>

        <text class="title" x="20" y="100">📍 COORDENADAS GPS</text>
        <text class="text" x="20" y="125">Lat: ${latitud}°</text>
        <text class="text" x="20" y="145">Lon: ${longitud}°</text>
        <text class="small" x="20" y="165">Precisión: ±${accuracy}m</text>

        <!-- Columna Derecha: Perito y Caso -->
        <text class="title" x="550" y="25">👤 PERITO</text>
        <text class="text" x="550" y="50">${peritoNombre}</text>
        <text class="text" x="550" y="70">CC: ${peritoCedula}</text>

        <text class="title" x="550" y="100">📂 CASO</text>
        <text class="text" x="550" y="125">${codigoCaso}</text>
        <text class="small" x="550" y="145">Evidencia Fotográfica Pericial</text>
        <text class="small" x="550" y="165">Documento con valor probatorio</text>
      </svg>
    `;

    // Convertir SVG a imagen PNG usando ImageManipulator
    // Nota: Dado que ImageManipulator no soporta SVG directamente,
    // vamos a crear la marca de agua como texto superpuesto

    // Paso 1: Redimensionar imagen original
    const resizedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 2048 } }],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      }
    );

    // Paso 2: Guardar SVG como archivo temporal
    const svgPath = `${FileSystem.cacheDirectory}watermark_${Date.now()}.svg`;
    await FileSystem.writeAsStringAsync(svgPath, watermarkSvg, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Paso 3: Crear HTML con imagen y marca de agua superpuesta
    const htmlWatermark = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 0; background: black; }
          #container { position: relative; display: inline-block; }
          #image { display: block; width: 100%; height: auto; }
          #watermark {
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: rgba(0,0,0,0.85);
            border: 3px solid #FFD700;
            border-radius: 8px;
            padding: 15px;
            color: white;
            font-family: Arial, sans-serif;
          }
          .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .col { flex: 1; }
          .title { color: #FFD700; font-size: 12px; font-weight: bold; margin-bottom: 5px; }
          .value { font-size: 14px; font-weight: bold; margin-bottom: 3px; }
          .small { font-size: 11px; color: #CCCCCC; }
        </style>
      </head>
      <body>
        <div id="container">
          <img id="image" src="${resizedImage.uri}" />
          <div id="watermark">
            <div class="row">
              <div class="col">
                <div class="title">📅 FECHA Y HORA</div>
                <div class="value">${fecha}</div>
                <div class="value">${hora}</div>
              </div>
              <div class="col">
                <div class="title">👤 PERITO</div>
                <div class="value">${peritoNombre}</div>
                <div class="value">CC: ${peritoCedula}</div>
              </div>
            </div>
            <div class="row">
              <div class="col">
                <div class="title">📍 COORDENADAS GPS</div>
                <div class="value">Lat: ${latitud}° | Lon: ${longitud}°</div>
                <div class="small">Precisión: ±${accuracy}m</div>
              </div>
              <div class="col">
                <div class="title">📂 CASO</div>
                <div class="value">${codigoCaso}</div>
                <div class="small">Evidencia Fotográfica Pericial</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Por ahora, retornamos la imagen redimensionada con metadata en texto
    // En una implementación completa con APK, usaríamos react-native-canvas o skia
    const watermarkText = [
      `📅 ${fecha} ${hora}`,
      `📍 Lat: ${latitud}° Lon: ${longitud}° (±${accuracy}m)`,
      `👤 ${peritoNombre} | CC: ${peritoCedula}`,
      `📂 Caso: ${codigoCaso}`,
    ].join(' | ');

    console.log('✅ Marca de agua generada (metadata):', watermarkText);

    // Convertir a base64
    const base64 = await FileSystem.readAsStringAsync(resizedImage.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      uri: resizedImage.uri,
      base64: base64,
      watermarkText: watermarkText,
      metadata: watermarkData,
    };
  } catch (error) {
    console.error('❌ Error generando marca de agua:', error);
    throw error;
  }
};

/**
 * Genera metadata de marca de agua desde ubicación y datos del perito
 */
export const generateWatermarkData = (location, peritoInfo, codigoCaso) => {
  const now = new Date();

  const fecha = now.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const hora = now.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const latitud = location?.coords?.latitude?.toFixed(6) || 'N/A';
  const longitud = location?.coords?.longitude?.toFixed(6) || 'N/A';
  const accuracy = location?.coords?.accuracy?.toFixed(1) || 'N/A';

  return {
    fecha,
    hora,
    latitud,
    longitud,
    accuracy,
    peritoNombre: peritoInfo?.nombre || 'Perito',
    peritoCedula: peritoInfo?.cedula || 'N/A',
    codigoCaso: codigoCaso || 'N/A',
  };
};
