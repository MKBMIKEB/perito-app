/**
 * App Firebase - Versión con sincronización Firebase
 * Panel Web del Coordinador con integración Firebase Firestore
 */

// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuración de Firebase
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

// Estado de la aplicación
let currentUser = null;
let casos = [];
let peritos = [];
let casosListener = null;
let peritosListener = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    checkSession();
}

function setupEventListeners() {
    // Login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // Nuevo Caso
    document.getElementById('nuevoCasoBtn').addEventListener('click', () => openModal('nuevoCasoModal'));
    document.getElementById('nuevoCasoForm').addEventListener('submit', handleNuevoCaso);

    // Nuevo Perito
    document.getElementById('nuevoPeritoBtn').addEventListener('click', () => openModal('nuevoPeritoModal'));
    document.getElementById('nuevoPeritoForm').addEventListener('submit', handleNuevoPerito);

    // Asignar Perito
    document.getElementById('confirmarAsignacionBtn').addEventListener('click', handleAsignarPerito);

    // Filtros
    document.getElementById('searchCasos').addEventListener('input', filterCasos);
    document.getElementById('filterEstado').addEventListener('change', filterCasos);
    document.getElementById('filterPerito').addEventListener('change', filterCasos);

    // Modales - Cerrar
    document.querySelectorAll('.close-modal, .cancel-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });
}

// ================== AUTENTICACIÓN ==================

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // Intenta autenticar con Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        currentUser = {
            nombre: userCredential.user.email.split('@')[0],
            rol: 'coordinador',
            id: userCredential.user.uid,
            email: userCredential.user.email
        };

        showDashboard();
        startRealtimeListeners();
    } catch (error) {
        console.error('Error en login:', error);
        alert('Error de autenticación. Verifica tus credenciales.');
    }
}

async function handleLogout() {
    if (confirm('¿Seguro que deseas cerrar sesión?')) {
        try {
            stopRealtimeListeners();
            await signOut(auth);
            currentUser = null;
            showLogin();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }
}

function checkSession() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = {
                nombre: user.email.split('@')[0],
                rol: 'coordinador',
                id: user.uid,
                email: user.email
            };
            showDashboard();
            startRealtimeListeners();
        } else {
            showLogin();
        }
    });
}

function showLogin() {
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('dashboardScreen').classList.remove('active');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('dashboardScreen').classList.add('active');
    document.getElementById('coordinadorNombre').textContent = currentUser.nombre;
}

// ================== LISTENERS EN TIEMPO REAL ==================

function startRealtimeListeners() {
    // Listener para casos
    const casosRef = collection(db, 'casos');
    casosListener = onSnapshot(casosRef, (snapshot) => {
        casos = [];
        snapshot.forEach((doc) => {
            casos.push({ id: doc.id, ...doc.data() });
        });
        console.log(`📋 ${casos.length} casos cargados desde Firebase`);
        updateDashboard();
    });

    // Listener para peritos
    const peritosRef = collection(db, 'peritos');
    peritosListener = onSnapshot(peritosRef, (snapshot) => {
        peritos = [];
        snapshot.forEach((doc) => {
            peritos.push({ id: doc.id, ...doc.data() });
        });
        console.log(`👥 ${peritos.length} peritos cargados desde Firebase`);
        updateDashboard();
    });
}

function stopRealtimeListeners() {
    if (casosListener) casosListener();
    if (peritosListener) peritosListener();
}

// ================== GESTIÓN DE CASOS ==================

async function handleNuevoCaso(e) {
    e.preventDefault();

    try {
        const caso = {
            codigo: `AV${Date.now().toString().slice(-6)}`,
            direccion: document.getElementById('casoDireccion').value,
            tipo: document.getElementById('casoTipo').value,
            municipio: document.getElementById('casoMunicipio').value,
            matricula: document.getElementById('casoMatricula').value || 'N/A',
            prioridad: document.getElementById('casoPrioridad').value,
            fechaLimite: document.getElementById('casoFechaLimite').value,
            peritoId: document.getElementById('casoPerito').value || null,
            peritoNombre: null,
            observaciones: document.getElementById('casoObservaciones').value,
            estado: document.getElementById('casoPerito').value ? 'asignado' : 'sin_asignar',
            fechaCreacion: serverTimestamp(),
            coordinadorId: currentUser.id
        };

        // Si hay perito asignado, obtener nombre
        if (caso.peritoId) {
            const peritoDoc = await getDoc(doc(db, 'peritos', caso.peritoId));
            if (peritoDoc.exists()) {
                caso.peritoNombre = peritoDoc.data().nombre;
            }
        }

        // Guardar en Firebase
        await addDoc(collection(db, 'casos'), caso);

        closeModal('nuevoCasoModal');
        e.target.reset();
        alert(`✅ Caso ${caso.codigo} creado exitosamente`);
    } catch (error) {
        console.error('Error creando caso:', error);
        alert('Error al crear el caso. Intenta de nuevo.');
    }
}

