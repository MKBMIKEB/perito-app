/**
 * OneDriveConfigScreen
 * Configuración de carpetas OneDrive por perito
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import {
  ArrowLeft,
  Folder,
  User,
  Cloud,
  Settings,
  Save,
  Trash2,
  Plus,
} from 'lucide-react-native';
import { COLORS } from '../constants';
import { OneDriveService } from '../services/OneDriveService';
import { AuthService } from '../services/AuthService';

const OneDriveConfigScreen = ({ navigation }) => {
  const [peritos, setPeritos] = useState([]);
  const [newPerito, setNewPerito] = useState({ nombre: '', cedula: '', carpeta: '' });
  const [oneDriveEnabled, setOneDriveEnabled] = useState(false);
  const [storageStats, setStorageStats] = useState(null);

  useEffect(() => {
    loadPeritos();
    loadStorageStats();
  }, []);

  const loadPeritos = async () => {
    try {
      // Cargar lista de peritos configurados
      const peritosData = [
        { 
          cedula: '12345678', 
          nombre: 'Juan Pérez', 
          carpeta: '/Perito_Juan_Perez',
          activo: true,
        },
        { 
          cedula: '87654321', 
          nombre: 'María García', 
          carpeta: '/Perito_Maria_Garcia',
          activo: true,
        },
        { 
          cedula: '11223344', 
          nombre: 'Carlos Rodríguez', 
          carpeta: '/Perito_Carlos_Rodriguez',
          activo: false,
        },
      ];
      
      setPeritos(peritosData);
    } catch (error) {
      console.error('Error cargando peritos:', error);
    }
  };

  const loadStorageStats = async () => {
    try {
      const stats = await OneDriveService.getStorageStats();
      setStorageStats(stats);
      setOneDriveEnabled(stats.oneDriveConnected);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const agregarPerito = () => {
    if (!newPerito.nombre || !newPerito.cedula || !newPerito.carpeta) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    const cedulaExiste = peritos.some(p => p.cedula === newPerito.cedula);
    if (cedulaExiste) {
      Alert.alert('Error', 'Ya existe un perito con esa cédula');
      return;
    }

    const nuevoPerito = {
      ...newPerito,
      activo: true,
    };

    setPeritos([...peritos, nuevoPerito]);
    OneDriveService.setPeritoFolder(newPerito.cedula, newPerito.carpeta);
    
    setNewPerito({ nombre: '', cedula: '', carpeta: '' });
    
    Alert.alert('Éxito', 'Perito agregado correctamente');
  };

  const togglePeritoActivo = (cedula) => {
    setPeritos(peritos.map(perito => 
      perito.cedula === cedula 
        ? { ...perito, activo: !perito.activo }
        : perito
    ));
  };

  const eliminarPerito = (cedula) => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que deseas eliminar este perito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setPeritos(peritos.filter(p => p.cedula !== cedula));
            Alert.alert('Éxito', 'Perito eliminado correctamente');
          }
        }
      ]
    );
  };

  const sincronizarFotos = async () => {
    try {
      Alert.alert('Sincronizando', 'Iniciando sincronización con OneDrive...');
      await OneDriveService.syncLocalPhotos();
      await loadStorageStats();
      Alert.alert('Éxito', 'Sincronización completada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo completar la sincronización');
    }
  };

  const configurarOneDrive = async () => {
    try {
      const result = await OneDriveService.authenticateWithMicrosoft();
      
      Alert.alert(
        'Configuración OneDrive',
        result.message,
        [
          { text: 'Entendido', style: 'default' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo configurar OneDrive');
    }
  };

  const PeritoCard = ({ perito }) => (
    <View style={styles.peritoCard}>
      <View style={styles.peritoHeader}>
        <View style={styles.peritoInfo}>
          <User size={20} color={perito.activo ? COLORS.primary : COLORS.textSecondary} />
          <View style={styles.peritoDetails}>
            <Text style={[styles.peritoNombre, { color: perito.activo ? COLORS.text : COLORS.textSecondary }]}>
              {perito.nombre}
            </Text>
            <Text style={styles.peritoCedula}>CC: {perito.cedula}</Text>
          </View>
        </View>
        
        <View style={styles.peritoActions}>
          <Switch
            value={perito.activo}
            onValueChange={() => togglePeritoActivo(perito.cedula)}
            trackColor={{ false: '#D1D5DB', true: COLORS.primary + '40' }}
            thumbColor={perito.activo ? COLORS.primary : '#9CA3AF'}
          />
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => eliminarPerito(perito.cedula)}
          >
            <Trash2 size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.carpetaInfo}>
        <Folder size={16} color={COLORS.textSecondary} />
        <Text style={styles.carpetaText}>{perito.carpeta}</Text>
      </View>
    </View>
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
        
        <Text style={styles.headerTitle}>Microsoft OneDrive</Text>
        
        <TouchableOpacity style={styles.headerButton}>
          <Settings size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Estado de OneDrive */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 Microsoft OneDrive</Text>
          
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Cloud size={24} color={oneDriveEnabled ? COLORS.success : COLORS.error} />
              <Text style={[styles.statusText, { color: oneDriveEnabled ? COLORS.success : COLORS.error }]}>
                {oneDriveEnabled ? 'OneDrive Conectado' : 'OneDrive Desconectado'}
              </Text>
            </View>
            
            {storageStats && (
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  📱 Fotos locales: {storageStats.localPhotos}
                </Text>
                <Text style={styles.statsText}>
                  💾 Tamaño: {storageStats.localSizeMB} MB
                </Text>
              </View>
            )}
            
            <View style={styles.statusActions}>
              <TouchableOpacity 
                style={styles.configButton}
                onPress={configurarOneDrive}
              >
                <Text style={styles.configButtonText}>
                  {oneDriveEnabled ? 'Reconfigurar' : 'Conectar Microsoft OneDrive'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.syncButton}
                onPress={sincronizarFotos}
              >
                <Text style={styles.syncButtonText}>Sincronizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Lista de Peritos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Peritos Configurados</Text>
          
          {peritos.map((perito) => (
            <PeritoCard key={perito.cedula} perito={perito} />
          ))}
        </View>

        {/* Agregar Nuevo Perito */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>➕ Agregar Nuevo Perito</Text>
          
          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={newPerito.nombre}
              onChangeText={(text) => setNewPerito({...newPerito, nombre: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Cédula"
              value={newPerito.cedula}
              onChangeText={(text) => setNewPerito({...newPerito, cedula: text})}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Ruta OneDrive (ej: /Perito_Nombre)"
              value={newPerito.carpeta}
              onChangeText={(text) => setNewPerito({...newPerito, carpeta: text})}
            />
            
            <TouchableOpacity style={styles.addButton} onPress={agregarPerito}>
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Agregar Perito</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Información de Ayuda */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Información</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              • Cada perito tiene una carpeta única en Microsoft OneDrive
            </Text>
            <Text style={styles.infoText}>
              • Las fotos se guardan localmente si Microsoft OneDrive no está disponible
            </Text>
            <Text style={styles.infoText}>
              • La sincronización se ejecuta automáticamente al conectarse
            </Text>
            <Text style={styles.infoText}>
              • Los metadatos incluyen GPS, fecha, hora y datos del perito
            </Text>
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
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    marginBottom: 16,
    gap: 4,
  },
  statsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 12,
  },
  configButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  configButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  syncButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  peritoCard: {
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
  peritoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  peritoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  peritoDetails: {
    flex: 1,
  },
  peritoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  peritoCedula: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  peritoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 8,
  },
  carpetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  carpetaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
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
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default OneDriveConfigScreen;