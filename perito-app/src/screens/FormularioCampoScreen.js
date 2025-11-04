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
  ToastAndroid,
  Linking,
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
import DatabaseService from '../services/DatabaseService-native';
import CasosService from '../services/CasosService';
import ApiService from '../services/ApiService';
import { COLORS } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FormularioCampoScreen = ({ navigation, route }) => {
  const { asignacionId, peritoId, asignacionData, caso } = route.params || {};
  // Derivar identificadores para backend/OneDrive
  const casoIdBackend = (caso && caso.id) || (asignacionData && asignacionData.id) || null;
  const codigoCaso = (caso && caso.codigo) || (asignacionData && asignacionData.codigo) || asignacionId;

  // Estados del formulario - InformaciÃƒÂ³n General
  const [direccion, setDireccion] = useState(asignacionData?.direccion || '');
  const [matricula, setMatricula] = useState('');
  const [tipoPredio, setTipoPredio] = useState('Casa');
  const [propietario, setPropietario] = useState('');
  const [telefono, setTelefono] = useState('');

  // CaracterÃƒÂ­sticas FÃƒÂ­sicas
  const [areaTerreno, setAreaTerreno] = useState('');
  const [areaConstruida, setAreaConstruida] = useState('');
  const [frente, setFrente] = useState('');
  const [fondo, setFondo] = useState('');
  const [pisos, setPisos] = useState('1');
  const [habitaciones, setHabitaciones] = useState('');
  const [banos, setBanos] = useState('');
  const [garajes, setGarajes] = useState('');
  const [estadoConservacion, setEstadoConservacion] = useState('Bueno');

  // Servicios PÃƒÂºblicos
  const [agua, setAgua] = useState(true);
  const [luz, setLuz] = useState(true);
  const [gas, setGas] = useState(false);
  const [alcantarillado, setAlcantarillado] = useState(true);
  const [internet, setInternet] = useState(false);

  // UbicaciÃƒÂ³n
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
      console.log('?? Cargando borrador desde SQLite...');
      const borrador = await DatabaseService.loadBorrador(asignacionId);
      if (borrador) {
        console.log('? Borrador encontrado en SQLite');
        // Cargar datos guardados
        setDireccion(borrador.direccion || '');
        setMatricula(borrador.matricula || '');
        setTipoPredio(borrador.tipoPredio || 'Casa');
        setPropietario(borrador.propietario || '');
        setTelefono(borrador.telefono || '');
        setAreaTerreno(borrador.areaTerreno?.toString() || '');
        setAreaConstruida(borrador.areaConstruida?.toString() || '');
        setFrente(borrador.frente?.toString() || '');
        setFondo(borrador.fondo?.toString() || '');
        setPisos(borrador.pisos?.toString() || '1');
        setHabitaciones(borrador.habitaciones?.toString() || '');
        setBanos(borrador.banos?.toString() || '');
        setGarajes(borrador.garajes?.toString() || '');
        setEstadoConservacion(borrador.estadoConservacion || 'Bueno');
        if (borrador.servicios) {
          setAgua(borrador.servicios.agua !== false);
          setLuz(borrador.servicios.luz !== false);
          setGas(borrador.servicios.gas === true);
          setAlcantarillado(borrador.servicios.alcantarillado !== false);
          setInternet(borrador.servicios.internet === true);
        }
        setCoordenadas(borrador.coordenadas);
        setObservaciones(borrador.observaciones || '');
      } else {
        console.log('?? No hay borrador guardado');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el formulario');
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
      case 'pendiente': return '#BDBDBD';
      case 'en_progreso': return '#9E9E9E';
      case 'completado': return '#4F4F4F';
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
      Alert.alert('Campo Requerido', 'La direcci?n es obligatoria');
      return false;
    }
    if (!matricula.trim()) {
      Alert.alert('Campo Requerido', 'La matr?cula es obligatoria');
      return false;
    }
    if (!coordenadas) {
      Alert.alert('Ubicaci?n Requerida', 'Debes capturar la ubicaci?n GPS del predio');
      return false;
    }
    if (!areaTerreno || parseFloat(areaTerreno) <= 0) {
      Alert.alert('Campo Inv?lido', 'El ?rea del terreno debe ser mayor a 0');
      return false;
    }
    return true;
  };

  
  const capturarUbicacion = async () => {
    setLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Se necesita acceso a la ubicaciÃƒÂ³n');
        setLoadingGPS(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoordenadas({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });
      
      const _msg = 'Lat: ' + location.coords.latitude.toFixed(6) + '\nLng: ' + location.coords.longitude.toFixed(6) + '\nPrecisión: ' + Math.round(location.coords.accuracy) + 'm';
      Alert.alert('UbicaciÃƒÂ³n Capturada', _msg);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicaciÃƒÂ³n');
      console.error(error);
    } finally {
      setLoadingGPS(false);
    }
  };const guardarBorrador = async () => {
  try {
    const data = {
      asignacionId,
      peritoId,
      direccion,
      matricula,
      tipoPredio,
      propietario,
      telefono,
      areaTerreno: parseFloat(areaTerreno) || 0,
      areaConstruida: parseFloat(areaConstruida) || 0,
      frente: parseFloat(frente) || 0,
      fondo: parseFloat(fondo) || 0,
      pisos: parseInt(pisos) || 1,
      habitaciones: parseInt(habitaciones) || 0,
      banos: parseInt(banos) || 0,
      garajes: parseInt(garajes) || 0,
      estadoConservacion,
      servicios: { agua, luz, gas, alcantarillado, internet },
      coordenadas,
      observaciones,
    };
    const success = await DatabaseService.saveBorrador(data);
    if (success) {
      Alert.alert('Borrador guardado', 'Se guardÃƒÂ³ el borrador en el dispositivo');
    } else {
      Alert.alert('Error', 'No se pudo guardar el borrador');
    }
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
        // InformaciÃƒÂ³n General
        direccion,
        matricula,
        tipoPredio,
        propietario,
        telefono,
        // CaracterÃƒÂ­sticas FÃƒÂ­sicas
        areaTerreno: parseFloat(areaTerreno),
        areaConstruida: parseFloat(areaConstruida) || 0,
        frente: parseFloat(frente) || 0,
        fondo: parseFloat(fondo) || 0,
        pisos: parseInt(pisos) || 1,
        habitaciones: parseInt(habitaciones) || 0,
        banos: parseInt(banos) || 0,
        garajes: parseInt(garajes) || 0,
        estadoConservacion,
        // Servicios PÃƒÂºblicos
        servicios: {
          agua,
          luz,
          gas,
          alcantarillado,
          internet,
        },
        // UbicaciÃƒÂ³n
        coordenadas,
        // Observaciones
        observaciones,
        // Metadata
        fechaCreacion: new Date().toISOString(),
        estado: 'completado',
      };

      // Guardar en OneDrive/SQL vÃƒÂ­a backend
      if (!casoIdBackend) {
        throw new Error('No hay casoId disponible para subir el formulario');
      }

      const coords = coordenadas
        ? { latitud: coordenadas.latitude, longitud: coordenadas.longitude }
        : null;

      console.log('?? Subiendo formulario a OneDrive/SQL...');
      
      const resultado = await ApiService.uploadFormulario(casoIdBackend, codigoCaso, formulario, coords);
      const oneDriveUrl = resultado?.formulario?.onedriveUrl;
      const warning = resultado?.warning;
      console.log('? Formulario subido:', resultado?.formulario?.id);

      // Guardar tambiÃƒÂ©n en AsyncStorage local como respaldo
      const formularios = await AsyncStorage.getItem('formularios_campo');
      const lista = formularios ? JSON.parse(formularios) : [];
      lista.push(formulario);
      await AsyncStorage.setItem('formularios_campo', JSON.stringify(lista));

      // Eliminar borrador
      await AsyncStorage.removeItem(`formulario_${asignacionId}`);

      // Mostrar Toast no bloqueante en Android con la URL
      if (Platform.OS === 'android' && oneDriveUrl) {
        try { ToastAndroid.show(`OneDrive: ${oneDriveUrl}`, ToastAndroid.LONG); } catch {}
      }

      // Mostrar alerta con opci?n para abrir la URL en OneDrive
      const buttons = [];
      if (oneDriveUrl) {
        buttons.push({ text: 'Abrir OneDrive', onPress: () => Linking.openURL(oneDriveUrl) });
      }
      buttons.push(
        { text: 'Ver Fotos', onPress: () => navigation.navigate('PhotoManager') },
        { text: 'Volver a Inicio', onPress: () => navigation.navigate('Home') }
      );

      const message = oneDriveUrl
        ? `Guardado en OneDrive\n\n${oneDriveUrl}`
        : warning
          ? 'Guardado en base de datos. No se pudo subir a OneDrive.'
          : 'Formulario guardado en OneDrive';

      Alert.alert('Formulario Guardado', message, buttons);
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
          <Text style={styles.backText}>? AtrÃƒÂ¡s</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diligenciamiento en Campo</Text>
        <TouchableOpacity onPress={guardarBorrador} style={styles.draftButton}>
          <Text style={styles.draftText}>Guardar Borrador</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* InformaciÃƒÂ³n de la AsignaciÃƒÂ³n */}
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

        {/* InformaciÃƒÂ³n General */}
        <View style={styles.seccion}>
          <SeccionHeader icon={<Home size={20} color="#6B7280" />} titulo="InformaciÃƒÂ³n General" />

          <Campo
            label="DirecciÃƒÂ³n *"
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Ej: Calle 123 #45-67"
          />

          <Campo
            label="MatrÃƒÂ­cula Inmobiliaria *"
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
            label="TelÃƒÂ©fono de Contacto"
            value={telefono}
            onChangeText={setTelefono}
            placeholder="300 123 4567"
            keyboardType="phone-pad"
          />
        </View>

        {/* CaracterÃƒÂ­sticas FÃƒÂ­sicas */}
        <View style={styles.seccion}>
          <SeccionHeader icon={<Ruler size={20} color="#6B7280" />} titulo="CaracterÃƒÂ­sticas FÃƒÂ­sicas" />

          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Campo
                label="ÃƒÂrea Terreno (mÃ‚Â²) *"
                value={areaTerreno}
                onChangeText={setAreaTerreno}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfColumn}>
              <Campo
                label="ÃƒÂrea Construida (mÃ‚Â²)"
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
                label="BaÃƒÂ±os"
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
            label="Estado de ConservaciÃƒÂ³n"
            value={estadoConservacion}
            opciones={['Excelente', 'Bueno', 'Regular', 'Malo']}
            onSelect={setEstadoConservacion}
          />
        </View>

        {/* Servicios PÃƒÂºblicos */}
        <View style={styles.seccion}>
          <SeccionHeader icon={<Droplet size={20} color="#6B7280" />} titulo="Servicios PÃƒÂºblicos" />

          <ServicioSwitch
            label="Agua Potable"
            value={agua}
            onValueChange={setAgua}
            icon={<Droplet size={16} color="#3B82F6" />}
          />
          <ServicioSwitch
            label="EnergÃƒÂ­a ElÃƒÂ©ctrica"
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

        {/* UbicaciÃƒÂ³n GPS */}
        <View style={styles.seccion}>
          <SeccionHeader icon={<MapPin size={20} color="#6B7280" />} titulo="UbicaciÃƒÂ³n GPS" />

          {coordenadas ? (
            <View style={styles.coordenadasContainer}>
              <Text style={styles.coordenadasLabel}>UbicaciÃƒÂ³n Capturada:</Text>
              <Text style={styles.coordenadasTexto}>Latitud: {coordenadas.latitude.toFixed(6)}</Text>
              <Text style={styles.coordenadasTexto}>Longitud: {coordenadas.longitude.toFixed(6)}</Text>
              <Text style={styles.coordenadasTexto}>PrecisiÃƒÂ³n: {coordenadas.accuracy?.toFixed(0)}m</Text>
              <TouchableOpacity style={styles.recapturarButton} onPress={capturarUbicacion}>
                <Navigation size={16} color="#1D4ED8" />
                <Text style={styles.recapturarTexto}>Recapturar UbicaciÃƒÂ³n</Text>
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
                {loadingGPS ? 'Obteniendo UbicaciÃƒÂ³n...' : 'Capturar UbicaciÃƒÂ³n GPS'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Evidencias FotogrÃƒÂ¡ficas */}
        <View style={styles.seccion}>
          <SeccionHeader icon={<Camera size={20} color="#6B7280" />} titulo="Evidencias FotogrÃƒÂ¡ficas" />

          <TouchableOpacity style={styles.cameraButton} onPress={tomarFotografia}>
            <Camera size={24} color="#FFFFFF" />
            <Text style={styles.cameraButtonText}>Tomar FotografÃƒÂ­as</Text>
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

        {/* BotÃƒÂ³n Guardar */}
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
    backgroundColor: COLORS.primary,
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
    backgroundColor: '#F5F7F0',
    marginTop: 12,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
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
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
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
    color: COLORS.primary,
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






























