/**
 * Firebase Configuration
 * Perito App - Configuración de Firebase
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyA6sFJ3I2-pYLPdGPCBldotnBSoaENWbWA",
  authDomain: "savia-424d0.firebaseapp.com",
  projectId: "savia-424d0",
  storageBucket: "savia-424d0.firebasestorage.app",
  messagingSenderId: "273873873725",
  appId: "1:273873873725:android:32d55788c3cc7293733354"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const storage = getStorage(app);

export default app;