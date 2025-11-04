import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

const LoadingSpinner = ({ message = 'Cargando...' }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={COLORS.icon} />
    <Text style={styles.message}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  message: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});

export default LoadingSpinner;
