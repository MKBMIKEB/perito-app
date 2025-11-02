# 🔥 Configurar Firestore - Guía Paso a Paso

Guía visual completa para habilitar y configurar Firebase Firestore en tu proyecto.

---

## 📋 Paso 1: Habilitar Firestore Database

### 1.1 Abrir Firebase Console

1. Ve a: **https://console.firebase.google.com/**
2. Inicia sesión con tu cuenta de Google
3. Selecciona tu proyecto: **savia-424d0**

### 1.2 Ir a Firestore Database

1. En el menú lateral izquierdo, busca **"Compilación"** o **"Build"**
2. Click en **"Firestore Database"**

### 1.3 Crear Base de Datos

Si es la primera vez:
1. Click en el botón **"Crear base de datos"**
2. Verás un diálogo con opciones

**Selecciona el modo:**
- ✅ Marca **"Comenzar en modo de producción"** (configuraremos reglas después)
- Click en **"Siguiente"**

**Selecciona la ubicación:**
- Opciones recomendadas:
  - `southamerica-east1` (São Paulo, Brasil) - Más cerca de Colombia
  - `us-central1` (Iowa, EE.UU.) - Alternativa
- ⚠️ **IMPORTANTE**: Esta decisión es permanente, no se puede cambiar después
- Click en **"Habilitar"**

**Espera unos segundos...**
- Verás un mensaje "Configurando Firestore..."
- Cuando termine, verás la consola de Firestore

---

## 📝 Paso 2: Configurar Reglas de Seguridad

### 2.1 Abrir el Editor de Reglas

1. En la consola de Firestore, click en la tab **"Reglas"** (arriba)
2. Verás un editor de código

### 2.2 Copiar y Pegar las Reglas

**Borra todo** el contenido actual y pega esto:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Función helper para verificar autenticación
    function isAuthenticated() {
      return request.auth != null;
    }

    // COLECCIÓN: CASOS
    match /casos/{casoId} {
      // Cualquier usuario autenticado puede leer y escribir
      allow read, write: if isAuthenticated();
    }

    // COLECCIÓN: PERITOS
    match /peritos/{peritoId} {
      // Cualquier usuario autenticado puede leer y escribir
      allow read, write: if isAuthenticated();
    }

    // COLECCIÓN: FORMULARIOS
    match /formularios/{formularioId} {
      // Cualquier usuario autenticado puede leer y escribir
      allow read, write: if isAuthenticated();
    }

    // COLECCIÓN: FOTOS
    match /fotos/{fotoId} {
      // Cualquier usuario autenticado puede leer y escribir
      allow read, write: if isAuthenticated();
    }
  }
}
```

### 2.3 Publicar las Reglas

1. Click en el botón **"Publicar"** (arriba a la derecha)
2. Espera el mensaje: "Reglas publicadas correctamente"

**⚠️ NOTA IMPORTANTE:**
Estas reglas son permisivas para desarrollo. Para producción, usa las reglas más restrictivas del archivo `firestore.rules`.

---

## 🔐 Paso 3: Habilitar Authentication (Opcional)

Si quieres usar Firebase Authentication en el futuro:

### 3.1 Ir a Authentication

1. Menú lateral → **"Authentication"**
2. Click en **"Comenzar"**

### 3.2 Habilitar Email/Password

1. Click en la tab **"Sign-in method"**
2. Busca **"Correo electrónico/contraseña"**
3. Click en **"Habilitar"**
4. Activa el switch
5. Click en **"Guardar"**

### 3.3 Crear Usuario Coordinador (Opcional)

1. Click en la tab **"Users"**
2. Click en **"Agregar usuario"**
3. Email: `coordinador@tuempresa.com`
4. Contraseña: `tuContraseñaSegura123`
5. Click en **"Agregar usuario"**

---

## 📊 Paso 4: Inicializar con Datos de Prueba

### Opción A: Manual (Recomendado para empezar)

1. Ve a Firestore Database → **"Datos"** (tab)
2. Click en **"Iniciar colección"**

#### Crear Colección "peritos":

1. ID de colección: `peritos`
2. Click en **"Siguiente"**
3. **Primer documento:**
   - ID del documento: (dejar auto-generado)
   - Agregar campos:

```
nombre: (string) Juan Pérez García
cedula: (string) 12345678
telefono: (string) 3001234567
email: (string) juan.perez@example.com
especialidad: (string) Especialista Urbano
password: (string) 123456
activo: (boolean) true
fechaRegistro: (timestamp) [click en reloj para usar timestamp actual]
```

4. Click en **"Guardar"**
5. Repite para más peritos (opcional)

#### Crear Colección "casos":

1. Click en **"Iniciar colección"**
2. ID de colección: `casos`
3. **Primer documento:**
   - ID del documento: (dejar auto-generado)
   - Agregar campos:

```
codigo: (string) AV001
direccion: (string) Calle 123 #45-67, Chapinero
tipo: (string) Avalúo Comercial
municipio: (string) Bogotá
matricula: (string) 50N-12345678
prioridad: (string) alta
fechaLimite: (string) 2025-11-30
observaciones: (string) Requiere avalúo urgente
estado: (string) sin_asignar
peritoId: (null)
peritoNombre: (null)
fechaCreacion: (timestamp) [usar timestamp actual]
```

4. Click en **"Guardar"**

### Opción B: Script Automático (Avanzado)

Si tienes Node.js instalado:

```bash
# Instalar Firebase Admin SDK
npm install firebase-admin

