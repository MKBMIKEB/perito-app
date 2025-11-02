/**
 * CameraScreen - Azure OneDrive Integration
 * Perito App - Sistema de fotografía con marca de agua GPS
 */

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import {
  ArrowLeft,
  Camera as CameraIcon,
  RotateCcw,
  Image as ImageIcon,
  MapPin,
} from 'lucide-react-native';
import { COLORS } from '../constants';
import ApiService from '../services/ApiService';

const CameraScreen = ({ navigation, route }) => {
  const { codigoCaso, casoId } = route.params || {};

  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [peritoInfo, setPeritoInfo] = useState(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  const cameraRef = useRef(null);

  useEffect(() => {
    requestPermissions();
    loadPeritoInfo();
    getCurrentLocation();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

    setHasCameraPermission(cameraStatus === 'granted');
    setHasLocationPermission(locationStatus === 'granted');
  };

  const loadPeritoInfo = async () => {
    try {
      const userData = await ApiService.getMe();
      setPeritoInfo({
        nombre: userData.displayName,
        cedula: userData.jobTitle || 'N/A',
      });
    } catch (error) {
      console.log('Error cargando info del perito:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      if (hasLocationPermission) {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(location);
      }
    } catch (error) {
      console.log('Error obteniendo ubicación:', error);
      Alert.alert('Error GPS', 'No se pudo obtener la ubicación actual');
    }
  };

  const generateWatermarkText = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-CO');
    const timeStr = now.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const lat = currentLocation?.coords?.latitude?.toFixed(6) || 'GPS no disponible';
    const lng = currentLocation?.coords?.longitude?.toFixed(6) || 'GPS no disponible';

    const peritoName = peritoInfo?.nombre || 'Perito';
    const cedula = peritoInfo?.cedula || 'N/A';

    return {
      line1: `📍 ${lat}, ${lng}`,
      line2: `📅 ${dateStr} - ⏰ ${timeStr}`,
      line3: `👤 ${peritoName} - CC: ${cedula}`,
      line4: `🏷️ ${codigoCaso || 'Sin asignación'}`,
    };
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      // Actualizar ubicación antes de capturar
      await getCurrentLocation();

      if (!currentLocation) {
        Alert.alert(
          'GPS no disponible',
          '¿Deseas continuar sin coordenadas GPS?',
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => setIsCapturing(false) },
            { text: 'Continuar', onPress: () => captureWithoutGPS() }
          ]
        );
        return;
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });

      console.log('📷 Foto capturada, subiendo a OneDrive...');

      // Preparar metadatos
      const metadata = {
        fechaCaptura: new Date().toISOString(),
        latitud: currentLocation?.coords?.latitude,
        longitud: currentLocation?.coords?.longitude,
        accuracy: currentLocation?.coords?.accuracy,
        peritoNombre: peritoInfo?.nombre,
        nombreArchivo: `foto_${Date.now()}.jpg`,
      };

      // Subir a OneDrive via backend
      const result = await ApiService.uploadFoto(
        codigoCaso,
        photo.base64,
        metadata
      );

      console.log('✅ Foto subida exitosamente:', result.url);

      Alert.alert(
        '📷 Foto Capturada',
        '✅ Foto subida exitosamente a OneDrive',
        [
          { text: 'Tomar Otra', style: 'default' },
          { text: 'Finalizar', onPress: () => navigation.goBack() }
        ]
      );

    } catch (error) {
      console.error('❌ Error capturando/subiendo foto:', error);
      Alert.alert('Error', 'No se pudo subir la foto: ' + error.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const captureWithoutGPS = async () => {
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });

      const metadata = {
        fechaCaptura: new Date().toISOString(),
        peritoNombre: peritoInfo?.nombre,
        nombreArchivo: `foto_${Date.now()}.jpg`,
      };

      await ApiService.uploadFoto(
        codigoCaso,
        photo.base64,
        metadata
      );

      Alert.alert(
        '📷 Foto Capturada',
        '✅ Foto subida exitosamente (sin GPS)',
        [
          { text: 'Tomar Otra', style: 'default' },
          { text: 'Finalizar', onPress: () => navigation.goBack() }
        ]
      );

    } catch (error) {
      console.error('❌ Error subiendo foto sin GPS:', error);
      Alert.alert('Error', 'No se pudo subir la foto');
    } finally {
      setIsCapturing(false);
    }
  };

  const flipCamera = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  if (hasCameraPermission === null || hasLocationPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Solicitando permisos...</Text>
      </View>
    );
  }

  if (hasCameraPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <CameraIcon size={64} color={COLORS.error} />
        <Text style={styles.permissionText}>Sin acceso a la cámara</Text>
        <Text style={styles.permissionSubtext}>
          Habilita los permisos de cámara en la configuración
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Regresar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasLocationPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <MapPin size={64} color={COLORS.error} />
        <Text style={styles.permissionText}>Sin acceso al GPS</Text>
        <Text style={styles.permissionSubtext}>
          Habilita los permisos de ubicación para incluir coordenadas en las fotos
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Continuar sin GPS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const watermarkData = generateWatermarkText();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        ratio="16:9"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerText}>📷 Cámara Perito</Text>
            <Text style={styles.headerSubtext}>
              {codigoCaso || 'Foto General'}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.headerButton} onPress={flipCamera}>
            <RotateCcw size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Marca de Agua Overlay */}
        <View style={styles.watermarkOverlay}>
          <View style={styles.watermarkContainer}>
            <Text style={styles.watermarkText}>{watermarkData.line1}</Text>
            <Text style={styles.watermarkText}>{watermarkData.line2}</Text>
            <Text style={styles.watermarkText}>{watermarkData.line3}</Text>
            <Text style={styles.watermarkText}>{watermarkData.line4}</Text>
          </View>
        </View>

        {/* GPS Status */}
        <View style={styles.gpsStatus}>
          <View style={[
            styles.gpsIndicator, 
            { backgroundColor: currentLocation ? COLORS.success : COLORS.error }
          ]}>
            <MapPin size={16} color="#FFFFFF" />
            <Text style={styles.gpsText}>
              {currentLocation ? 'GPS Activo' : 'Sin GPS'}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.galleryButton}>
            <ImageIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.captureButton, isCapturing && styles.capturingButton]}
            onPress={capturePhoto}
            disabled={isCapturing}
          >
            <View style={styles.captureButtonInner}>
              {isCapturing ? (
                <View style={styles.capturingIndicator} />
              ) : (
                <CameraIcon size={32} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
          
          <View style={styles.placeholder} />
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  permissionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 16,
  },
  permissionSubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtext: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  watermarkOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
  },
  watermarkContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  watermarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  gpsStatus: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    right: 20,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  gpsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
  },
  captureButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  capturingButton: {
    backgroundColor: COLORS.warning,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 30,
  },
  capturingIndicator: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  placeholder: {
    width: 50,
    height: 50,
  },
});

export default CameraScreen;