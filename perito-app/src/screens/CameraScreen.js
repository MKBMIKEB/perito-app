/**
 * CameraScreen - Cámara Integrada con Marca de Agua Visual
 * Compatible con Expo Go
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { captureRef } from 'react-native-view-shot';
import { ArrowLeft, RotateCw, Zap, ZapOff } from 'lucide-react-native';
import { COLORS } from '../constants';
import ApiService from '../services/ApiService';
import AzureAuthService from '../services/AzureAuthService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CameraScreen = ({ navigation, route }) => {
  const { codigoCaso } = route.params || {};
  const cameraRef = useRef(null);
  const viewShotRef = useRef(null);

  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [peritoInfo, setPeritoInfo] = useState({ nombre: 'Perito', cedula: 'N/A' });
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // 🕐 Actualizar fecha/hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🔐 Obtener información del perito
  useEffect(() => {
    const fetchPeritoInfo = async () => {
      try {
        const userInfo = await AzureAuthService.getUserInfo();
        if (userInfo) {
          setPeritoInfo({
            nombre: userInfo.displayName || userInfo.nombre || 'Perito',
            cedula: userInfo.cedula || userInfo.jobTitle || 'N/A',
          });
        }
      } catch (error) {
        console.warn('⚠️ No se pudo obtener info del perito:', error.message);
      }
    };
    fetchPeritoInfo();
  }, []);

  // 📍 Solicitar permisos de cámara y ubicación
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      console.log('🔐 Solicitando permisos de cámara...');

      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      console.log('📷 Permiso de cámara:', cameraStatus);
      setHasCameraPermission(cameraStatus === 'granted');

      if (cameraStatus !== 'granted') {
        Alert.alert(
          'Permiso de Cámara Requerido',
          'Necesitamos acceso a tu cámara para tomar fotos.'
        );
        return;
      }

      console.log('🔐 Solicitando permisos de ubicación...');
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      console.log('📍 Permiso de ubicación:', locationStatus);
      setHasLocationPermission(locationStatus === 'granted');

      if (locationStatus !== 'granted') {
        Alert.alert(
          'Permiso de Ubicación',
          'Se recomienda habilitar GPS para capturar coordenadas en las fotos.'
        );
      } else {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
      Alert.alert('Error', 'No se pudieron solicitar los permisos: ' + error.message);
    }
  };

  // 📍 Obtener ubicación GPS actual
  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);
      return location;
    } catch (error) {
      console.warn('⚠️ Error obteniendo GPS:', error);
      return null;
    }
  };

  // 📸 Capturar foto con marca de agua visible
  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      // Actualizar ubicación GPS
      const location = await getCurrentLocation();

      console.log('📸 Capturando foto con marca de agua...');

      // Esperar 500ms para asegurar que la marca de agua esté renderizada
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capturar la vista completa (cámara + marca de agua superpuesta)
      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.9,
      });

      console.log('✅ Foto capturada con marca de agua:', uri);

      // Convertir a base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        await uploadPhoto(base64, location);
      };

      reader.readAsDataURL(blob);

    } catch (error) {
      console.error('❌ Error capturando foto:', error);
      Alert.alert('Error', 'No se pudo capturar la foto. Intenta nuevamente.');
      setIsCapturing(false);
    }
  };

  // ☁️ Subir foto a OneDrive
  const uploadPhoto = async (base64, location) => {
    try {
      console.log('☁️ Subiendo foto a OneDrive...');

      const metadata = {
        fechaCaptura: new Date().toISOString(),
        latitud: location?.coords?.latitude || null,
        longitud: location?.coords?.longitude || null,
        accuracy: location?.coords?.accuracy || null,
        peritoNombre: peritoInfo.nombre,
        peritoCedula: peritoInfo.cedula,
        codigoCaso: codigoCaso,
        nombreArchivo: `foto_${Date.now()}.jpg`,
      };

      await ApiService.uploadFoto(codigoCaso, base64, metadata);

      Alert.alert(
        '✅ Foto Subida Exitosamente',
        `Foto con marca de agua subida a OneDrive\n\n📅 ${currentDateTime.toLocaleString('es-CO')}\n📍 GPS: ${metadata.latitud?.toFixed(6)}, ${metadata.longitud?.toFixed(6)}\n👤 ${peritoInfo.nombre}\n📂 Caso: ${codigoCaso}`,
        [
          { text: 'Tomar Otra', style: 'default' },
          { text: 'Volver', onPress: () => navigation.goBack(), style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('❌ Error subiendo foto:', error);
      Alert.alert(
        'Error al Subir',
        'No se pudo subir la foto a OneDrive.\n\n' + error.message
      );
    } finally {
      setIsCapturing(false);
    }
  };

  // 🔄 Cambiar cámara (frontal/trasera)
  const toggleCameraType = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  // ⚡ Cambiar flash
  const toggleFlash = () => {
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };

  // Formatear fecha y hora
  const fecha = currentDateTime.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const hora = currentDateTime.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const lat = currentLocation?.coords?.latitude?.toFixed(6) || 'Obteniendo...';
  const lon = currentLocation?.coords?.longitude?.toFixed(6) || 'Obteniendo...';
  const accuracy = currentLocation?.coords?.accuracy?.toFixed(1) || '---';

  // Verificar permisos
  if (hasCameraPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Solicitando permisos...</Text>
      </View>
    );
  }

  if (hasCameraPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>❌ Permiso de Cámara Denegado</Text>
        <Text style={styles.errorSubText}>
          Para usar la cámara, ve a:{'\n'}
          Configuración {'>'} Aplicaciones {'>'} Expo Go {'>'} Permisos{'\n'}
          y habilita el acceso a la Cámara
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#666', marginTop: 10 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} ref={viewShotRef} collapsable={false}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Cámara */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        flashMode={flashMode}
        ratio="16:9"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📷 Caso {codigoCaso}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* MARCA DE AGUA SUPERPUESTA - Recuadro Inferior */}
        <View style={styles.watermarkContainer}>
          <View style={styles.watermarkBox}>
            {/* Título */}
            <View style={styles.watermarkHeader}>
              <Text style={styles.watermarkTitle}>
                ⚠️ EVIDENCIA FOTOGRÁFICA PERICIAL
              </Text>
            </View>

            {/* Contenido en 2 columnas */}
            <View style={styles.watermarkContent}>
              {/* Columna Izquierda */}
              <View style={styles.watermarkColumn}>
                <Text style={styles.watermarkLabel}>📅 FECHA Y HORA</Text>
                <Text style={styles.watermarkValue}>{fecha}</Text>
                <Text style={styles.watermarkValue}>{hora}</Text>

                <Text style={[styles.watermarkLabel, { marginTop: 12 }]}>
                  📍 COORDENADAS GPS
                </Text>
                <Text style={styles.watermarkValue}>Lat: {lat}°</Text>
                <Text style={styles.watermarkValue}>Lon: {lon}°</Text>
                <Text style={styles.watermarkSmall}>Precisión: ±{accuracy}m</Text>
              </View>

              {/* Columna Derecha */}
              <View style={styles.watermarkColumn}>
                <Text style={styles.watermarkLabel}>👤 PERITO</Text>
                <Text style={styles.watermarkValue}>{peritoInfo.nombre}</Text>
                <Text style={styles.watermarkValue}>CC: {peritoInfo.cedula}</Text>

                <Text style={[styles.watermarkLabel, { marginTop: 12 }]}>
                  📂 CASO
                </Text>
                <Text style={styles.watermarkValue}>{codigoCaso}</Text>
                <Text style={styles.watermarkSmall}>Documento Probatorio</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Controles */}
        <View style={styles.controls}>
          {/* Botón Flash */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleFlash}
            disabled={isCapturing}
          >
            {flashMode === Camera.Constants.FlashMode.on ? (
              <Zap size={28} color="#FFD700" />
            ) : (
              <ZapOff size={28} color="#FFF" />
            )}
          </TouchableOpacity>

          {/* Botón Capturar */}
          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="large" color="#FFF" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          {/* Botón Cambiar Cámara */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleCameraType}
            disabled={isCapturing}
          >
            <RotateCw size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Overlay de Procesamiento */}
        {isCapturing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.processingText}>Procesando foto...</Text>
            <Text style={styles.processingSubText}>Guardando marca de agua</Text>
          </View>
        )}
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },

  // MARCA DE AGUA SUPERPUESTA
  watermarkContainer: {
    position: 'absolute',
    bottom: 130,
    left: 10,
    right: 10,
  },
  watermarkBox: {
    backgroundColor: 'rgba(0,0,0,0.90)',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFD700',
    padding: 15,
  },
  watermarkHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
    paddingBottom: 8,
    marginBottom: 12,
  },
  watermarkTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  watermarkContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  watermarkColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  watermarkLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  watermarkValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  watermarkSmall: {
    fontSize: 10,
    color: '#CCCCCC',
    marginTop: 2,
  },

  // Controles
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },

  // Overlay de procesamiento
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 20,
    fontWeight: 'bold',
  },
  processingSubText: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 8,
  },

  // Estados de carga y error
  loadingText: {
    fontSize: 16,
    color: '#FFF',
    marginTop: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  errorSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default CameraScreen;
