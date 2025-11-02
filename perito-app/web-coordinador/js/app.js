// Estado de la aplicación
let currentUser = null;
let casos = [];
let peritos = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Cargar datos desde localStorage
    loadFromLocalStorage();

    // Event Listeners
    setupEventListeners();

    // Verificar sesión
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

// Login y Sesión
function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Validación simple (en producción usar Firebase Auth)
    if (username === 'coordinador' && password === 'admin123') {
        currentUser = {
            nombre: 'Coordinador Principal',
            rol: 'coordinador',
            id: 'COORD001'
        };

        saveToLocalStorage();
        showDashboard();
    } else {
        alert('Usuario o contraseña incorrectos');
    }
}

function handleLogout() {
    if (confirm('¿Seguro que deseas cerrar sesión?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showLogin();
    }
}

function checkSession() {
    if (currentUser) {
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('dashboardScreen').classList.remove('active');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('dashboardScreen').classList.add('active');
    document.getElementById('coordinadorNombre').textContent = currentUser.nombre;

    updateDashboard();
}

// Tabs
function switchTab(tabName) {
    // Actualizar tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Actualizar Dashboard
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
    const peritosActivos = peritos.filter(p => p.activo).length;

    document.getElementById('statSinAsignar').textContent = sinAsignar;
    document.getElementById('statEnProceso').textContent = enProceso;
    document.getElementById('statCompletados').textContent = completados;
    document.getElementById('statPeritosActivos').textContent = peritosActivos;
}

// Gestión de Casos
function handleNuevoCaso(e) {
    e.preventDefault();

    const caso = {
        id: `AV${Date.now().toString().slice(-6)}`,
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
        fechaCreacion: new Date().toISOString()
    };

    // Si hay perito asignado, obtener nombre
    if (caso.peritoId) {
        const perito = peritos.find(p => p.id === caso.peritoId);
        caso.peritoNombre = perito ? perito.nombre : null;
    }

    casos.push(caso);
    saveToLocalStorage();
    updateDashboard();
    closeModal('nuevoCasoModal');
    e.target.reset();

    alert(`Caso ${caso.id} creado exitosamente`);
}

function renderCasos() {
    const tbody = document.getElementById('casosTableBody');

    if (casos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #6B7280;">No hay casos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = casos.map(caso => `
        <tr>
            <td><strong>${caso.id}</strong></td>
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
            c.matricula.toLowerCase().includes(search) ||
            c.id.toLowerCase().includes(search)
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
            <td><strong>${caso.id}</strong></td>
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

function abrirAsignarPerito(casoId) {
    const caso = casos.find(c => c.id === casoId);
    if (!caso) return;

    document.getElementById('asignarCasoCodigo').textContent = caso.id;
    document.getElementById('asignarCasoDireccion').textContent = caso.direccion;

    const select = document.getElementById('selectPerito');
    select.innerHTML = '<option value="">Seleccione un perito...</option>' +
        peritos.filter(p => p.activo).map(p =>
            `<option value="${p.id}" ${caso.peritoId === p.id ? 'selected' : ''}>${p.nombre} - ${p.especialidad}</option>`
        ).join('');

    select.dataset.casoId = casoId;
    openModal('asignarPeritoModal');
}

function handleAsignarPerito() {
    const select = document.getElementById('selectPerito');
    const casoId = select.dataset.casoId;
    const peritoId = select.value;

    if (!peritoId) {
        alert('Debe seleccionar un perito');
        return;
    }

    const caso = casos.find(c => c.id === casoId);
    const perito = peritos.find(p => p.id === peritoId);

    if (caso && perito) {
        caso.peritoId = peritoId;
        caso.peritoNombre = perito.nombre;
        caso.estado = 'asignado';

        saveToLocalStorage();
        updateDashboard();
        closeModal('asignarPeritoModal');

        alert(`Caso ${casoId} asignado a ${perito.nombre}`);
    }
}

function eliminarCaso(casoId) {
    if (confirm('¿Seguro que deseas eliminar este caso?')) {
        casos = casos.filter(c => c.id !== casoId);
        saveToLocalStorage();
        updateDashboard();
    }
}

// Gestión de Peritos
function handleNuevoPerito(e) {
    e.preventDefault();

    const perito = {
        id: `PER${Date.now().toString().slice(-6)}`,
        nombre: document.getElementById('peritoNombre').value,
        cedula: document.getElementById('peritoCedula').value,
        telefono: document.getElementById('peritoTelefono').value,
        email: document.getElementById('peritoEmail').value || 'N/A',
        especialidad: document.getElementById('peritoEspecialidad').value,
        password: document.getElementById('peritoPassword').value,
        activo: true,
        casosAsignados: 0,
        casosCompletados: 0,
        fechaRegistro: new Date().toISOString()
    };

    peritos.push(perito);
    saveToLocalStorage();
    updateDashboard();
    closeModal('nuevoPeritoModal');
    e.target.reset();

    alert(`Perito ${perito.nombre} registrado exitosamente`);
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
                        <span class="badge ${perito.activo ? 'badge-completado' : 'badge-sin-asignar'}">
                            ${perito.activo ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                </div>
                <div class="perito-actions">
                    <button class="btn btn-sm ${perito.activo ? 'btn-danger' : 'btn-success'}"
                            onclick="togglePeritoEstado('${perito.id}')">
                        ${perito.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarPerito('${perito.id}')">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
}

function togglePeritoEstado(peritoId) {
    const perito = peritos.find(p => p.id === peritoId);
    if (perito) {
        perito.activo = !perito.activo;
        saveToLocalStorage();
        updateDashboard();
    }
}

function eliminarPerito(peritoId) {
    const casosAsignados = casos.filter(c => c.peritoId === peritoId && c.estado !== 'completado').length;

    if (casosAsignados > 0) {
        alert('No se puede eliminar un perito con casos activos asignados');
        return;
    }

    if (confirm('¿Seguro que deseas eliminar este perito?')) {
        peritos = peritos.filter(p => p.id !== peritoId);
        saveToLocalStorage();
        updateDashboard();
    }
}

// Utilidades
function populateFilterPeritos() {
    const select = document.getElementById('filterPerito');
    select.innerHTML = '<option value="">Todos los peritos</option>' +
        peritos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
}

function populateCasoPeritos() {
    const select = document.getElementById('casoPerito');
    select.innerHTML = '<option value="">Sin asignar</option>' +
        peritos.filter(p => p.activo).map(p =>
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
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO');
}

// Modales
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('casos', JSON.stringify(casos));
    localStorage.setItem('peritos', JSON.stringify(peritos));
}

function loadFromLocalStorage() {
    const savedUser = localStorage.getItem('currentUser');
    const savedCasos = localStorage.getItem('casos');
    const savedPeritos = localStorage.getItem('peritos');

    if (savedUser) currentUser = JSON.parse(savedUser);
    if (savedCasos) casos = JSON.parse(savedCasos);
    if (savedPeritos) peritos = JSON.parse(savedPeritos);

    // Datos de ejemplo si no hay nada guardado
    if (peritos.length === 0) {
        peritos = [
            {
                id: 'PER001',
                nombre: 'Juan Pérez García',
                cedula: '12345678',
                telefono: '+57 300 123 4567',
                email: 'juan.perez@example.com',
                especialidad: 'Especialista Urbano',
                password: '123456',
                activo: true,
                fechaRegistro: new Date().toISOString()
            },
            {
                id: 'PER002',
                nombre: 'María González López',
                cedula: '87654321',
                telefono: '+57 310 987 6543',
                email: 'maria.gonzalez@example.com',
                especialidad: 'Especialista Rural',
                password: '123456',
                activo: true,
                fechaRegistro: new Date().toISOString()
            }
        ];
    }

    if (casos.length === 0) {
        casos = [
            {
                id: 'AV001',
                direccion: 'Calle 123 #45-67, Chapinero',
                tipo: 'Avalúo Comercial',
                municipio: 'Bogotá',
                matricula: '50N-12345678',
                prioridad: 'alta',
                fechaLimite: '2025-11-15',
                peritoId: 'PER001',
                peritoNombre: 'Juan Pérez García',
                observaciones: 'Requiere avalúo urgente para crédito hipotecario',
                estado: 'en_progreso',
                fechaCreacion: new Date().toISOString()
            }
        ];
    }

    saveToLocalStorage();
}
