# 🔄 INSTRUCCIONES PARA REINICIAR LA APP

## ⚠️ IMPORTANTE: La app tiene código antiguo en caché

El problema es que tu dispositivo/emulador tiene el código antiguo cargado en memoria.

---

## 🛠️ SOLUCIÓN - Sigue estos pasos EN ORDEN:

### **Paso 1: Detener Expo Actual**

En la terminal donde está corriendo Expo:
```
Presiona: Ctrl + C
```

Espera a que se detenga completamente.

---

### **Paso 2: Cerrar Completamente la App**

En tu dispositivo/emulador:

**Android:**
- Ve a aplicaciones recientes
- Desliza hacia arriba para cerrar Expo Go completamente
- O ve a Configuración → Apps → Expo Go → Forzar detención

**iOS:**
- Doble clic en botón Home
- Desliza hacia arriba para cerrar Expo Go

---

### **Paso 3: Limpiar Cache de Expo**

En la terminal, ejecuta:

```bash
cd perito-app
npx expo start --clear
```

Esto eliminará todo el caché de Metro Bundler.

---

### **Paso 4: Abrir App desde Cero**

1. **Espera** a que Expo muestre el código QR
2. **Abre Expo Go** en tu dispositivo
3. **Escanea el código QR nuevamente** (no uses el historial)

---

## ✅ Verificación

Cuando la app se abra, deberías ver:

1. ✅ Texto: "Azure Integration v2.0" en pantalla de carga
2. ✅ Botón azul grande: "Iniciar Sesión con Microsoft"
3. ✅ Texto: "Inicia sesión con tu cuenta de Microsoft"
4. ❌ **NO** debe haber campos de cédula/contraseña

---

## 🔥 Si TODAVÍA pide cédula después de hacer esto:

### Opción A: Limpieza Profunda (Windows)

```bash
# Ejecutar el archivo batch que creé:
LIMPIAR_CACHE.bat
```

### Opción B: Limpieza Manual Completa

```bash
# 1. Detener Expo
Ctrl + C

# 2. Eliminar cache
cd perito-app
rd /s /q .expo
rd /s /q node_modules\.cache
del package-lock.json

# 3. Reinstalar
npm install

# 4. Reiniciar
npx expo start --clear
```

---

## 🌐 Opción Alternativa: Probar en Navegador Web

Si sigues teniendo problemas en el dispositivo, prueba en navegador:

```bash
npx expo start
# Presiona 'W' cuando veas el menú
```

Esto abrirá la app en tu navegador, donde el caché es más fácil de limpiar.

---

## 📱 Verificar que los Archivos Estén Correctos

Los archivos ya están actualizados. Puedes verificar:

**LoginScreen.js** (líneas 1-5):
```javascript
/**
 * LoginScreen - Azure AD Authentication
 * Perito App - Observatorio Inmobiliario
 */

import { useState, useEffect } from 'react';
```

**App.js** (línea 2):
```javascript
 * App.js - Azure AD Integration
```

Si ves estos textos, los archivos están bien. **Es solo problema de caché.**

---

## 🆘 ¿Sigue sin funcionar?

Si después de TODO esto sigue pidiendo cédula:

1. Toma captura de pantalla de la app
2. Copia el output de la terminal cuando haces `npx expo start --clear`
3. Revisa si hay errores en rojo

El problema más probable es que Expo Go esté usando una versión muy antigua en caché.

---

## ✨ Última Opción: Reinstalar Expo Go

Si nada funciona:

1. Desinstala Expo Go del dispositivo
2. Reinstala Expo Go desde la tienda
3. Ejecuta `npx expo start --clear`
4. Escanea el QR

---

## 📞 Estado de Archivos:

- ✅ LoginScreen.js → Actualizado con Azure AD
- ✅ App.js → Actualizado con Azure AD
- ✅ AzureAuthService.js → Creado
- ✅ ApiService.js → Creado
- ✅ AsignacionesScreen.js → Actualizado
- ✅ DetalleAsignacionScreen.js → Actualizado
- ✅ CameraScreen.js → Actualizado
- ✅ constants/index.js → Creado

**El código está 100% listo. Solo necesitas limpiar el caché del dispositivo.**
