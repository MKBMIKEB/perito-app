# 🔧 SOLUCIÓN: Error al abrir app en Android

## ❌ ERROR:
```
CommandError: Activity not started, unable to resolve Intent
{ act=android.intent.action.VIEW dat=exp+perito-app://expo-development-client/... }
```

## 🔍 CAUSA:
La app no está instalada en el dispositivo Android o el esquema de URL no está configurado correctamente.

---

## ✅ SOLUCIONES

### **OPCIÓN 1: Usar Expo Go (Más rápido para desarrollo)**

1. **Instalar Expo Go en tu dispositivo Android:**
   - Abre Google Play Store
   - Busca "Expo Go"
   - Instalar

2. **Escanear el QR:**
   ```bash
   cd perito-app
   npm start
   # Escanea el QR con Expo Go
   ```

3. **O conectar por URL:**
   - En Expo Go → "Enter URL manually"
   - Ingresa: `exp://127.0.0.1:8081`

---

### **OPCIÓN 2: Construir APK de desarrollo**

```bash
cd perito-app

# Build de desarrollo
npx expo run:android

# Esto:
# 1. Instala dependencias de Android
# 2. Compila la app
# 3. Instala en el dispositivo conectado
# 4. Abre la app automáticamente
```

**Requisitos:**
- Android Studio instalado
- SDK de Android configurado
- Dispositivo conectado por USB o emulador corriendo

---

### **OPCIÓN 3: Build APK para instalar manualmente**

```bash
cd perito-app

# Para Android (APK)
eas build --platform android --profile development

# O para preview (no requiere EAS)
npx expo export:android
```

---

### **OPCIÓN 4: Limpiar y reiniciar (Si ya tenías la app)**

```bash
cd perito-app

# Limpiar cache
npx expo start -c

# O reiniciar completamente
rm -rf .expo
rm -rf node_modules/.cache
npm start
```

---

## 🚀 SOLUCIÓN RÁPIDA (RECOMENDADA):

### **Usar Expo Go:**

1. **En el dispositivo Android:**
   - Instala "Expo Go" desde Play Store

2. **En tu computadora:**
   ```bash
   cd perito-app
   npm start
   ```

3. **Escanea el QR con Expo Go**

4. **¡Listo!** La app se cargará en Expo Go

---

## ⚠️ IMPORTANTE:

Si estás usando módulos nativos que NO son soportados por Expo Go:
- `react-native-app-auth` → NO funciona en Expo Go
- Necesitas construir APK de desarrollo

Para OAuth 2.0, tienes 2 opciones:
1. **Usar `expo-auth-session`** (funciona en Expo Go) ✅
2. **Build APK de desarrollo** con `npx expo run:android`

---

## 📱 VERIFICAR APP.JSON

Asegúrate de que `app.json` tenga el esquema correcto:

```json
{
  "expo": {
    "scheme": "peritoapp",
    "android": {
      "package": "com.ingenierialegal.peritoapp",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

---

## 🔧 TROUBLESHOOTING

### Error: "Metro bundler not found"
```bash
npm install -g @expo/cli
```

### Error: "Android SDK not found"
- Instala Android Studio
- Configura ANDROID_HOME en variables de entorno

### Error: "Device not found"
```bash
# Verifica dispositivo conectado
adb devices

# Si no aparece, habilita USB debugging en el dispositivo
```

---

## 📊 RESUMEN

**Para desarrollo rápido:** Usa **Expo Go** ✅

**Para OAuth 2.0:** Usa **expo-auth-session** (funciona en Expo Go)

**Para producción:** Construye APK con `eas build` o `npx expo run:android`

---

## 🎯 PRÓXIMO PASO

```bash
# 1. Instalar Expo Go en el dispositivo
# 2. En tu PC:
cd perito-app
npm start

# 3. Escanear QR con Expo Go
# 4. ¡Empezar a probar!
```

**¡Listo para desarrollar!** 🚀