# Ejecutar script de inicialización
node scripts/init-firestore.js
```

Esto creará automáticamente:
- ✅ 3 peritos de prueba
- ✅ 3 casos de prueba
- ✅ 1 caso ya asignado

---

## ✅ Paso 5: Verificar la Configuración

### 5.1 Verificar que Firestore Esté Activo

1. Ve a Firestore Database → **"Datos"**
2. Deberías ver las colecciones:
   - `peritos` (con al menos 1 documento)
   - `casos` (con al menos 1 documento)

### 5.2 Probar desde el Panel Web

1. Abre: **http://localhost:8000/index.html**
2. Login: `coordinador` / `admin123`
3. Ve a **"Gestión de Peritos"**
4. Deberías ver los peritos creados

### 5.3 Probar desde la App Móvil

1. Abre la app en el emulador
2. Login con:
   - **Cédula:** 12345678
   - **Password:** 123456
3. Si hay casos asignados, los verás en el HomeScreen

---

## 🎯 Resultado Final

Al terminar, deberías tener:

✅ **Firestore Database habilitado**
- Ubicación: southamerica-east1 o us-central1
- Estado: Activo

✅ **Reglas de seguridad configuradas**
- Permiten lectura/escritura a usuarios autenticados

✅ **Colecciones creadas:**
- `peritos` (con datos de prueba)
- `casos` (con datos de prueba)

✅ **Sistema funcionando:**
- Panel web conectado a Firebase
- App móvil conectada a Firebase
- Sincronización en tiempo real activa

---

## 🔄 Probar la Sincronización

### Prueba 1: Crear Caso desde el Panel Web

1. Panel Web → Gestión de Casos → + Nuevo Caso
2. Completa el formulario
3. Asigna a un perito
4. **Resultado**: El caso aparece en la app móvil del perito

### Prueba 2: Actualizar Estado desde la App

1. App Móvil → Click en un caso
2. Click en "Iniciar Trabajo"
3. **Resultado**: El estado se actualiza en el panel web

### Prueba 3: Completar Formulario

1. App Móvil → Diligenciar formulario
2. Llenar todos los campos
3. Guardar formulario
4. **Resultado**: El caso se marca como "Completado" en el panel web

---

## 🐛 Solución de Problemas

### Error: "Missing or insufficient permissions"

**Solución:**
1. Ve a Firestore → Reglas
2. Verifica que las reglas están publicadas
3. Asegúrate de que la función `isAuthenticated()` retorna `true`

### No veo los datos en la app móvil

**Verifica:**
1. ¿Firestore está habilitado?
2. ¿Las reglas están publicadas?
3. ¿El perito existe en la colección `peritos`?
4. ¿La app tiene conexión a internet?

### Los cambios no se sincronizan

**Solución:**
1. Cierra y abre la app móvil
2. Refresca el panel web (F5)
3. Verifica los logs en la consola del navegador
4. Revisa que Firebase está configurado correctamente

---

## 📚 Recursos Adicionales

- **Firebase Console**: https://console.firebase.google.com/
- **Documentación Firestore**: https://firebase.google.com/docs/firestore
- **Guía de Reglas**: https://firebase.google.com/docs/firestore/security/get-started

---

## 🎉 ¡Listo!

Tu Firestore está configurado y listo para usar. Ahora:

1. **Panel Web**: http://localhost:8000/index.html
2. **Credenciales Panel**: coordinador / admin123
3. **Credenciales App**: 12345678 / 123456

**¡Todo debería estar sincronizado en tiempo real!** 🚀
