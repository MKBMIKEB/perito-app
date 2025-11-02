# 🔥 Integración Firebase - Perito App

Guía completa para integrar Firebase y sincronizar el panel web del coordinador con la app móvil de los peritos.

## 📋 Índice

1. [Configuración Inicial](#configuración-inicial)
2. [Panel Web del Coordinador](#panel-web-del-coordinador)
3. [App Móvil de Peritos](#app-móvil-de-peritos)
4. [Estructura de Datos](#estructura-de-datos)
5. [Flujo de Sincronización](#flujo-de-sincronización)
6. [Solución de Problemas](#solución-de-problemas)

---

## 🚀 Configuración Inicial

### 1. Firebase Console

Ya tienes Firebase configurado con estos datos:

```javascript
projectId: "savia-424d0"
apiKey: "AIzaSyA6sFJ3I2-pYLPdGPCBldotnBSoaENWbWA"
authDomain: "savia-424d0.firebaseapp.com"
```

### 2. Habilitar Servicios en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `savia-424d0`
3. Habilita los siguientes servicios:

#### a) **Firestore Database**
   - Click en "Firestore Database" en el menú lateral
   - Click en "Crear base de datos"
   - Selecciona "Modo de producción" (configuraremos reglas después)
   - Elige la ubicación: `us-central` o `southamerica-east1`

#### b) **Authentication**
   - Click en "Authentication" en el menú lateral
   - Click en "Comenzar"
   - Habilita "Correo electrónico/contraseña"

#### c) **Storage** (para fotos)
   - Click en "Storage" en el menú lateral
   - Click en "Comenzar"
   - Acepta las reglas predeterminadas

### 3. Crear Usuario Coordinador

En Firebase Console → Authentication:

1. Click en "Agregar usuario"
2. Email: `coordinador@example.com`
3. Contraseña: `tuContraseñaSegura123`
4. Click en "Agregar usuario"

### 4. Configurar Reglas de Firestore

En Firebase Console → Firestore Database → Reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Casos: Coordinadores pueden escribir, peritos pueden leer los suyos
    match /casos/{casoId} {
      // Coordinadores pueden hacer todo
      allow read, write: if request.auth != null &&
                         request.auth.token.email.matches('.*coordinador.*');

      // Peritos solo pueden leer sus casos asignados
      allow read: if request.auth != null &&
                     resource.data.peritoId == request.auth.uid;

      // Peritos pueden actualizar el estado de sus casos
      allow update: if request.auth != null &&
                       resource.data.peritoId == request.auth.uid &&
                       request.resource.data.diff(resource.data).affectedKeys()
                         .hasOnly(['estado', 'fechaActualizacion']);
    }

    // Peritos: Coordinadores pueden gestionar, peritos pueden leer su propia info
    match /peritos/{peritoId} {
      allow read, write: if request.auth != null &&
                           request.auth.token.email.matches('.*coordinador.*');
      allow read: if request.auth != null && peritoId == request.auth.uid;
    }

    // Formularios: Peritos pueden escribir, coordinadores pueden leer
    match /formularios/{formularioId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }

    // Fotos: Cualquier usuario autenticado puede leer y escribir
    match /fotos/{fotoId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 💻 Panel Web del Coordinador

### Uso del Panel

1. **Abrir el Panel**:
   ```bash
   cd web-coordinador
   # Abre index-firebase.html en tu navegador
   # O usa un servidor local:
   python -m http.server 8000
   # Navega a: http://localhost:8000/index-firebase.html
   ```

2. **Iniciar Sesión**:
   - Email: `coordinador@example.com`
   - Contraseña: La que configuraste en Firebase Authentication

3. **Crear Caso**:
   - Click en "+ Nuevo Caso"
   - Completa todos los campos
   - **Importante**: Si asignas un perito, ese perito debe estar registrado en la colección `peritos` de Firestore

4. **Asignar Perito**:
   - En la tabla de casos, click en "Asignar"
   - Selecciona el perito de la lista
   - El caso se sincroniza automáticamente con la app del perito

### Características del Panel

- ✅ **Sincronización en tiempo real**: Los cambios se reflejan inmediatamente
- ✅ **Sin configuración adicional**: Firebase ya está configurado
- ✅ **Estadísticas en vivo**: Actualizadas automáticamente
- ✅ **Filtros y búsqueda**: Para gestionar muchos casos

---

## 📱 App Móvil de Peritos

### Uso del Servicio de Casos

En tus componentes de React Native:

```javascript
import CasosService from '../services/CasosService';
import { AuthService } from '../services/AuthService';

// En tu componente
useEffect(() => {
    cargarCasos();
}, []);

const cargarCasos = async () => {
    const perito = await AuthService.getStoredPerito();

    if (perito && perito.peritoId) {
        // Opción 1: Cargar casos una vez
        const casos = await CasosService.getCasosAsignados(perito.peritoId);
        console.log('Casos cargados:', casos);

        // Opción 2: Escuchar cambios en tiempo real (recomendado)
        const unsubscribe = CasosService.listenToCasosAsignados(
            perito.peritoId,
            (casosActualizados) => {
                console.log('Casos actualizados:', casosActualizados);
                // Actualizar estado del componente
                setCasos(casosActualizados);
            }
        );

        // Limpiar listener al desmontar
        return () => unsubscribe();
    }
};
```

### Actualizar Estado de Caso

Cuando un perito inicia o completa un caso:

```javascript
import CasosService from '../services/CasosService';

// Al iniciar trabajo
const iniciarTrabajo = async (casoId) => {
    const exito = await CasosService.actualizarEstadoCaso(casoId, 'en_progreso');
    if (exito) {
        Alert.alert('Trabajo Iniciado', 'El caso se marcó como en progreso');
    }
};

// Al completar formulario
const guardarFormulario = async (formularioData) => {
    const exito = await CasosService.guardarFormularioCampo(formularioData);
    if (exito) {
        Alert.alert('Formulario Guardado', 'El caso se marcó como completado');
    }
};
```

### Sincronización Offline

El servicio guarda automáticamente en caché local:

```javascript
// Sincronizar formularios pendientes cuando recuperes conexión
import CasosService from '../services/CasosService';
import NetInfo from '@react-native-community/netinfo';

useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
        if (state.isConnected) {
            sincronizarPendientes();
        }
    });

    return () => unsubscribe();
}, []);

const sincronizarPendientes = async () => {
    const resultado = await CasosService.sincronizarFormulariosPendientes();
    console.log(`Sincronizados: ${resultado.sincronizados}`);
    console.log(`Pendientes: ${resultado.pendientes}`);
};
```

---

## 📊 Estructura de Datos

### Colección: `casos`

```javascript
{
    id: "auto-generado-por-firestore",
    codigo: "AV123456",
    direccion: "Calle 123 #45-67",
    tipo: "Avalúo Comercial",
    municipio: "Bogotá",
    matricula: "50N-12345678",
    prioridad: "alta", // "normal", "alta", "urgente"
    fechaLimite: "2025-11-15",
    peritoId: "PER123456",
    peritoNombre: "Juan Pérez",
    observaciones: "Requiere avalúo urgente",
    estado: "asignado", // "sin_asignar", "asignado", "en_progreso", "completado"
    fechaCreacion: Timestamp,
    fechaAsignacion: Timestamp,
    fechaActualizacion: Timestamp,
    coordinadorId: "uid-del-coordinador"
}
```

### Colección: `peritos`

```javascript
{
    id: "auto-generado-por-firestore",
    nombre: "Juan Pérez García",
    cedula: "12345678",
    telefono: "+57 300 123 4567",
    email: "juan.perez@example.com",
    especialidad: "Especialista Urbano",
    password: "hash-contraseña", // Solo para login en app móvil
    activo: true,
    fechaRegistro: Timestamp,
    coordinadorId: "uid-del-coordinador"
}
```

### Colección: `formularios`

```javascript
{
    id: "auto-generado-por-firestore",
    asignacionId: "caso-id",
    peritoId: "perito-id",
    // Información General
    direccion: "Calle 123 #45-67",
    matricula: "50N-12345678",
    tipoPredio: "Casa",
    propietario: "Pedro González",
    telefono: "300 123 4567",
    // Características Físicas
    areaTerreno: 120.5,
    areaConstruida: 80.0,
    frente: 10.5,
    fondo: 12.0,
    pisos: 2,
    habitaciones: 3,
    banos: 2,
    garajes: 1,
    estadoConservacion: "Bueno",
    // Servicios Públicos
    servicios: {
        agua: true,
        luz: true,
        gas: false,
        alcantarillado: true,
        internet: true
    },
    // Ubicación
    coordenadas: {
        latitude: 4.6097,
        longitude: -74.0817,
        accuracy: 10
    },
    // Observaciones
    observaciones: "Predio en excelente estado...",
    // Metadata
    fechaCreacion: Timestamp,
    estado: "completado"
}
```

### Colección: `fotos`

```javascript
{
    id: "auto-generado-por-firestore",
    asignacionId: "caso-id",
    peritoId: "perito-id",
    url: "gs://savia-424d0.appspot.com/fotos/...",
    tipo: "fachada", // "fachada", "interior", "documento", etc.
    observaciones: "Vista frontal del inmueble",
    coordenadas: {
        latitude: 4.6097,
        longitude: -74.0817
    },
    fechaCaptura: Timestamp
}
```

---

## 🔄 Flujo de Sincronización

### 1. Coordinador Crea Caso

```
Coordinador (Web) → Firebase Firestore → casos/{id}
                                            ↓
                                    onSnapshot Listener
                                            ↓
                              App Móvil del Perito (notificado)
```

### 2. Perito Ve Caso Asignado

```
App Móvil → CasosService.listenToCasosAsignados()
                    ↓
            Firebase Firestore Query (where peritoId ==)
                    ↓
            Actualización en Tiempo Real
```

### 3. Perito Actualiza Estado

```
App Móvil → CasosService.actualizarEstadoCaso()
                    ↓
            Firebase Firestore → updateDoc()
                    ↓
            Panel Web (actualizado automáticamente)
```

### 4. Perito Completa Formulario

```
App Móvil → CasosService.guardarFormularioCampo()
                    ↓
            Firebase Firestore → formularios/{id}
                    ↓
            Actualiza estado de caso a "completado"
                    ↓
            Panel Web (refleja cambio)
```

---

## 🛠 Solución de Problemas

### Problema: "No puedo iniciar sesión en el panel web"

**Solución**:
1. Verifica que creaste el usuario en Firebase Authentication
2. Usa el email completo: `coordinador@example.com`
3. Abre la consola del navegador (F12) para ver errores
4. Verifica que index-firebase.html carga correctamente los scripts de Firebase

### Problema: "Los casos no aparecen en la app móvil"

**Solución**:
1. Verifica que el perito esté registrado en Firestore:
   - Firebase Console → Firestore → `peritos`
   - Busca por cédula del perito
2. Verifica que `peritoId` del caso coincida con el ID del documento del perito
3. Revisa los logs de la app: `console.log('Casos:', casos)`
4. Verifica las reglas de Firestore

### Problema: "Error de permisos en Firestore"

**Solución**:
Actualiza las reglas en Firebase Console → Firestore → Reglas (ver sección de configuración arriba)

### Problema: "Los cambios no se sincronizan en tiempo real"

**Solución**:
1. Verifica que estés usando `listenToCasosAsignados()` en lugar de `getCasosAsignados()`
2. Verifica tu conexión a internet
3. Revisa los listeners: `console.log('Listener activo:', !!casosListener)`

### Problema: "App móvil no funciona offline"

**Solución**:
El servicio ya implementa caché local:
- Los casos se guardan en AsyncStorage
- Los formularios pendientes se sincronizan automáticamente
- Para forzar sincronización: `CasosService.sincronizarFormulariosPendientes()`

---

## 📚 Recursos Adicionales

- [Documentación Firebase](https://firebase.google.com/docs)
- [Firestore Queries](https://firebase.google.com/docs/firestore/query-data/queries)
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Console](https://console.firebase.google.com/)

---

## ✅ Checklist de Integración

- [ ] Firestore Database habilitado
- [ ] Authentication configurado
- [ ] Usuario coordinador creado
- [ ] Reglas de Firestore configuradas
- [ ] Panel web funciona (index-firebase.html)
- [ ] CasosService integrado en app móvil
- [ ] Listeners en tiempo real funcionando
- [ ] Sincronización offline probada
- [ ] Formularios se guardan correctamente

---

**¿Necesitas ayuda?** Revisa los logs en:
- Panel Web: Consola del navegador (F12)
- App Móvil: Logs de React Native (`console.log`)
- Firebase: Firebase Console → Firestore → Logs
