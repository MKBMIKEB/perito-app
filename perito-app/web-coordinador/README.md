# 📱 Panel Web de Coordinador - Perito App

Sistema web para que el coordinador gestione casos de avalúos y asigne peritos.

## 🚀 Características

### ✅ Gestión de Casos
- Crear nuevos casos de avalúo
- Asignar/reasignar peritos a casos
- Filtrar casos por estado, perito o búsqueda
- Ver estadísticas en tiempo real
- Eliminar casos

### 👥 Gestión de Peritos
- Registrar nuevos peritos
- Ver información detallada de cada perito
- Activar/desactivar peritos
- Ver casos asignados y completados

### 📊 Dashboard
- Estadísticas en tiempo real
- Casos sin asignar
- Casos en progreso
- Casos completados
- Peritos activos

## 🔧 Instalación

### Opción 1: Abrir directamente (Recomendado para desarrollo)

1. Navega a la carpeta `web-coordinador`
2. Abre el archivo `index.html` en tu navegador

### Opción 2: Servidor Local

```bash
# Con Python 3
cd web-coordinador
python -m http.server 8000

# Con Node.js (http-server)
npx http-server web-coordinador -p 8000
```

Luego abre: `http://localhost:8000`

## 🔐 Credenciales de Prueba

**Usuario:** `coordinador`
**Contraseña:** `admin123`

## 📱 Uso

### 1. Iniciar Sesión
- Ingresa con las credenciales de coordinador

### 2. Gestión de Casos
- Click en **"+ Nuevo Caso"**
- Completa el formulario con:
  - Dirección del predio
  - Tipo de avalúo
  - Municipio
  - Matrícula inmobiliaria
  - Prioridad (normal, alta, urgente)
  - Fecha límite
  - Asignar perito (opcional)
- Click en **"Crear Caso"**

### 3. Asignar Peritos
- En la tabla de casos, click en **"Asignar"**
- Selecciona el perito de la lista
- Click en **"Asignar"**

### 4. Gestión de Peritos
- Click en la tab **"Gestión de Peritos"**
- Click en **"+ Nuevo Perito"**
- Completa el formulario:
  - Nombre completo
  - Cédula
  - Teléfono
  - Email
  - Especialidad
  - Contraseña
- Click en **"Registrar Perito"**

### 5. Filtros y Búsqueda
- Usa el campo de búsqueda para encontrar casos por dirección o código
- Filtra por estado: Sin Asignar, Asignado, En Progreso, Completado
- Filtra por perito específico

## 💾 Almacenamiento

Actualmente usa **LocalStorage** del navegador para almacenar datos localmente.

### Datos almacenados:
- `currentUser`: Sesión del coordinador
- `casos`: Lista de casos de avalúo
- `peritos`: Lista de peritos registrados

## 🔄 Integración con Firebase (Opcional)

Para usar Firebase en lugar de LocalStorage:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)

2. Habilita Firestore Database

3. Edita `js/firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROJECT_ID.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT_ID.appspot.com",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};
```

4. Actualiza `js/app.js` para usar Firestore en lugar de localStorage

## 🔗 Sincronización con la App Móvil

Los casos creados aquí se sincronizan con la app móvil de los peritos mediante Firebase:

1. **Coordinador Web** → Crea caso → Firebase Firestore
2. **App Móvil Perito** → Sincroniza → Descarga casos asignados
3. **Perito completa formulario** → Sube datos → Firebase
4. **Coordinador Web** → Ve resultados actualizados

## 📁 Estructura de Archivos

```
web-coordinador/
├── index.html          # Página principal
├── styles/
│   └── main.css       # Estilos CSS
├── js/
│   ├── app.js         # Lógica principal
│   └── firebase-config.js  # Configuración Firebase
└── README.md          # Este archivo
```

## 🎨 Características de UI/UX

- ✅ Diseño responsive (funciona en escritorio, tablet y móvil)
- ✅ Interfaz intuitiva y moderna
- ✅ Colores según el estado (rojo=pendiente, amarillo=proceso, verde=completado)
- ✅ Animaciones suaves
- ✅ Filtros en tiempo real
- ✅ Modales para formularios

## 🐛 Solución de Problemas

### Los datos desaparecen al recargar
- Los datos se guardan en localStorage del navegador
- No uses modo incógnito
- No borres el caché del navegador

### No puedo iniciar sesión
- Verifica las credenciales: `coordinador` / `admin123`
- Revisa la consola del navegador (F12) por errores

### Los peritos no aparecen en el selector
- Ve a la tab "Gestión de Peritos"
- Verifica que haya peritos registrados y activos

## 📝 Notas Importantes

1. **Seguridad**: Este es un prototipo. En producción, implementa:
   - Autenticación real (Firebase Auth)
   - Validación en el servidor
   - HTTPS
   - Sanitización de inputs

2. **Datos de ejemplo**: Al cargar por primera vez, se crean:
   - 2 peritos de ejemplo
   - 1 caso de ejemplo

3. **Persistencia**: Los datos se mantienen en localStorage hasta que:
   - Borres el caché del navegador
   - Uses modo incógnito
   - Cambies de navegador

## 🚀 Próximas Funcionalidades

- [ ] Exportar reportes a PDF/Excel
- [ ] Dashboard con gráficos
- [ ] Notificaciones en tiempo real
- [ ] Chat entre coordinador y peritos
- [ ] Historial de cambios
- [ ] Backup automático a Firebase
- [ ] Multi-coordinadores
- [ ] Roles y permisos

## 📞 Soporte

Para soporte o preguntas, contacta al equipo de desarrollo.

---

**Versión:** 1.0.0
**Última actualización:** Octubre 2025
