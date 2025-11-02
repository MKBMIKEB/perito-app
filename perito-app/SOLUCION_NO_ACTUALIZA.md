# ❌ Solución: La App No Se Actualiza en el Móvil

## 🔍 Diagnóstico: ¿Cómo tienes instalada la app?

### Opción A: Instalada con Expo Go
Si estás usando la app **Expo Go** (escaneando QR):

### Opción B: APK Instalado
Si instalaste un **APK** (archivo .apk descargado):

---

## 📱 SOLUCIÓN SEGÚN TU CASO

### ✅ Si usas EXPO GO (escaneando QR)

**Las actualizaciones OTA NO funcionan con Expo Go en desarrollo.**

#### Solución:
1. **Simplemente reinicia el servidor:**
   ```bash
   # Para el servidor actual (Ctrl + C)
   npm run start:dev
   ```

2. **Vuelve a escanear el QR** en tu móvil

3. **¡Listo!** Verás los cambios inmediatamente


### 🔧 Si tienes APK INSTALADO (build de EAS)

**Las actualizaciones OTA SÍ funcionan, pero hay que configurarlas correctamente.**

#### Paso 1: Verificar que tengas expo-updates instalado
```bash
npm list expo-updates
```

Si NO aparece, instálalo:
```bash
npm install expo-updates
```

#### Paso 2: Limpiar e instalar dependencias
```bash
# Limpiar
rm -rf node_modules
npm install

# Instalar dependencia faltante
npm install expo-image-manipulator
```

#### Paso 3: Publicar la actualización correctamente
```bash
# Opción 1: Para canal preview
npx eas update --branch preview --message "Sistema fotos GPS v1.1.0"

# Opción 2: Para canal production
npx eas update --branch production --message "Sistema fotos GPS v1.1.0"
```

⚠️ **IMPORTANTE:** Usa el mismo canal que usaste al hacer el build APK.

#### Paso 4: Verificar en el móvil
1. **Cierra completamente la app** (mata el proceso)
2. **Abre la app de nuevo**
3. Espera 5-10 segundos en la pantalla de inicio
4. La app debería descargar y aplicar el update

---

## 🚨 Si NADA Funciona: Generar Nuevo APK

Si las actualizaciones OTA no funcionan o necesitas los cambios inmediatamente:

### Paso 1: Reinstalar dependencias
```bash
cd "c:\Users\MichaelRamirez\OneDrive - INGENIERIA LEGAL SAS\Documentos\perito-app\perito-app"

# Limpiar todo
rm -rf node_modules
npm install

# Instalar dependencia nueva
npm install expo-image-manipulator
```

### Paso 2: Incrementar versionCode
Abre `app.json` y actualiza:
```json
{
  "expo": {
    "version": "1.1.0",
    "android": {
      "versionCode": 2  // ← Asegúrate que sea 2 (o mayor que la anterior)
    }
  }
}
```

### Paso 3: Build nuevo APK
```bash
npx eas build --platform android --profile preview --clear-cache
```

Esto tomará 10-15 minutos.

### Paso 4: Descargar e instalar
1. Descarga el APK del link que aparece
2. Desinstala la app anterior de tu móvil
3. Instala el nuevo APK
4. ¡Listo! Tendrás todas las nuevas funcionalidades

---

## 🎯 SOLUCIÓN RÁPIDA RECOMENDADA

### Si usas Expo Go:
```bash
# Para el servidor (Ctrl+C)
npm run start:dev
# Escanea el QR de nuevo
```

### Si tienes APK instalado:
```bash
# Limpiar e instalar
rm -rf node_modules
npm install
npm install expo-image-manipulator

# Build nuevo APK
npx eas build --platform android --profile preview
```

---

## 📊 Verificar Estado

### 1. Ver qué canal usó tu build
```bash
npx eas build:list --platform android --limit 1
```

Busca la línea `channel: preview` o `channel: production`

### 2. Ver updates publicados
```bash
# Para preview
npx eas update:list --branch preview

# Para production  
npx eas update:list --branch production
```

---

## ⚡ Testing Inmediato

Si necesitas probar AHORA sin esperar builds:

```bash
# Opción 1: Desarrollo con Expo Go
npm run start:dev
# Escanea el QR en tu móvil con Expo Go

# Opción 2: Ejecutar en emulador Android
npm run android
```

---

## 🛠️ Comandos de Limpieza

Si tienes errores de módulos:

```bash
# Limpieza completa
rm -rf node_modules
rm -rf .expo
rm package-lock.json
npm cache clean --force
npm install
```

---

## ✅ Checklist de Solución

```
☐ ¿Usas Expo Go o APK?
  
  Si Expo Go:
    ☐ npm run start:dev
    ☐ Escanear QR de nuevo
    ☐ ¡Listo!
  
  Si APK:
    ☐ rm -rf node_modules
    ☐ npm install
    ☐ npm install expo-image-manipulator
    ☐ Verificar versionCode en app.json
    ☐ npx eas build --platform android --profile preview
    ☐ Descargar e instalar nuevo APK
    ☐ ¡Listo!
```

---

## 📞 Contacto de Emergencia

Si nada funciona:

1. **Verifica logs:**
   ```bash
   npx expo start --clear
   ```
   Mira los errores en la consola

2. **Verifica que la app esté conectada:**
   Abre la app y verifica en la esquina si dice "Connected" o "Disconnected"

3. **Último recurso: Build limpio**
   ```bash
   rm -rf node_modules .expo
   npm install
   npx eas build --platform android --profile preview --clear-cache
   ```

---

## 🎉 Resultado Esperado

Después de aplicar la solución correcta, deberías ver en tu móvil:

✅ Botón "Mis Fotos" en HomeScreen
✅ Pantalla de cámara con indicador GPS
✅ Pantalla de gestión de fotos
✅ Todas las nuevas funcionalidades

