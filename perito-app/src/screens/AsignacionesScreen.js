/**
 * AsignacionesScreen - Lista de Casos Asignados
 * Perito App - Observatorio Inmobiliario
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import ApiService from '../services/ApiService';
import { COLORS } from '../constants';

const AsignacionesScreen = ({ navigation }) => {
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todos'); // 'todos', 'pendiente', 'en_proceso', 'completado'

  useEffect(() => {
    cargarCasos();
  }, [filtro]);

  /**
   * Cargar casos desde el backend
   */
  const cargarCasos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener usuario actual (usaremos su id como coordinadorId para filtrar)
      const userData = await ApiService.getMe();
      console.log('👤 Usuario:', userData.displayName);

      // Obtener casos asignados al perito actual
      const filtros = {};
      if (filtro !== 'todos') {
        filtros.estado = filtro;
      }

      // MVP: mostrar solo casos creados por el coordinador actual
      const filtrosConCoordinador = { ...filtros, coordinadorId: userData?.id };
      const misCasos = await ApiService.getCasos(filtrosConCoordinador);
      console.log(`📋 Casos cargados: ${misCasos.length}`);

      setCasos(misCasos);
    } catch (err) {
      console.error('❌ Error cargando casos:', err);
      setError('No se pudieron cargar las asignaciones');
      Alert.alert('Error', 'No se pudieron cargar las asignaciones');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh pull-to-refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarCasos();
    setRefreshing(false);
  };

  /**
   * Navegar al detalle del caso
   */
  const handleCasoPress = (caso) => {
    navigation.navigate('DetalleAsignacion', { casoId: caso.id, caso });
  };

  /**
   * Obtener color según estado
   */
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return '#BDBDBD'; // Gris claro
      case 'en_proceso':
        return '#9E9E9E'; // Gris medio
      case 'completado':
        return '#4F4F4F'; // Gris oscuro
      default:
        return COLORS.icon; // Gris
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
   * Renderizar item de caso
   */
  const renderCaso = ({ item }) => (
    <TouchableOpacity
      style={styles.casoCard}
      onPress={() => handleCasoPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.casoHeader}>
        <View style={styles.casoHeaderLeft}>
          <Text style={styles.casoIcon}>{getTipoInmuebleIcon(item.tipoInmueble)}</Text>
          <View>
            <Text style={styles.casoCodigo}>{item.codigo}</Text>
            <Text style={styles.casoTipo}>{item.tipoInmueble || 'N/A'}</Text>
          </View>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
          <Text style={styles.estadoText}>{getEstadoLabel(item.estado)}</Text>
        </View>
      </View>

      <View style={styles.casoBody}>
        <Text style={styles.casoDireccion} numberOfLines={2}>
          📍 {item.direccion}
        </Text>
        {item.ciudad && (
          <Text style={styles.casoUbicacion}>
            {item.ciudad}{item.barrio ? `, ${item.barrio}` : ''}
          </Text>
        )}
      </View>

      <View style={styles.casoFooter}>
        {item.prioridad && (
          <View style={styles.prioridadContainer}>
            <Text style={styles.prioridadText}>
              {item.prioridad === 'alta' ? '🔴' : item.prioridad === 'media' ? '🟡' : '🟢'} {item.prioridad}
            </Text>
          </View>
        )}
        {item.fechaAsignacion && (
          <Text style={styles.fechaText}>
            Asignado: {new Date(item.fechaAsignacion).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  /**
   * Pantalla de carga
   */
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.icon} />
        <Text style={styles.loadingText}>Cargando asignaciones...</Text>
      </View>
    );
  }

  /**
   * Pantalla de error
   */
  if (error && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={cargarCasos}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <TouchableOpacity
          style={[styles.filtroButton, filtro === 'todos' && styles.filtroButtonActive]}
          onPress={() => setFiltro('todos')}
        >
          <Text style={[styles.filtroText, filtro === 'todos' && styles.filtroTextActive]}>
            Todos ({casos.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filtroButton, filtro === 'pendiente' && styles.filtroButtonActive]}
          onPress={() => setFiltro('pendiente')}
        >
          <Text style={[styles.filtroText, filtro === 'pendiente' && styles.filtroTextActive]}>
            Pendientes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filtroButton, filtro === 'en_proceso' && styles.filtroButtonActive]}
          onPress={() => setFiltro('en_proceso')}
        >
          <Text style={[styles.filtroText, filtro === 'en_proceso' && styles.filtroTextActive]}>
            En Proceso
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de casos */}
      {casos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No hay casos asignados</Text>
          <Text style={styles.emptySubtext}>
            {filtro === 'todos'
              ? 'No tienes casos asignados actualmente'
              : `No hay casos con estado "${getEstadoLabel(filtro)}"`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={casos}
          keyExtractor={(item) => (item.codigo ? String(item.codigo) : String(item.id))}
          renderItem={renderCaso}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.icon]}
              tintColor={COLORS.icon}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filtrosContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filtroButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filtroButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filtroText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filtroTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  casoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  casoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  casoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  casoIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  casoCodigo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  casoTipo: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  casoBody: {
    marginBottom: 12,
  },
  casoDireccion: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  casoUbicacion: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  casoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  prioridadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prioridadText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  fechaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default AsignacionesScreen;
