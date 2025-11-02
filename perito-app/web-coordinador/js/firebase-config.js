/**
 * Firebase Configuration - Panel Web Coordinador
 * Configuración de Firebase Firestore para sincronización en tiempo real
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    onSnapshot,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuración de Firebase (tomada de tu proyecto existente)
const firebaseConfig = {
    apiKey: "AIzaSyA6sFJ3I2-pYLPdGPCBldotnBSoaENWbWA",
    authDomain: "savia-424d0.firebaseapp.com",
    projectId: "savia-424d0",
    storageBucket: "savia-424d0.firebasestorage.app",
    messagingSenderId: "273873873725",
    appId: "1:273873873725:android:32d55788c3cc7293733354"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('✅ Firebase inicializado correctamente');
console.log('📱 Sincronización en tiempo real activa');

// Exportar para uso en app.js
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseUtils = {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    onSnapshot,
    orderBy,
    serverTimestamp,
    signInWithEmailAndPassword
};
