# 📱 Pasos para Desplegar la App Móvil con Azure AD

## ✅ Cambios Realizados

1. ✅ Servicios Azure creados (ApiService, AzureAuthService)
2. ✅ LoginScreen actualizado con Azure AD
3. ✅ AsignacionesScreen actualizado
4. ✅ DetalleAsignacionScreen actualizado
5. ✅ CameraScreen actualizado
6. ✅ App.js actualizado con nueva navegación
7. ✅ Constants creados

---

## 🔄 Para Ver los Cambios

### Opción 1: Reiniciar Expo (Recomendado)

```bash
# 1. Detener Expo actual (Ctrl+C)

# 2. Limpiar cache de Expo
cd perito-app
npx expo start --clear

# 3. En tu dispositivo/emulador:
#    - Cerrar completamente la app
#    - Abrir nuevamente desde Expo Go
```

### Opción 2: Reload en el Dispositivo

Si Expo ya está corriendo:

1. **Android**: Presiona `R` dos veces rápidamente
2. **iOS**: Presiona `Cmd + R` o agita el dispositivo y selecciona "Reload"

---

## 🚨 Problemas Comunes

### Problema: "No se puede importar AzureAuthService"

**Causa**: Cache de Metro Bundler desactualizado

**Solución**:
```bash
# Detener Expo (Ctrl+C)
npx expo start --clear
```

### Problema: "Sigue mostrando login con cédula"

**Causa**: La app no recargó los cambios

**Solución**:
1. Cerrar completamente la app en el dispositivo
2. En terminal: `npx expo start --clear`
3. Escanear QR code nuevamente

### Problema: "Error: react-native-msal not found"

**Causa**: Dependencias no instaladas

**Solución**:
```bash
cd perito-app
npm install
npx expo start --clear
```

---

## 📝 Verificar que Funcione

Cuando abras la app deberías ver:

1. ✅ Pantalla de carga: "Azure Integration v2.0"
2. ✅ LoginScreen con botón "Iniciar Sesión con Microsoft"
3. ✅ **NO** debe pedir cédula/contraseña

Si ves el campo de cédula, significa que la app no recargó los cambios.

---

## 🔐 Configuración MSAL (Próximo Paso)

⚠️ **IMPORTANTE**: Para que el login con Microsoft funcione en dispositivo real, necesitas configurar MSAL nativo:

### Android:
1. Editar `android/app/src/main/AndroidManifest.xml`
2. Agregar configuración de BrowserTabActivity
3. Generar signature hash

### iOS:
1. Editar `ios/PeritoApp/Info.plist`
2. Agregar URL scheme
3. Ejecutar `cd ios && pod install`

Ver documentación completa en: [docs/INTEGRACION_AZURE.md](docs/INTEGRACION_AZURE.md)

---

## 📱 Testing Rápido (Sin MSAL)

Si quieres probar el flujo sin configurar MSAL nativo:

1. **Expo Go en navegador**: `npx expo start` → presiona `W`
2. Esto abrirá en navegador web donde MSAL funciona sin configuración nativa

---

## 🎯 Comandos Útiles

```bash
# Limpiar cache completo
npx expo start --clear

# Reinstalar dependencias
rm -rf node_modules
npm install
npx expo start --clear

# Ver logs en tiempo real
npx react-native log-android  # Android
npx react-native log-ios       # iOS

# Verificar dependencias instaladas
npm list react-native-msal
npm list axios
```

---

## 📊 Estado Actual

- ✅ Backend funcionando en http://localhost:5000
- ✅ Base de datos Azure SQL configurada
- ✅ OneDrive integrado
- ✅ Código móvil actualizado
- ⏳ Pendiente: Recargar app en dispositivo
- ⏳ Pendiente: Configuración MSAL nativa (opcional para testing)

---

## 💡 Próximos Pasos Recomendados

1. **Ahora**: Reiniciar Expo con `npx expo start --clear`
2. **Luego**: Probar login en navegador web (`W` en Expo)
3. **Después**: Configurar MSAL nativo para dispositivos móviles
4. **Finalmente**: Deploy backend a Azure App Service

---

¿Preguntas? Revisa [docs/INTEGRACION_AZURE.md](docs/INTEGRACION_AZURE.md)
