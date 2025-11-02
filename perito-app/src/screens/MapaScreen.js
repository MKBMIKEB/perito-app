/**
 * MapaScreen
 * Perito App - Observatorio Inmobiliario
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const MapaScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MapaScreen</Text>
      <Text style={styles.subtitle}>Pantalla en desarrollo...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D4ED8',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default MapaScreen;