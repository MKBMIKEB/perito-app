import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

const LoadingSpinner = ({ message = 'Cargando...' }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#1D4ED8" />
    <Text style={styles.message}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  message: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 16,
  },
});

export default LoadingSpinner;