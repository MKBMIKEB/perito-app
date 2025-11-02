/**
 * UpdateScreen
 * Pantalla de gestión de actualizaciones
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Smartphone,
  Cloud,
  Settings,
  Info,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react-native';
import { COLORS } from '../constants';
import { UpdateService } from '../services/UpdateService';
import * as Application from 'expo-application';

const UpdateScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [versionInfo, setVersionInfo] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVersionInfo();
  }, []);

  const loadVersionInfo = async () => {
    try {
      const info = await UpdateService.getVersionInfo();
      setVersionInfo(info);
      
      if (info?.lastCheck) {
        const hasUpdate = info.lastCheck.expo?.available || 
                         info.lastCheck.firebase?.available || 
                         info.lastCheck.playStore?.available;
        setUpdateAvailable(hasUpdate);
      }
    } catch (error) {
      console.error('Error cargando info de versión:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVersionInfo();
    setRefreshing(false);
  };

  const checkForUpdates = async () => {
    setIsLoading(true);
    try {
      const result = await UpdateService.forceUpdateCheck();
      
      if (result.available) {
        setUpdateAvailable(true);
        Alert.alert(
          '🎉 Actualización Disponible',
          `Se encontró una nueva versión. ¿Deseas actualizarla ahora?`,
          [
            { text: 'Después', style: 'cancel' },
            { text: 'Actualizar', onPress: () => applyUpdate(result) }
          ]
        );
      } else {
        Alert.alert('✅ Actualizada', 'Tu aplicación está en la versión más reciente');
      }
      
      await loadVersionInfo();
    } catch (error) {
      Alert.alert('Error', 'No se pudo verificar actualizaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const applyUpdate = async (updateInfo) => {
    try {
      if (updateInfo.type === 'expo') {
        await UpdateService.downloadAndApplyExpoUpdate();
      } else if (updateInfo.type === 'firebase') {
        await UpdateService.downloadFromFirebase(updateInfo.downloadUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo aplicar la actualización');
    }
  };

  const toggleAutoUpdate = async (value) => {
    setAutoUpdateEnabled(value);
    await UpdateService.updateConfig({ autoUpdateEnabled: value });
    
    if (value) {
      UpdateService.startAutoUpdateCheck();
      Alert.alert('✅ Activado', 'Las actualizaciones automáticas están activadas');
    } else {
      Alert.alert('⏸️ Pausado', 'Las actualizaciones automáticas están pausadas');
    }
  };

  const showUpdateHistory = () => {
    if (!versionInfo?.history || versionInfo.history.length === 0) {
      Alert.alert('📋 Historial', 'No hay historial de actualizaciones disponible');
      return;
    }

    const historyText = versionInfo.history
      .slice(-5) // Últimas 5
      .map(entry => `• v${entry.version} - ${entry.date}`)
      .join('\n');

    Alert.alert('📋 Historial de Actualizaciones', historyText);
  };

  const formatLastCheckTime = (timestamp) => {
    if (!timestamp) return 'Nunca';
    
    const date = new Date(timestamp);
    return date.toLocaleString('es-CO');
  };

  const getUpdateStatusColor = () => {
    if (updateAvailable) return COLORS.warning;
    return COLORS.success;
  };

  const getUpdateStatusText = () => {
    if (updateAvailable) return 'Actualización disponible';
    return 'Actualizada';
  };

  const UpdateCard = ({ title, subtitle, status, onPress, icon: Icon }) => (
    <TouchableOpacity style={styles.updateCard} onPress={onPress}>
      <View style={styles.updateCardContent}>
        <View style={styles.updateCardLeft}>
          <View style={[styles.updateIcon, { backgroundColor: status.color + '20' }]}>
            <Icon size={24} color={status.color} />
          </View>
          <View style={styles.updateInfo}>
            <Text style={styles.updateTitle}>{title}</Text>
            <Text style={styles.updateSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <View style={styles.updateStatus}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.text}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Actualizaciones</Text>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={checkForUpdates}
          disabled={isLoading}
        >
          <RefreshCw size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Estado Actual */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Estado Actual</Text>
          
          <View style={styles.versionCard}>
            <View style={styles.versionHeader}>
              <Smartphone size={32} color={COLORS.primary} />
              <View style={styles.versionInfo}>
                <Text style={styles.appName}>Perito App</Text>
                <Text style={styles.currentVersion}>
                  v{Application.nativeApplicationVersion} ({Application.nativeBuildVersion})
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getUpdateStatusColor() }]}>
                <Text style={styles.statusBadgeText}>
                  {getUpdateStatusText()}
                </Text>
              </View>
            </View>
            
            <View style={styles.versionDetails}>
              <Text style={styles.detailText}>
                🗓️ Última verificación: {formatLastCheckTime(versionInfo?.lastCheck?.timestamp)}
              </Text>
              <Text style={styles.detailText}>
                📦 Plataforma: Android
              </Text>
              <Text style={styles.detailText}>
                🔄 Actualizaciones automáticas: {autoUpdateEnabled ? 'Activadas' : 'Pausadas'}
              </Text>
            </View>
          </View>
        </View>

        {/* Métodos de Actualización */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Métodos de Actualización</Text>
          
          <UpdateCard
            title="Expo Updates (OTA)"
            subtitle="Actualizaciones instantáneas sin reinstalar"
            status={{
              color: COLORS.success,
              text: versionInfo?.lastCheck?.expo?.available ? 'Disponible' : 'Actualizada'
            }}
            onPress={() => Alert.alert('Expo Updates', 'Actualizaciones Over-The-Air más rápidas')}
            icon={Cloud}
          />
          
          <UpdateCard
            title="Firebase App Distribution"
            subtitle="Distribución directa de nuevas versiones"
            status={{
              color: COLORS.primary,
              text: versionInfo?.lastCheck?.firebase?.available ? 'Disponible' : 'Actualizada'
            }}
            onPress={() => Alert.alert('Firebase Distribution', 'Distribución automática de APK')}
            icon={Download}
          />
          
          <UpdateCard
            title="Google Play Store"
            subtitle="Actualizaciones oficiales de la tienda"
            status={{
              color: COLORS.textSecondary,
              text: 'Próximamente'
            }}
            onPress={() => Alert.alert('Play Store', 'Disponible cuando la app esté en Play Store')}
            icon={Smartphone}
          />
        </View>

        {/* Configuración */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Configuración</Text>
          
          <View style={styles.configCard}>
            <View style={styles.configRow}>
              <View style={styles.configLeft}>
                <Text style={styles.configTitle}>Actualizaciones Automáticas</Text>
                <Text style={styles.configSubtitle}>
                  Verificar y aplicar actualizaciones automáticamente
                </Text>
              </View>
              <Switch
                value={autoUpdateEnabled}
                onValueChange={toggleAutoUpdate}
                trackColor={{ false: '#D1D5DB', true: COLORS.primary + '40' }}
                thumbColor={autoUpdateEnabled ? COLORS.primary : '#9CA3AF'}
              />
            </View>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Acciones</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={checkForUpdates}
            disabled={isLoading}
          >
            <RefreshCw size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {isLoading ? 'Verificando...' : 'Buscar Actualizaciones'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={showUpdateHistory}
          >
            <Clock size={20} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>Ver Historial</Text>
          </TouchableOpacity>
        </View>

        {/* Información */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Información</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Info size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Las actualizaciones OTA (Expo) son más rápidas y no requieren reinstalación
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Info size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Firebase App Distribution permite distribuir versiones beta
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Info size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>
                La app funciona offline durante las actualizaciones
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  versionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  versionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  currentVersion: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  versionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  updateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  updateCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  updateCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  updateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  updateInfo: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  updateSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  updateStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  configCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  configLeft: {
    flex: 1,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  configSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
});

export default UpdateScreen;