function renderCasos() {
    const tbody = document.getElementById('casosTableBody');

    if (casos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #6B7280;">No hay casos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = casos.map(caso => `
        <tr>
            <td><strong>${caso.codigo}</strong></td>
            <td>${caso.direccion}</td>
            <td>${caso.tipo}</td>
            <td>${caso.municipio}</td>
            <td>${caso.peritoNombre || '<span style="color: #9CA3AF;">Sin asignar</span>'}</td>
            <td><span class="badge badge-${caso.estado.replace('_', '-')}">${getEstadoTexto(caso.estado)}</span></td>
            <td>${formatDate(caso.fechaLimite)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="abrirAsignarPerito('${caso.id}')">
                    ${caso.peritoId ? 'Reasignar' : 'Asignar'}
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarCaso('${caso.id}')">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

function filterCasos() {
    const search = document.getElementById('searchCasos').value.toLowerCase();
    const estado = document.getElementById('filterEstado').value;
    const peritoId = document.getElementById('filterPerito').value;

    let filteredCasos = casos;

    if (search) {
        filteredCasos = filteredCasos.filter(c =>
            c.direccion.toLowerCase().includes(search) ||
            (c.matricula && c.matricula.toLowerCase().includes(search)) ||
            c.codigo.toLowerCase().includes(search)
        );
    }

    if (estado) {
        filteredCasos = filteredCasos.filter(c => c.estado === estado);
    }

    if (peritoId) {
        filteredCasos = filteredCasos.filter(c => c.peritoId === peritoId);
    }

    const tbody = document.getElementById('casosTableBody');

    if (filteredCasos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #6B7280;">No se encontraron casos</td></tr>';
        return;
    }

    tbody.innerHTML = filteredCasos.map(caso => `
        <tr>
            <td><strong>${caso.codigo}</strong></td>
            <td>${caso.direccion}</td>
            <td>${caso.tipo}</td>
            <td>${caso.municipio}</td>
            <td>${caso.peritoNombre || '<span style="color: #9CA3AF;">Sin asignar</span>'}</td>
            <td><span class="badge badge-${caso.estado.replace('_', '-')}">${getEstadoTexto(caso.estado)}</span></td>
            <td>${formatDate(caso.fechaLimite)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="abrirAsignarPerito('${caso.id}')">
                    ${caso.peritoId ? 'Reasignar' : 'Asignar'}
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarCaso('${caso.id}')">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

window.abrirAsignarPerito = async function(casoId) {
    const caso = casos.find(c => c.id === casoId);
    if (!caso) return;

    document.getElementById('asignarCasoCodigo').textContent = caso.codigo;
    document.getElementById('asignarCasoDireccion').textContent = caso.direccion;

    const select = document.getElementById('selectPerito');
    select.innerHTML = '<option value="">Seleccione un perito...</option>' +
        peritos.filter(p => p.activo !== false).map(p =>
            `<option value="${p.id}" ${caso.peritoId === p.id ? 'selected' : ''}>${p.nombre} - ${p.especialidad}</option>`
        ).join('');

    select.dataset.casoId = casoId;
    openModal('asignarPeritoModal');
}

async function handleAsignarPerito() {
    const select = document.getElementById('selectPerito');
    const casoId = select.dataset.casoId;
    const peritoId = select.value;

    if (!peritoId) {
        alert('Debe seleccionar un perito');
        return;
    }

    try {
        const peritoDoc = await getDoc(doc(db, 'peritos', peritoId));
        if (!peritoDoc.exists()) {
            alert('Perito no encontrado');
            return;
        }

        const peritoData = peritoDoc.data();

        // Actualizar caso en Firebase
        await updateDoc(doc(db, 'casos', casoId), {
            peritoId: peritoId,
            peritoNombre: peritoData.nombre,
            estado: 'asignado',
            fechaAsignacion: serverTimestamp()
        });

        closeModal('asignarPeritoModal');
        alert(`✅ Caso asignado a ${peritoData.nombre}`);
    } catch (error) {
        console.error('Error asignando perito:', error);
        alert('Error al asignar el perito');
    }
}

window.eliminarCaso = async function(casoId) {
    if (confirm('¿Seguro que deseas eliminar este caso?')) {
        try {
            await deleteDoc(doc(db, 'casos', casoId));
            alert('✅ Caso eliminado');
        } catch (error) {
            console.error('Error eliminando caso:', error);
            alert('Error al eliminar el caso');
        }
    }
}

// ================== GESTIÓN DE PERITOS ==================

async function handleNuevoPerito(e) {
    e.preventDefault();

    try {
        const cedula = document.getElementById('peritoCedula').value;

        // Verificar si ya existe un perito con esta cédula
        const peritosRef = collection(db, 'peritos');
        const q = query(peritosRef, where('cedula', '==', cedula));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            alert('Ya existe un perito con esta cédula');
            return;
        }

        const perito = {
            nombre: document.getElementById('peritoNombre').value,
            cedula: cedula,
            telefono: document.getElementById('peritoTelefono').value,
            email: document.getElementById('peritoEmail').value || 'N/A',
            especialidad: document.getElementById('peritoEspecialidad').value,
            password: document.getElementById('peritoPassword').value,
            activo: true,
            fechaRegistro: serverTimestamp(),
            coordinadorId: currentUser.id
        };

        // Guardar en Firebase
        await addDoc(collection(db, 'peritos'), perito);

        closeModal('nuevoPeritoModal');
        e.target.reset();
        alert(`✅ Perito ${perito.nombre} registrado exitosamente`);
    } catch (error) {
        console.error('Error creando perito:', error);
        alert('Error al registrar el perito');
    }
}

function renderPeritos() {
    const grid = document.getElementById('peritosGrid');

    if (peritos.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #6B7280; padding: 40px;">No hay peritos registrados</p>';
        return;
    }

    grid.innerHTML = peritos.map(perito => {
        const casosAsignados = casos.filter(c => c.peritoId === perito.id && c.estado !== 'completado').length;
        const casosCompletados = casos.filter(c => c.peritoId === perito.id && c.estado === 'completado').length;

        return `
            <div class="perito-card">
                <div class="perito-header">
                    <div class="perito-avatar">👤</div>
                    <div class="perito-info">
                        <h4>${perito.nombre}</h4>
                        <p>${perito.especialidad}</p>
                    </div>
                </div>
                <div class="perito-details">
                    <div class="perito-detail">
                        <label>Cédula:</label>
                        <span>${perito.cedula}</span>
                    </div>
                    <div class="perito-detail">
                        <label>Teléfono:</label>
                        <span>${perito.telefono}</span>
                    </div>
                    <div class="perito-detail">
                        <label>Casos Activos:</label>
                        <span>${casosAsignados}</span>
                    </div>
                    <div class="perito-detail">
                        <label>Completados:</label>
                        <span>${casosCompletados}</span>
                    </div>
                    <div class="perito-detail">
                        <label>Estado:</label>
                        <span class="badge ${perito.activo !== false ? 'badge-completado' : 'badge-sin-asignar'}">
                            ${perito.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                </div>
                <div class="perito-actions">
                    <button class="btn btn-sm ${perito.activo !== false ? 'btn-danger' : 'btn-success'}"
                            onclick="togglePeritoEstado('${perito.id}')">
                        ${perito.activo !== false ? 'Desactivar' : 'Activar'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarPerito('${perito.id}')">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
}

window.togglePeritoEstado = async function(peritoId) {
    const perito = peritos.find(p => p.id === peritoId);
    if (!perito) return;

    try {
        await updateDoc(doc(db, 'peritos', peritoId), {
            activo: !(perito.activo !== false)
        });
        alert('✅ Estado actualizado');
    } catch (error) {
        console.error('Error actualizando estado:', error);
        alert('Error al actualizar el estado');
    }
}

window.eliminarPerito = async function(peritoId) {
    const casosAsignados = casos.filter(c => c.peritoId === peritoId && c.estado !== 'completado').length;

    if (casosAsignados > 0) {
        alert('No se puede eliminar un perito con casos activos asignados');
        return;
    }

    if (confirm('¿Seguro que deseas eliminar este perito?')) {
        try {
            await deleteDoc(doc(db, 'peritos', peritoId));
            alert('✅ Perito eliminado');
        } catch (error) {
            console.error('Error eliminando perito:', error);
            alert('Error al eliminar el perito');
        }
    }
}

// ================== UTILIDADES ==================

function updateDashboard() {
    updateStats();
    renderCasos();
    renderPeritos();
    populateFilterPeritos();
    populateCasoPeritos();
}

function updateStats() {
    const sinAsignar = casos.filter(c => c.estado === 'sin_asignar').length;
    const enProceso = casos.filter(c => c.estado === 'en_progreso').length;
    const completados = casos.filter(c => c.estado === 'completado').length;
    const peritosActivos = peritos.filter(p => p.activo !== false).length;

    document.getElementById('statSinAsignar').textContent = sinAsignar;
    document.getElementById('statEnProceso').textContent = enProceso;
    document.getElementById('statCompletados').textContent = completados;
    document.getElementById('statPeritosActivos').textContent = peritosActivos;
}

function populateFilterPeritos() {
    const select = document.getElementById('filterPerito');
    select.innerHTML = '<option value="">Todos los peritos</option>' +
        peritos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
}

function populateCasoPeritos() {
    const select = document.getElementById('casoPerito');
    select.innerHTML = '<option value="">Sin asignar</option>' +
        peritos.filter(p => p.activo !== false).map(p =>
            `<option value="${p.id}">${p.nombre} - ${p.especialidad}</option>`
        ).join('');
}

function getEstadoTexto(estado) {
    const estados = {
        'sin_asignar': 'Sin Asignar',
        'asignado': 'Asignado',
        'en_progreso': 'En Progreso',
        'completado': 'Completado'
    };
    return estados[estado] || estado;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO');
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}
