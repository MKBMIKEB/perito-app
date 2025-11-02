/**
 * CasosService
 * Servicio para sincronizar casos entre el panel web y la app móvil
 */

import { db } from '../config/firebaseConfig';
import {
    collection,
    query,
    where,
    onSnapshot,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

class CasosService {
    constructor() {
        this.casosListener = null;
    }

    /**
     * Obtener casos asignados a un perito
     * @param {string} peritoId - ID del perito
     * @returns {Promise<Array>} - Lista de casos
     */
    async getCasosAsignados(peritoId) {
        try {
            const casosRef = collection(db, 'casos');
            const q = query(casosRef, where('peritoId', '==', peritoId));
            const querySnapshot = await getDocs(q);

            const casos = [];
            querySnapshot.forEach((doc) => {
                casos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Guardar en caché local
            await AsyncStorage.setItem(`casos_${peritoId}`, JSON.stringify(casos));

            console.log(`📋 ${casos.length} casos cargados para perito ${peritoId}`);
            return casos;
        } catch (error) {
            console.error('Error obteniendo casos:', error);

            // Intentar cargar desde caché
            try {
                const cachedCasos = await AsyncStorage.getItem(`casos_${peritoId}`);
                if (cachedCasos) {
                    console.log('📦 Cargando casos desde caché local');
                    return JSON.parse(cachedCasos);
                }
            } catch (cacheError) {
                console.error('Error cargando caché:', cacheError);
            }

            return [];
        }
    }

    /**
     * Escuchar cambios en tiempo real de casos asignados
     * @param {string} peritoId - ID del perito
     * @param {Function} callback - Función a ejecutar cuando cambien los casos
     * @returns {Function} - Función para detener el listener
     */
    listenToCasosAsignados(peritoId, callback) {
        try {
            const casosRef = collection(db, 'casos');
            const q = query(casosRef, where('peritoId', '==', peritoId));

            this.casosListener = onSnapshot(q, (querySnapshot) => {
                const casos = [];
                querySnapshot.forEach((doc) => {
                    casos.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                console.log(`🔄 Casos actualizados en tiempo real: ${casos.length}`);

                // Guardar en caché
                AsyncStorage.setItem(`casos_${peritoId}`, JSON.stringify(casos));

                // Ejecutar callback
                callback(casos);
            }, (error) => {
                console.error('Error en listener de casos:', error);
            });

            return () => {
                if (this.casosListener) {
                    this.casosListener();
                }
            };
        } catch (error) {
            console.error('Error configurando listener:', error);
            return () => {};
        }
    }

    /**
     * Actualizar estado de un caso
     * @param {string} casoId - ID del caso
     * @param {string} nuevoEstado - Nuevo estado ('en_progreso', 'completado', etc.)
     * @returns {Promise<boolean>}
     */
    async actualizarEstadoCaso(casoId, nuevoEstado) {
        try {
            const casoRef = doc(db, 'casos', casoId);
            await updateDoc(casoRef, {
                estado: nuevoEstado,
                fechaActualizacion: serverTimestamp()
            });

            console.log(`✅ Estado del caso ${casoId} actualizado a: ${nuevoEstado}`);
            return true;
        } catch (error) {
            console.error('Error actualizando estado:', error);
            return false;
        }
    }

    /**
     * Guardar formulario de campo completado
     * @param {Object} formulario - Datos del formulario
     * @returns {Promise<boolean>}
     */
    async guardarFormularioCampo(formulario) {
        try {
            // Guardar en colección de formularios
            const formulariosRef = collection(db, 'formularios');
            await addDoc(formulariosRef, {
                ...formulario,
                fechaCreacion: serverTimestamp()
            });

            // Actualizar estado del caso
            if (formulario.asignacionId) {
                await this.actualizarEstadoCaso(formulario.asignacionId, 'completado');
            }

            console.log(`✅ Formulario guardado para caso ${formulario.asignacionId}`);
            return true;
        } catch (error) {
            console.error('Error guardando formulario:', error);

            // Guardar en cola local para sincronizar después
            try {
                const pendingForms = await AsyncStorage.getItem('formularios_pendientes');
                const forms = pendingForms ? JSON.parse(pendingForms) : [];
                forms.push({
                    ...formulario,
                    pendiente: true,
                    fechaGuardadoLocal: new Date().toISOString()
                });
                await AsyncStorage.setItem('formularios_pendientes', JSON.stringify(forms));
                console.log('📦 Formulario guardado localmente para sincronizar después');
            } catch (localError) {
                console.error('Error guardando formulario localmente:', localError);
            }

            return false;
        }
    }

    /**
     * Sincronizar formularios pendientes
     * Útil cuando recuperas conexión a internet
     */
    async sincronizarFormulariosPendientes() {
        try {
            const pendingForms = await AsyncStorage.getItem('formularios_pendientes');
            if (!pendingForms) {
                console.log('✅ No hay formularios pendientes');
                return;
            }

            const forms = JSON.parse(pendingForms);
            console.log(`📤 Sincronizando ${forms.length} formularios pendientes...`);

            const formulariosRef = collection(db, 'formularios');
            const sincronizados = [];

            for (const form of forms) {
                try {
                    // Remover campos de control local
                    const { pendiente, fechaGuardadoLocal, ...formData } = form;

                    await addDoc(formulariosRef, {
                        ...formData,
                        fechaCreacion: serverTimestamp(),
                        sincronizadoPosteriormente: true
                    });

                    sincronizados.push(form);
                    console.log(`✅ Formulario ${form.id} sincronizado`);
                } catch (error) {
                    console.error(`❌ Error sincronizando formulario ${form.id}:`, error);
                }
            }

            // Remover formularios sincronizados
            const noSincronizados = forms.filter(f =>
                !sincronizados.find(s => s.id === f.id)
            );

            if (noSincronizados.length > 0) {
                await AsyncStorage.setItem('formularios_pendientes', JSON.stringify(noSincronizados));
                console.log(`⚠️ ${noSincronizados.length} formularios aún pendientes`);
            } else {
                await AsyncStorage.removeItem('formularios_pendientes');
                console.log('✅ Todos los formularios sincronizados');
            }

            return {
                sincronizados: sincronizados.length,
                pendientes: noSincronizados.length
            };
        } catch (error) {
            console.error('Error sincronizando formularios:', error);
            return { sincronizados: 0, pendientes: 0 };
        }
    }

    /**
     * Detener listeners activos
     */
    stopListeners() {
        if (this.casosListener) {
            this.casosListener();
            this.casosListener = null;
        }
    }
}

export default new CasosService();
