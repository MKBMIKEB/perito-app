/**
 * FormularioCampoScreen
 * Perito App - Observatorio Inmobiliario
 * Formulario completo para diligenciamiento en campo
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import {
  MapPin,
  Camera,
  Save,
  CheckCircle,
  Home,
  Ruler,
  Droplet,
  Zap,
  Flame,
  Navigation
} from 'lucide-react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CasosService from '../services/CasosService';

const FormularioCampoScreen = ({ navigation, route }) => {
  const { asignacionId, peritoId, asignacionData } = route.params || {};

  // Estados del formulario - Información General
  const [direccion, setDireccion] = useState(asignacionData?.direccion || '');
  const [matricula, setMatricula] = useState('');
  const [tipoPredio, setTipoPredio] = useState('Casa');
  const [propietario, setPropietario] = useState('');
  const [telefono, setTelefono] = useState('');

  // Características Físicas
  const [areaTerreno, setAreaTerreno] = useState('');
  const [areaConstruida, setAreaConstruida] = useState('');
  const [frente, setFrente] = useState('');
  const [fondo, setFondo] = useState('');
  const [pisos, setPisos] = useState('1');
  const [habitaciones, setHabitaciones] = useState('');
  const [banos, setBanos] = useState('');
  const [garajes, setGarajes] = useState('');
  const [estadoConservacion, setEstadoConservacion] = useState('Bueno');

  // Servicios Públicos
  const [agua, setAgua] = useState(true);
  const [luz, setLuz] = useState(true);
  const [gas, setGas] = useState(false);
  const [alcantarillado, setAlcantarillado] = useState(true);
  const [internet, setInternet] = useState(false);

  // Ubicación
  const [coordenadas, setCoordenadas] = useState(null);
  const [loadingGPS, setLoadingGPS] = useState(false);

  // Observaciones
  const [observaciones, setObservaciones] = useState('');

  // Estado del formulario
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarBorrador();
  }, []);

  const cargarBorrador = async () => {
    try {
      const borrador = await AsyncStorage.getItem(`formulario_${asignacionId}`);
      if (borrador) {
        const data = JSON.parse(borrador);
        // Cargar datos guardados
        setDireccion(data.direccion || '');
        setMatricula(data.matricula || '');
        setTipoPredio(data.tipoPredio || 'Casa');
        // ... cargar demás campos
      }
    } catch (error) {
      console.log('Error cargando borrador:', error);
    }
  };

  const capturarUbicacion = async () => {
    setLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Se necesita acceso a la ubicación');
        setLoadingGPS(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCoordenadas({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });

      Alert.alert(
        'Ubicación Capturada',
        `Lat: ${location.coords.latitude.toFixed(6)}\nLng: ${location.coords.longitude.toFixed(6)}\nPrecisión: ${location.coords.accuracy.toFixed(0)}m`
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación');
      console.error(error);
    } finally {
      setLoadingGPS(false);
    }
  };

  const tomarFotografia = () => {
    navigation.navigate('Camera', {
      asignacionId,
      peritoId,
      returnTo: 'FormularioCampo'
    });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return '#EF4444';
      case 'en_progreso': return '#F59E0B';
      case 'completado': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'en_progreso': return 'En Progreso';
      case 'completado': return 'Completado';
      default: return estado;
    }
  };

  const validarFormulario = () => {
    if (!direccion.trim()) {
      Alert.alert('Campo Requerido', 'La dirección es obligatoria');
      return false;
    }
    if (!matricula.trim()) {
      Alert.alert('Campo Requerido', 'La matrícula es obligatoria');
      return false;
    }
    if (!coordenadas) {
      Alert.alert('Ubicación Requerida', 'Debes capturar la ubicación GPS del predio');
      return false;
    }
    if (!areaTerreno || parseFloat(areaTerreno) <= 0) {
      Alert.alert('Campo Inválido', 'El área del terreno debe ser mayor a 0');
      return false;
    }
    return true;
  };

  const guardarBorrador = async () => {
    try {
      const data = {
        direccion,
        matricula,
        tipoPredio,
        propietario,
        telefono,
        areaTerreno,
        areaConstruida,
        frente,
        fondo,
        pisos,
        habitaciones,
        banos,
        garajes,
        estadoConservacion,
        agua,
        luz,
        gas,
        alcantarillado,
        internet,
        coordenadas,
        observaciones,
        fechaActualizacion: new Date().toISOString(),
      };

      await AsyncStorage.setItem(`formulario_${asignacionId}`, JSON.stringify(data));
      Alert.alert('Borrador Guardado', 'Puedes continuar más tarde');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el borrador');
      console.error(error);
    }
  };

  const guardarFormulario = async () => {
    if (!validarFormulario()) return;

    setSaving(true);
    try {
      const formulario = {
        id: `FORM_${Date.now()}`,
        asignacionId,
        peritoId,
        // Información General
        direccion,
        matricula,
        tipoPredio,
        propietario,
        telefono,
        // Características Físicas
        areaTerreno: parseFloat(areaTerreno),
        areaConstruida: parseFloat(areaConstruida) || 0,
        frente: parseFloat(frente) || 0,
        fondo: parseFloat(fondo) || 0,
        pisos: parseInt(pisos) || 1,
        habitaciones: parseInt(habitaciones) || 0,
        banos: parseInt(banos) || 0,
        garajes: parseInt(garajes) || 0,
        estadoConservacion,
        // Servicios Públicos
        servicios: {
          agua,
          luz,
          gas,
          alcantarillado,
          internet,
        },
        // Ubicación
        coordenadas,
        // Observaciones
        observaciones,
        // Metadata
        fechaCreacion: new Date().toISOString(),
        estado: 'completado',
      };

      // Guardar en Firebase y actualizar estado del caso
      console.log('💾 Guardando formulario en Firebase...');
      const exitoFirebase = await CasosService.guardarFormularioCampo(formulario);

      if (exitoFirebase) {
        console.log('✅ Formulario guardado en Firebase');
      } else {
        console.log('⚠️ Formulario guardado localmente, se sincronizará después');
      }

      // Guardar también en AsyncStorage local como respaldo
      const formularios = await AsyncStorage.getItem('formularios_campo');
      const lista = formularios ? JSON.parse(formularios) : [];
      lista.push(formulario);
      await AsyncStorage.setItem('formularios_campo', JSON.stringify(lista));

      // Eliminar borrador
      await AsyncStorage.removeItem(`formulario_${asignacionId}`);

      Alert.alert(
        'Formulario Guardado',
        exitoFirebase
          ? '✅ Formulario guardado y sincronizado con Firebase'
          : '✅ Formulario guardado localmente. Se sincronizará cuando haya conexión.',
        [
          {
            text: 'Ver Fotos',
            onPress: () => navigation.navigate('PhotoManager'),
          },
          {
            text: 'Volver a Inicio',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el formulario');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const SeccionHeader = ({ icon, titulo }) => (
    <View style={styles.seccionHeader}>
      {icon}
      <Text style={styles.seccionTitulo}>{titulo}</Text>
    </View>
  );

  const Campo = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }) => (
    <View style={styles.campoContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );

  const Selector = ({ label, value, opciones, onSelect }) => (
    <View style={styles.campoContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.selectorContainer}>
        {opciones.map((opcion) => (
          <TouchableOpacity
            key={opcion}
            style={[styles.selectorBoton, value === opcion && styles.selectorBotonActivo]}
            onPress={() => onSelect(opcion)}
          >
            <Text style={[styles.selectorTexto, value === opcion && styles.selectorTextoActivo]}>
              {opcion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const ServicioSwitch = ({ label, value, onValueChange, icon }) => (
    <View style={styles.servicioRow}>
      <View style={styles.servicioInfo}>
        {icon}
        <Text style={styles.servicioLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D1D5DB', true: '#10B981' }}
        thumbColor={value ? '#FFFFFF' : '#F3F4F6'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diligenciamiento en Campo</Text>
        <TouchableOpacity onPress={guardarBorrador} style={styles.draftButton}>
          <Text style={styles.draftText}>Guardar Borrador</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Información de la Asignación */}
        {asignacionData && (
          <View style={styles.asignacionInfo}>
            <View style={styles.asignacionHeader}>
              <Text style={styles.asignacionId}>{asignacionData.id}</Text>
              <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(asignacionData.estado) }]}>
                <Text style={styles.estadoText}>{getEstadoTexto(asignacionData.estado)}</Text>
              </View>
            </View>
            <Text style={styles.asignacionTipo}>{asignacionData.tipo}</Text>
            <Text style={styles.asignacionMunicipio}>{asignacionData.municipio}</Text>
          </View>
        )}

        {/* Información General */}
        <View style={styles.seccion}>
          <SeccionHeader icon={<Home size={20} color="#1D4ED8" />} titulo="Información General" />

          <Campo
            label="Dirección *"
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Ej: Calle 123 #45-67"
          />

          <Campo
            label="Matrícula Inmobiliaria *"
            value={matricula}
            onChangeText={setMatricula}
            placeholder="Ej: 50N-12345678"
          />

          <Selector
            label="Tipo de Predio *"
            value={tipoPredio}
            opciones={['Casa', 'Apartamento', 'Lote', 'Local', 'Bodega']}
            onSelect={setTipoPredio}
          />

          <Campo
            label="Nombre del Propietario"
            value={propietario}
            onChangeText={setPropietario}
            placeholder="Nombre completo"
          />

          <Campo
            label="Teléfono de Contacto"
            value={telefono}
            onChangeText={setTelefono}
            placeholder="300 123 4567"
            keyboardType="phone-pad"
          />
        </View>

        {/* Características Físicas */}
        <View style={styles.seccion}>
          <SeccionHeader icon={<Ruler size={20} color="#10B981" />} titulo="Características Físicas" />

          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Campo
                label="Área Terreno (m²) *"
                value={areaTerreno}
                onChangeText={setAreaTerreno}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfColumn}>
              <Campo
                label="Área Construida (m²)"
                value={areaConstruida}
                onChangeText={setAreaConstruida}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Campo
                label="Frente (m)"
                value={frente}
                onChangeText={setFrente}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfColumn}>
              <Campo
                label="Fondo (m)"
                value={fondo}
                onChangeText={setFondo}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.quarterColumn}>
              <Campo
                label="Pisos"
                value={pisos}
                onChangeText={setPisos}
                placeholder="1"
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.quarterColumn}>
              <Campo
                label="Habitaciones"
                value={habitaciones}
                onChangeText={setHabitaciones}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.quarterColumn}>
              <Campo
                label="Baños"
                value={banos}
                onChangeText={setBanos}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.quarterColumn}>
              <Campo
                label="Garajes"
                value={garajes}
                onChangeText={setGarajes}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Selector
            label="Estado de Conservación"
            value={estadoConservacion}
            opciones={['Excelente', 'Bueno', 'Regular', 'Malo']}
            onSelect={setEstadoConservacion}
          />
        </View>

        {/* Servicios Públicos */}
        <View style={styles.seccion}>
          <SeccionHeader icon={<Droplet size={20} color="#3B82F6" />} titulo="Servicios Públicos" />

          <ServicioSwitch
            label="Agua Potable"
            value={agua}
            onValueChange={setAgua}
            icon={<Droplet size={16} color="#3B82F6" />}
          />
          <ServicioSwitch
            label="Energía Eléctrica"
            value={luz}
            onValueChange={setLuz}
            icon={<Zap size={16} color="#F59E0B" />}
          />
          <ServicioSwitch
            label="Gas Natural"
            value={gas}
            onValueChange={setGas}
            icon={<Flame size={16} color="#EF4444" />}
          />
          <ServicioSwitch
            label="Alcantarillado"
            value={alcantarillado}
            onValueChange={setAlcantarillado}
            icon={<Droplet size={16} color="#6B7280" />}
          />
          <ServicioSwitch
            label="Internet"
            value={internet}
            onValueChange={setInternet}
            icon={<Zap size={16} color="#8B5CF6" />}
          />
        </View>

        {/* Ubicación GPS */}
        <View style={styles.seccion}>
          <SeccionHeader icon={<MapPin size={20} color="#EF4444" />} titulo="Ubicación GPS" />

          {coordenadas ? (
            <View style={styles.coordenadasContainer}>
              <Text style={styles.coordenadasLabel}>Ubicación Capturada:</Text>
              <Text style={styles.coordenadasTexto}>Latitud: {coordenadas.latitude.toFixed(6)}</Text>
              <Text style={styles.coordenadasTexto}>Longitud: {coordenadas.longitude.toFixed(6)}</Text>
              <Text style={styles.coordenadasTexto}>Precisión: {coordenadas.accuracy?.toFixed(0)}m</Text>
              <TouchableOpacity style={styles.recapturarButton} onPress={capturarUbicacion}>
                <Navigation size={16} color="#1D4ED8" />
                <Text style={styles.recapturarTexto}>Recapturar Ubicación</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={capturarUbicacion}
              disabled={loadingGPS}
            >
              <MapPin size={24} color="#FFFFFF" />
              <Text style={styles.gpsButtonText}>
                {loadingGPS ? 'Obteniendo Ubicación...' : 'Capturar Ubicación GPS'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Evidencias Fotográficas */}
        <View style={styles.seccion}>
          <SeccionHeader icon={<Camera size={20} color="#8B5CF6" />} titulo="Evidencias Fotográficas" />

          <TouchableOpacity style={styles.cameraButton} onPress={tomarFotografia}>
            <Camera size={24} color="#FFFFFF" />
            <Text style={styles.cameraButtonText}>Tomar Fotografías</Text>
          </TouchableOpacity>
        </View>

        {/* Observaciones */}
        <View style={styles.seccion}>
          <Campo
            label="Observaciones Generales"
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder="Ingrese observaciones sobre el predio, acceso, condiciones especiales, etc."
            multiline={true}
          />
        </View>

        {/* Botón Guardar */}
        <View style={styles.seccion}>
          <TouchableOpacity
            style={[styles.guardarButton, saving && styles.guardarButtonDisabled]}
            onPress={guardarFormulario}
            disabled={saving}
          >
            <CheckCircle size={24} color="#FFFFFF" />
            <Text style={styles.guardarButtonText}>
              {saving ? 'Guardando...' : 'Guardar Formulario'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1D4ED8',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  draftButton: {
    padding: 5,
  },
  draftText: {
    color: '#BFDBFE',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  asignacionInfo: {
    backgroundColor: '#EFF6FF',
    marginTop: 12,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1D4ED8',
  },
  asignacionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  asignacionId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  estadoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  asignacionTipo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  asignacionMunicipio: {
    fontSize: 14,
    color: '#6B7280',
  },
  seccion: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  campoContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorBoton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  selectorBotonActivo: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  selectorTexto: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectorTextoActivo: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  halfColumn: {
    flex: 1,
  },
  quarterColumn: {
    flex: 1,
  },
  servicioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  servicioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servicioLabel: {
    fontSize: 16,
    color: '#374151',
  },
  gpsButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  gpsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  coordenadasContainer: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  coordenadasLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803D',
    marginBottom: 8,
  },
  coordenadasTexto: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 4,
  },
  recapturarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    gap: 6,
  },
  recapturarTexto: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '600',
  },
  cameraButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cameraButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guardarButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 10,
  },
  guardarButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  guardarButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FormularioCampoScreen;
