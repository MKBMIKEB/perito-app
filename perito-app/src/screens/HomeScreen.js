/**
 * HomeScreen
 * Perito App - Observatorio Inmobiliario
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  MapPin,
  Camera,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  Phone,
  Navigation
} from 'lucide-react-native';
import { AuthService } from '../services/AuthService';
import { DatabaseService } from '../services/DatabaseService-native';
import CasosService from '../services/CasosService';

const HomeScreen = ({ navigation }) => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [peritoInfo, setPeritoInfo] = useState({
    nombre: 'Cargando...',
    especialidad: 'Especialista Urbano',
    cedula: '12345678',
    telefono: '+57 300 123 4567'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPeritoInfo();
    loadCasosFromFirebase();

    // Actualización de tiempo
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);

    return () => {
      clearInterval(interval);
      CasosService.stopListeners();
    };
  }, []);

  const loadCasosFromFirebase = async () => {
    try {
      const perito = await AuthService.getStoredPerito();

      if (perito && perito.peritoId) {
        console.log('📋 Cargando casos para perito:', perito.peritoId);

        // Escuchar cambios en tiempo real
        CasosService.listenToCasosAsignados(
          perito.peritoId,
          (casosActualizados) => {
            console.log(`🔄 ${casosActualizados.length} casos recibidos de Firebase`);

            // Mapear datos de Firebase al formato de la app
            const casosFormateados = casosActualizados.map(caso => ({
              id: caso.codigo || caso.id,
              direccion: caso.direccion,
              municipio: caso.municipio,
              tipo: caso.tipo,
              estado: caso.estado === 'asignado' ? 'pendiente' : caso.estado,
              fechaLimite: caso.fechaLimite,
              prioridad: caso.prioridad || 'normal',
              coordenadas: caso.coordenadas || { lat: 0, lng: 0 }
            }));

            setAsignaciones(casosFormateados);
            setLoading(false);
          }
        );
      } else {
        console.log('⚠️ No hay peritoId disponible');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error cargando casos:', error);
      setLoading(false);
    }
  };

  const loadPeritoInfo = async () => {
    try {
      const storedPerito = await AuthService.getStoredPerito();
      if (storedPerito) {
        setPeritoInfo({
          nombre: storedPerito.nombre || 'Perito Demo',
          especialidad: 'Especialista Urbano',
          cedula: storedPerito.cedula || '12345678',
          telefono: '+57 300 123 4567'
        });
      }
    } catch (error) {
      console.log('Error cargando info del perito:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Sincronización', '✅ Datos sincronizados correctamente');
    }, 2000);
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

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'alta': return '#DC2626';
      case 'normal': return '#059669';
      case 'baja': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const iniciarTrabajo = async (asignacion) => {
    Alert.alert(
      'Iniciar Trabajo',
      `¿Deseas iniciar el trabajo en ${asignacion.direccion}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: async () => {
            try {
              // Buscar el caso real en Firebase por código
              const casoReal = asignaciones.find(a => a.id === asignacion.id);
              if (casoReal) {
                // Actualizar estado en Firebase
                const exito = await CasosService.actualizarEstadoCaso(casoReal.id, 'en_progreso');

                if (exito) {
                  // La actualización local se hará automáticamente por el listener
                  Alert.alert('Trabajo Iniciado', '✅ GPS activado. Dirígete al predio.');
                } else {
                  Alert.alert('Error', 'No se pudo actualizar el estado del caso');
                }
              }
            } catch (error) {
              console.error('Error iniciando trabajo:', error);
              Alert.alert('Error', 'No se pudo iniciar el trabajo');
            }
          }
        }
      ]
    );
  };

  const verDetalles = (asignacion) => {
    // Abrir directamente el formulario de diligenciamiento
    navigation.navigate('FormularioCampo', {
      asignacionId: asignacion.id,
      peritoId: peritoInfo.cedula,
      asignacionData: asignacion
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            // La app se recargará automáticamente y mostrará LoginScreen
          }
        }
      ]
    );
  };

  const AsignacionCard = ({ asignacion }) => (
    <TouchableOpacity 
      style={styles.asignacionCard}
      onPress={() => verDetalles(asignacion)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.asignacionId}>{asignacion.id}</Text>
          <View style={[styles.prioridadBadge, { backgroundColor: getPrioridadColor(asignacion.prioridad) }]}>
            <Text style={styles.prioridadText}>{asignacion.prioridad.toUpperCase()}</Text>
          </View>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(asignacion.estado) }]}>
          <Text style={styles.estadoText}>{getEstadoTexto(asignacion.estado)}</Text>
        </View>
      </View>

      <Text style={styles.asignacionDireccion}>{asignacion.direccion}</Text>
      <Text style={styles.asignacionMunicipio}>{asignacion.municipio}</Text>
      <Text style={styles.asignacionTipo}>{asignacion.tipo}</Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.fechaContainer}>
          <Clock size={14} color="#6B7280" />
          <Text style={styles.fechaText}>Límite: {asignacion.fechaLimite}</Text>
        </View>
        
        {asignacion.estado === 'pendiente' && (
          <TouchableOpacity 
            style={styles.iniciarButton}
            onPress={(e) => {
              e.stopPropagation();
              iniciarTrabajo(asignacion);
            }}
          >
            <Text style={styles.iniciarButtonText}>Iniciar</Text>
          </TouchableOpacity>
        )}
        
        {asignacion.estado === 'en_progreso' && (
          <TouchableOpacity
            style={styles.continuarButton}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('FormularioCampo', {
                asignacionId: asignacion.id,
                peritoId: peritoInfo.cedula
              });
            }}
          >
            <Camera size={14} color="#FFFFFF" />
            <Text style={styles.continuarButtonText}>Diligenciar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const MetricaCard = ({ icon, titulo, valor, color }) => (
    <View style={[styles.metricaCard, { borderLeftColor: color }]}>
      <View style={[styles.metricaIcon, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={styles.metricaContent}>
        <Text style={styles.metricaLabel}>{titulo}</Text>
        <Text style={[styles.metricaValor, { color }]}>{valor}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.peritoInfo}>
            <View style={styles.avatarContainer}>
              <User size={24} color="#FFFFFF" />
            </View>
            <View style={styles.peritoDetails}>
              <Text style={styles.peritoNombre}>{peritoInfo.nombre}</Text>
              <Text style={styles.peritoEspecialidad}>{peritoInfo.especialidad}</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <View style={styles.connectivityIndicator}>
              {isOnline ? 
                <Wifi size={20} color="#10B981" /> : 
                <WifiOff size={20} color="#EF4444" />
              }
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => Alert.alert('Configuración', 'Funcionalidad en desarrollo')}
            >
              <Settings size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {currentTime.toLocaleDateString('es-CO')} - {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Métricas Rápidas */}
        <View style={styles.section}>
          <View style={styles.metricasGrid}>
            <MetricaCard 
              icon={<AlertCircle size={20} color="#EF4444" />}
              titulo="Pendientes"
              valor={asignaciones.filter(a => a.estado === 'pendiente').length}
              color="#EF4444"
            />
            <MetricaCard 
              icon={<Clock size={20} color="#F59E0B" />}
              titulo="En Progreso"
              valor={asignaciones.filter(a => a.estado === 'en_progreso').length}
              color="#F59E0B"
            />
            <MetricaCard 
              icon={<CheckCircle size={20} color="#10B981" />}
              titulo="Completados"
              valor={asignaciones.filter(a => a.estado === 'completado').length}
              color="#10B981"
            />
          </View>
        </View>

        {/* Botón de Sincronización */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.syncButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <View style={styles.spinner} />
                <Text style={styles.syncButtonText}>Sincronizando...</Text>
              </>
            ) : (
              <>
                <Wifi size={20} color="#FFFFFF" />
                <Text style={styles.syncButtonText}>Sincronizar Datos</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Lista de Asignaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Mis Asignaciones</Text>
          {asignaciones.map((asignacion) => (
            <AsignacionCard key={asignacion.id} asignacion={asignacion} />
          ))}
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>

          <View style={styles.accionesGrid}>
            <TouchableOpacity style={styles.accionButton}>
              <MapPin size={32} color="#1D4ED8" />
              <Text style={styles.accionLabel}>Ver Mapa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accionButton}
              onPress={() => navigation.navigate('Camera', {
                asignacionId: null,
                peritoId: peritoInfo.cedula
              })}
            >
              <Camera size={32} color="#10B981" />
              <Text style={styles.accionLabel}>Tomar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accionButton}
              onPress={() => navigation.navigate('PhotoManager')}
            >
              <CheckCircle size={32} color="#8B5CF6" />
              <Text style={styles.accionLabel}>Mis Fotos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.accionButton}>
              <Phone size={32} color="#F97316" />
              <Text style={styles.accionLabel}>Contactar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Estado de Conexión */}
        <View style={[styles.connectionStatus, { backgroundColor: isOnline ? '#DCFCE7' : '#FEE2E2' }]}>
          <View style={styles.connectionContent}>
            {isOnline ? <Wifi size={16} color="#10B981" /> : <WifiOff size={16} color="#EF4444" />}
            <Text style={[styles.connectionText, { color: isOnline ? '#15803D' : '#DC2626' }]}>
              {isOnline ? 'Conectado - Datos en tiempo real' : 'Sin conexión - Modo offline'}
            </Text>
          </View>
        </View>

        {/* Información del Perito */}
        <View style={styles.section}>
          <View style={styles.peritoCard}>
            <Text style={styles.peritoCardTitle}>👤 Mi Información</Text>
            <View style={styles.peritoCardContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nombre:</Text>
                <Text style={styles.infoValue}>{peritoInfo.nombre}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cédula:</Text>
                <Text style={styles.infoValue}>{peritoInfo.cedula}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono:</Text>
                <Text style={styles.infoValue}>{peritoInfo.telefono}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Especialidad:</Text>
                <Text style={styles.infoValue}>{peritoInfo.especialidad}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={16} color="#FFFFFF" />
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1D4ED8',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  peritoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#1E40AF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  peritoDetails: {
    flex: 1,
  },
  peritoNombre: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  peritoEspecialidad: {
    color: '#BFDBFE',
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectivityIndicator: {
    padding: 4,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
  },
  timeContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  timeText: {
    color: '#BFDBFE',
    fontSize: 14,
  },
  content: {
    marginTop: -8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  metricasGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricaCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  metricaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricaContent: {
    alignItems: 'center',
  },
  metricaLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  metricaValor: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  syncButton: {
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spinner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderTopColor: 'transparent',
    borderRadius: 10,
  },
  asignacionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  asignacionId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  prioridadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  prioridadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
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
  asignacionDireccion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  asignacionMunicipio: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  asignacionTipo: {
    fontSize: 14,
    color: '#1D4ED8',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fechaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fechaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  iniciarButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  iniciarButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  continuarButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  continuarButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  accionesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  accionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  accionLabel: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  connectionStatus: {
    margin: 20,
    padding: 12,
    borderRadius: 8,
  },
  connectionContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  peritoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  peritoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  peritoCardContent: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;