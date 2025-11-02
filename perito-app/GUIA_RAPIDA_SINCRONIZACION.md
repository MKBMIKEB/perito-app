# 🚀 Guía Rápida - Sistema Sincronizado

Sistema completo de sincronización entre el **Panel Web del Coordinador** y la **App Móvil de Peritos** usando Firebase.

---

## 📱 Paso 1: Configurar Firebase (Solo una vez)

### 1.1 Habilitar Firestore

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **savia-424d0**
3. Click en **Firestore Database** (menú izquierdo)
4. Click en **"Crear base de datos"**
5. Selecciona **"Modo de producción"**
6. Elige ubicación: **southamerica-east1** (Brasil) o **us-central1**
7. Click en **"Habilitar"**

### 1.2 Configurar Reglas de Seguridad

En Firestore → **Reglas** → Pega esto:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Casos: Solo lectura/escritura autenticada
    match /casos/{casoId} {
      allow read, write: if request.auth != null;
    }

    // Peritos: Solo lectura/escritura autenticada
    match /peritos/{peritoId} {
      allow read, write: if request.auth != null;
    }

    // Formularios: Solo lectura/escritura autenticada
    match /formularios/{formularioId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click en **"Publicar"**

---

## 💻 Paso 2: Usar el Panel Web (Coordinador)

### 2.1 Abrir el Panel

El servidor ya está corriendo en: **http://localhost:8000**

Abre en tu navegador:
```
http://localhost:8000/index.html
```

### 2.2 Iniciar Sesión

**Credenciales:**
- Usuario: `coordinador`
- Contraseña: `admin123`

### 2.3 Registrar un Perito

1. Click en la tab **"Gestión de Peritos"**
2. Click en **"+ Nuevo Perito"**
3. Completa el formulario:
   - **Nombre:** Juan Pérez García
   - **Cédula:** 12345678 (este es el usuario para la app móvil)
   - **Teléfono:** 3001234567
   - **Email:** (opcional)
   - **Especialidad:** Especialista Urbano
   - **Contraseña:** 123456 (el perito usará esto en la app)
4. Click en **"Registrar Perito"**

### 2.4 Crear un Caso y Asignarlo

1. Click en la tab **"Gestión de Casos"**
2. Click en **"+ Nuevo Caso"**
3. Completa el formulario:
   - **Dirección:** Calle 123 #45-67, Chapinero
   - **Tipo de Avalúo:** Avalúo Comercial
   - **Municipio:** Bogotá
   - **Matrícula:** 50N-12345678 (opcional)
   - **Prioridad:** Alta
   - **Fecha Límite:** (selecciona una fecha futura)
   - **Asignar a Perito:** Juan Pérez García
4. Click en **"Crear Caso"**

**¡El caso se guardó en Firebase!** 🔥

---

## 📱 Paso 3: Usar la App Móvil (Perito)

### 3.1 Iniciar la App

En tu emulador/celular, la app ya debería estar corriendo.

### 3.2 Iniciar Sesión

**Credenciales:**
- **Cédula:** 12345678 (la que registraste en el panel web)
- **Contraseña:** 123456 (la que pusiste al registrar el perito)

### 3.3 Ver Casos Asignados

Al iniciar sesión, verás automáticamente:
- ✅ El caso que acabas de asignar desde el panel web
- ✅ Sincronizado en tiempo real desde Firebase

### 3.4 Diligenciar un Caso

1. Click en el caso asignado
2. Se abre el **Formulario de Diligenciamiento**
3. Completa todos los campos:
   - Información General
   - Características Físicas
   - Servicios Públicos
   - **Ubicación GPS** (obligatorio)
   - Observaciones
4. Click en **"Capturar Ubicación GPS"**
5. Click en **"Guardar Formulario"**

**¡El formulario se guarda en Firebase!** 🔥

---

## 🔄 Flujo Completo de Sincronización

```
1. Coordinador (Web) → Crea caso → Firebase Firestore
                                        ↓
2. Firebase → Sincronización automática → App Móvil
                                        ↓
3. Perito ve caso → Diligencia formulario
                                        ↓
4. Formulario guardado → Firebase → Estado: "Completado"
                                        ↓
5. Coordinador (Web) → Ve caso completado en tiempo real
```

---

## ✅ Verificar que Funciona

### En el Panel Web:

1. Crea un caso
2. Asígnalo a un perito
3. Verás que el estado es **"Asignado"** (badge azul)

### En la App Móvil:

1. Inicia sesión con la cédula del perito
2. **¡Deberías ver el caso inmediatamente!**
3. Click en "Iniciar" → Estado cambia a **"En Progreso"**

### De vuelta en el Panel Web:

1. **Refresca la página** (o espera unos segundos)
2. El caso ahora muestra estado **"En Progreso"** (badge amarillo)
3. ✅ **¡Está sincronizado!**

---

## 🐛 Solución de Problemas

### La app móvil no muestra casos

**Verifica:**
1. ¿El perito está registrado en Firestore?
   - Panel Web → Gestión de Peritos → Verifica que aparezca
2. ¿El caso está asignado al perito correcto?
   - Panel Web → Gestión de Casos → Verifica "Perito Asignado"
3. ¿Firebase Firestore está habilitado?
   - Firebase Console → Firestore Database → Debe estar activo
4. Revisa los logs de la app móvil:
   - En la terminal de Expo, busca: `📋 Cargando casos para perito:`

### El perito no puede iniciar sesión

**Solución:**
1. Verifica que el perito esté registrado:
   - Panel Web → Gestión de Peritos
2. Usa la **cédula** como usuario (no el email)
3. Usa la **contraseña** que configuraste al registrar
4. Verifica que el perito esté **Activo** (no desactivado)

### Los cambios no se sincronizan

**Solución:**
1. Verifica tu conexión a internet
2. Revisa las reglas de Firestore (Paso 1.2)
3. En la terminal de Expo, busca errores de Firebase
4. Intenta cerrar y abrir la app móvil

### Error: "Permission Denied" en Firestore

**Solución:**
Actualiza las reglas de Firestore (ver Paso 1.2). Las reglas actuales permiten cualquier operación autenticada.

---

## 📊 Ver Datos en Firebase Console

Para verificar que los datos se están guardando:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **savia-424d0**
3. Click en **Firestore Database**
4. Verás las colecciones:
   - **peritos** → Lista de peritos registrados
   - **casos** → Lista de casos creados
   - **formularios** → Formularios completados por peritos

---

## 🎯 Casos de Uso

### Coordinador asigna 10 casos a diferentes peritos

```
1. Panel Web → Crear 10 casos
2. Asignar cada caso a diferentes peritos
3. Cada perito ve solo sus casos en la app móvil
```

### Perito trabaja offline y luego sincroniza

```
1. Perito diligencia formulario sin internet
2. Formulario se guarda localmente
3. Cuando recupera internet → Se sincroniza automáticamente
4. Coordinador ve el formulario completado
```

### Coordinador reasigna un caso

```
1. Panel Web → Click en "Reasignar"
2. Selecciona nuevo perito
3. El caso desaparece del perito anterior
4. Aparece en el perito nuevo → ¡En tiempo real!
```

---

## 📚 Documentación Completa

Para más detalles, consulta:
- [INTEGRACION_FIREBASE.md](INTEGRACION_FIREBASE.md) - Guía técnica completa
- [README.md](web-coordinador/README.md) - Documentación del panel web

---

## ✨ Resumen

✅ **Panel Web** → http://localhost:8000/index.html
✅ **Usuario Coordinador** → coordinador / admin123
✅ **Registrar Perito** → Gestión de Peritos → + Nuevo Perito
✅ **Crear Caso** → Gestión de Casos → + Nuevo Caso
✅ **App Móvil** → Login con cédula del perito
✅ **Sincronización** → Automática en tiempo real

**¡Todo está conectado y funcionando!** 🎉
