@echo off
echo ========================================
echo  PUBLICAR ACTUALIZACION - Perito App
echo  Sistema de Fotos GPS v1.1.0
echo ========================================
echo.

echo [1/3] Verificando sistema...
node verify-setup.js
if %errorlevel% neq 0 (
    echo.
    echo ERROR: El sistema tiene problemas. Revisa los errores arriba.
    pause
    exit /b 1
)

echo.
echo [2/3] Instalando dependencia opcional...
call npm install expo-image-manipulator

echo.
echo ========================================
echo  OPCIONES DE ACTUALIZACION
echo ========================================
echo.
echo 1. Actualizacion OTA (RAPIDO - 2 min)
echo    - Los usuarios obtienen el update al abrir la app
echo    - No necesitan reinstalar
echo    - Recomendado para cambios de codigo
echo.
echo 2. Build APK para Firebase (LENTO - 15 min)
echo    - Genera nuevo APK
echo    - Los usuarios deben reinstalar
echo    - Para cambios nativos o primera distribucion
echo.

set /p opcion="Elige opcion (1 o 2): "

if "%opcion%"=="1" goto ota
if "%opcion%"=="2" goto build
echo Opcion invalida.
pause
exit /b 1

:ota
echo.
echo [3/3] Publicando actualizacion OTA...
echo.
set /p mensaje="Mensaje de actualizacion (Enter para usar default): "
if "%mensaje%"=="" set mensaje=Sistema de fotos GPS agregado - v1.1.0

echo.
echo Publicando a canal 'preview'...
call npx eas update --branch preview --message "%mensaje%"

echo.
echo ========================================
echo  ACTUALIZACION COMPLETADA!
echo ========================================
echo.
echo Los usuarios recibiran la actualizacion al:
echo 1. Cerrar la app completamente
echo 2. Abrirla de nuevo
echo.
echo Para verificar:
echo   npx eas update:list --branch preview
echo.
pause
exit /b 0

:build
echo.
echo [3/3] Iniciando build APK...
echo.
echo IMPORTANTE: Este proceso toma 10-15 minutos.
echo.
pause

echo.
echo Iniciando build para Firebase Distribution...
call npx eas build --platform android --profile firebase-dist

echo.
echo ========================================
echo  BUILD COMPLETADO!
echo ========================================
echo.
echo Siguiente paso:
echo 1. Descarga el APK del link que aparecio arriba
echo 2. Ve a Firebase Console: https://console.firebase.google.com
echo 3. App Distribution > Distribute app
echo 4. Sube el APK y distribuye a testers
echo.
pause
exit /b 0
