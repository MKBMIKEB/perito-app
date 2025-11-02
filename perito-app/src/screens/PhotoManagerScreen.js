/**
 * PhotoManagerScreen
 * Gestión de fotos locales y sincronización con OneDrive
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
  Image,
} from 'react-native';
import {
  Camera,
  Upload,
  CheckCircle,
  Clock,
  Trash2,
  MapPin,
  RefreshCw,
  Folder,
  HardDrive,
} from 'lucide-react-native';
import { OneDriveService } from '../services/OneDriveService';
import { WatermarkService } from '../services/WatermarkService';
import * as FileSystem from 'expo-file-system';

const PhotoManagerScreen = ({ navigation }) => {
  const [syncQueue, setSyncQueue] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const queue = await OneDriveService.getSyncQueue();
      const stats = await OneDriveService.getStorageStats();

      setSyncQueue(queue);
      setStorageStats(stats);

      console.log(`📊 ${queue.length} fotos pendientes, ${stats.localPhotos} fotos locales`);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSyncAll = async () => {
    if (syncQueue.length === 0) {
      Alert.alert('Sincronización', 'No hay fotos pendientes de sincronización');
      return;
    }

    Alert.alert(
      'Sincronizar Fotos',
      `¿Deseas sincronizar ${syncQueue.length} foto(s) con OneDrive?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sincronizar',
          onPress: async () => {
            setSyncing(true);
            try {
              const result = await OneDriveService.syncPendingPhotos();

              Alert.alert(
                'Sincronización Completada',
                `✅ ${result.synced} sincronizadas\n❌ ${result.failed} fallidas\n⏳ ${result.remaining} pendientes`,
                [{ text: 'OK', onPress: () => loadData() }]
              );
            } catch (error) {
              Alert.alert('Error', 'No se pudo completar la sincronización');
            } finally {
              setSyncing(false);
            }
          },
        },
      ]
    );
  };

  const handleDeletePhoto = (item) => {
    Alert.alert(
      'Eliminar Foto',
      '¿Estás seguro de eliminar esta foto? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Eliminar archivo local
              await FileSystem.deleteAsync(item.localPath, { idempotent: true });

              // Eliminar metadatos
              const metadataPath = item.localPath.replace(/\.(jpg|jpeg)$/i, '_metadata.json');
              await FileSystem.deleteAsync(metadataPath, { idempotent: true });

              Alert.alert('Éxito', 'Foto eliminada');
              loadData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la foto');
            }
          },
        },
      ]
    );
  };

  const PhotoCard = ({ item, index }) => {
    const watermark = item.metadata?.watermark || {};

    return (
      <View style={styles.photoCard}>
        <View style={styles.photoHeader}>
          <View style={styles.photoHeaderLeft}>
            <Camera size={20} color="#1D4ED8" />
            <Text style={styles.photoTitle}>Foto #{index + 1}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Clock size={14} color="#F59E0B" />
            <Text style={styles.statusText}>Pendiente</Text>
          </View>
        </View>

        <View style={styles.photoInfo}>
          <View style={styles.infoRow}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.infoText}>
              {watermark.raw?.gps?.latitude || 'N/A'}, {watermark.raw?.gps?.longitude || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha:</Text>
            <Text style={styles.infoValue}>{watermark.raw?.fecha || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hora:</Text>
            <Text style={styles.infoValue}>{watermark.raw?.hora || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Perito:</Text>
            <Text style={styles.infoValue}>{watermark.raw?.perito || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Caso:</Text>
            <Text style={styles.infoValue}>{watermark.raw?.caso || 'General'}</Text>
          </View>
        </View>

        <View style={styles.photoActions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePhoto(item)}
          >
            <Trash2 size={16} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Fotos</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <HardDrive size={24} color="#1D4ED8" />
            <Text style={styles.statValue}>{storageStats?.localPhotos || 0}</Text>
            <Text style={styles.statLabel}>Fotos Locales</Text>
          </View>

          <View style={styles.statCard}>
            <Clock size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{syncQueue.length}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>

          <View style={styles.statCard}>
            <Folder size={24} color="#10B981" />
            <Text style={styles.statValue}>{storageStats?.localSizeMB || 0} MB</Text>
            <Text style={styles.statLabel}>Almacenamiento</Text>
          </View>
        </View>

        {/* Botón de Sincronización */}
        {syncQueue.length > 0 && (
          <TouchableOpacity
            style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
            onPress={handleSyncAll}
            disabled={syncing}
          >
            {syncing ? (
              <>
                <RefreshCw size={20} color="#FFFFFF" />
                <Text style={styles.syncButtonText}>Sincronizando...</Text>
              </>
            ) : (
              <>
                <Upload size={20} color="#FFFFFF" />
                <Text style={styles.syncButtonText}>
                  Sincronizar {syncQueue.length} foto(s)
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Lista de Fotos Pendientes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📤 Fotos Pendientes de Sincronización
          </Text>

          {syncQueue.length === 0 ? (
            <View style={styles.emptyState}>
              <CheckCircle size={48} color="#10B981" />
              <Text style={styles.emptyStateText}>
                ¡Todas las fotos están sincronizadas!
              </Text>
            </View>
          ) : (
            syncQueue.map((item, index) => (
              <PhotoCard key={index} item={item} index={index} />
            ))
          )}
        </View>

        {/* Botón para tomar nueva foto */}
        <TouchableOpacity
          style={styles.newPhotoButton}
          onPress={() => navigation.navigate('Camera', { asignacionId: null })}
        >
          <Camera size={24} color="#FFFFFF" />
          <Text style={styles.newPhotoButtonText}>Tomar Nueva Foto</Text>
        </TouchableOpacity>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  syncButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
  photoCard: {
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
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  photoActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  newPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  newPhotoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PhotoManagerScreen;
