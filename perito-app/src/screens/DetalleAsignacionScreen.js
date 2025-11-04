/**
 * DetalleAsignacionScreen - Detalle de Caso Asignado
 * Perito App - Observatorio Inmobiliario
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ApiService from '../services/ApiService';

const DetalleAsignacionScreen = ({ route, navigation }) => {
  const { casoId, caso: casoInicial } = route.params;
  const [caso, setCaso] = useState(casoInicial || null);
  const [loading, setLoading] = useState(!casoInicial);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    if (!casoInicial) {
      cargarDetalleCaso();
    }
  }, [casoId]);

  /**
   * Cargar detalle del caso desde el backend
   */
  const cargarDetalleCaso = async () => {
    try {
      setLoading(true);
      const detalles = await ApiService.getCaso(casoId);
      setCaso(detalles);
      console.log('📋 Caso cargado:', detalles.codigo);
    } catch (error) {
      console.error('❌ Error cargando caso:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle del caso');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar estado del caso
   */
  const actualizarEstado = async (nuevoEstado) => {
    try {
      setActualizando(true);

      await ApiService.updateCaso(casoId, { estado: nuevoEstado });

      // Actualizar estado local
      setCaso({ ...caso, estado: nuevoEstado });

      Alert.alert('Éxito', `Estado actualizado a "${getEstadoLabel(nuevoEstado)}"`);
      console.log(`✅ Estado actualizado: ${nuevoEstado}`);
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del caso');
    } finally {
      setActualizando(false);
    }
  };

  /**
   * Navegar a cámara para tomar fotos
   */
  const handleTomarFoto = () => {
    navigation.navigate('Camera', { codigoCaso: caso.codigo, casoId: caso.id });
  };

  /**
   * Navegar a formulario
   */
  const handleAbrirFormulario = () => {
    navigation.navigate('Formulario', { caso });
  };

  /**
   * Ver archivos del caso
   */
  const handleVerArchivos = async () => {
    try {
      const archivos = await ApiService.listCasoFiles(caso.codigo);
      console.log('📁 Archivos del caso:', archivos.length);

      if (archivos.length === 0) {
        Alert.alert('Sin archivos', 'Este caso no tiene archivos aún');
      } else {
        // TODO: Navegar a pantalla de archivos
        Alert.alert('Archivos', `Este caso tiene ${archivos.length} archivo(s)`);
      }
    } catch (error) {
      console.error('❌ Error listando archivos:', error);
      Alert.alert('Error', 'No se pudieron cargar los archivos');
    }
  };

  /**
   * Obtener etiqueta del estado
   */
  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En Proceso';
      case 'completado':
        return 'Completado';
      default:
        return estado;
    }
  };

  /**
   * Obtener color según estado
   */
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return '#BDBDBD';
      case 'en_proceso':
        return '#9E9E9E';
      case 'completado':
        return '#4F4F4F';
      default:
        return '#6B7280';
    }
  };

  /**
   * Obtener icono según tipo de inmueble
   */
  const getTipoInmuebleIcon = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'casa':
        return '🏠';
      case 'apartamento':
        return '🏢';
      case 'lote':
        return '🏞️';
      case 'local':
        return '🏪';
      default:
        return '🏘️';
    }
  };

  /**
   * Pantalla de carga
   */
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6B7280" />
        <Text style={styles.loadingText}>Cargando detalle del caso...</Text>
      </View>
    );
  }

  if (!caso) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No se encontró el caso</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header del Caso */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.iconoGrande}>{getTipoInmuebleIcon(caso.tipoInmueble)}</Text>
            <View style={styles.headerInfo}>
              <Text style={styles.codigo}>{caso.codigo}</Text>
              <Text style={styles.tipoInmueble}>{caso.tipoInmueble || 'N/A'}</Text>
            </View>
          </View>

          <View style={[styles.estadoBadgeLarge, { backgroundColor: getEstadoColor(caso.estado) }]}>
            <Text style={styles.estadoTextLarge}>{getEstadoLabel(caso.estado)}</Text>
          </View>
        </View>

        {/* Información del Inmueble */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Ubicación</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Dirección" value={caso.direccion} />
            <InfoRow label="Ciudad" value={caso.ciudad || 'N/A'} />
            <InfoRow label="Barrio" value={caso.barrio || 'N/A'} />
          </View>
        </View>

        {/* Información de Gestión */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Información de Gestión</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Prioridad" value={caso.prioridad || 'media'} capitalize />
            {caso.peritoNombre && (
              <InfoRow label="Perito Asignado" value={caso.peritoNombre} />
            )}
            {caso.fechaAsignacion && (
              <InfoRow
                label="Fecha Asignación"
                value={new Date(caso.fechaAsignacion).toLocaleDateString()}
              />
            )}
            {caso.fechaCreacion && (
              <InfoRow
                label="Fecha Creación"
                value={new Date(caso.fechaCreacion).toLocaleDateString()}
              />
            )}
          </View>
        </View>

        {/* Observaciones */}
        {caso.observaciones && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Observaciones</Text>
            <View style={styles.infoCard}>
              <Text style={styles.observaciones}>{caso.observaciones}</Text>
            </View>
          </View>
        )}

        {/* Archivos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📁 Archivos</Text>
          <TouchableOpacity style={styles.actionCard} onPress={handleVerArchivos}>
            <Text style={styles.actionCardText}>Ver Archivos en OneDrive</Text>
            <Text style={styles.actionCardIcon}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Acciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>

          <TouchableOpacity style={styles.primaryActionButton} onPress={handleTomarFoto}>
            <Text style={styles.primaryActionIcon}>📷</Text>
            <Text style={styles.primaryActionText}>Tomar Fotos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryActionButton} onPress={handleAbrirFormulario}>
            <Text style={styles.secondaryActionIcon}>📋</Text>
            <Text style={styles.secondaryActionText}>Completar Formulario</Text>
          </TouchableOpacity>
        </View>

        {/* Actualizar Estado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Actualizar Estado</Text>

          {caso.estado === 'pendiente' && (
            <TouchableOpacity
              style={[styles.estadoButton, { backgroundColor: '#3B82F6' }]}
              onPress={() => actualizarEstado('en_proceso')}
              disabled={actualizando}
            >
              <Text style={styles.estadoButtonText}>
                {actualizando ? 'Actualizando...' : 'Marcar como En Proceso'}
              </Text>
            </TouchableOpacity>
          )}

          {caso.estado === 'en_proceso' && (
            <>
              <TouchableOpacity
                style={[styles.estadoButton, { backgroundColor: '#10B981' }]}
                onPress={() => actualizarEstado('completado')}
                disabled={actualizando}
              >
                <Text style={styles.estadoButtonText}>
                  {actualizando ? 'Actualizando...' : 'Marcar como Completado'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.estadoButton, { backgroundColor: '#F59E0B', marginTop: 8 }]}
                onPress={() => actualizarEstado('pendiente')}
                disabled={actualizando}
              >
                <Text style={styles.estadoButtonText}>Volver a Pendiente</Text>
              </TouchableOpacity>
            </>
          )}

          {caso.estado === 'completado' && (
            <View style={styles.completadoCard}>
              <Text style={styles.completadoIcon}>✅</Text>
              <Text style={styles.completadoText}>Caso Completado</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * Componente auxiliar para mostrar información
 */
const InfoRow = ({ label, value, capitalize = false }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={[styles.infoValue, capitalize && { textTransform: 'capitalize' }]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#111111',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconoGrande: {
    fontSize: 48,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  codigo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  tipoInmueble: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  estadoBadgeLarge: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  estadoTextLarge: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  observaciones: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionCardText: {
    fontSize: 15,
    color: '#111111',
    fontWeight: '600',
  },
  actionCardIcon: {
    fontSize: 18,
    color: '#111111',
  },
  primaryActionButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryActionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#111111',
  },
  secondaryActionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  secondaryActionText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: 'bold',
  },
  estadoButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  estadoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completadoCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  completadoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  completadoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
});

export default DetalleAsignacionScreen;
