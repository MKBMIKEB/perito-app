@echo off
REM ==============================================================================
REM Script de Build y Despliegue - Perito App (Windows)
REM Genera APK funcional usando EAS Build
REM ==============================================================================

cls
echo ================================================================
echo       📱 PERITO APP - BUILD ^& DEPLOYMENT SCRIPT
echo ================================================================
echo.

REM Obtener directorio del proyecto
set PROJECT_ROOT=%~dp0..
set MOBILE_APP_DIR=%PROJECT_ROOT%\perito-app
set BACKEND_DIR=%PROJECT_ROOT%\backend
set WEB_APP_DIR=%PROJECT_ROOT%\web-coordinador

echo 📂 Directorio del proyecto: %PROJECT_ROOT%
echo.

REM ==============================================================================
REM PASO 1: Verificar instalación de dependencias
REM ==============================================================================
echo ================================================================
echo PASO 1: Verificando dependencias...
echo ================================================================

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js no está instalado
    pause
    exit /b 1
)
echo ✅ Node.js instalado

where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm no está instalado
    pause
    exit /b 1
)
echo ✅ npm instalado

where eas >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  EAS CLI no está instalado. Instalando...
    call npm install -g eas-cli
)
echo ✅ EAS CLI instalado

echo.

REM ==============================================================================
REM PASO 2: Instalar dependencias del backend
REM ==============================================================================
echo ================================================================
echo PASO 2: Instalando dependencias del backend...
echo ================================================================

cd /d "%BACKEND_DIR%"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error instalando dependencias del backend
    pause
    exit /b 1
)
echo ✅ Dependencias del backend instaladas
echo.

REM ==============================================================================
REM PASO 3: Instalar dependencias de la app móvil
REM ==============================================================================
echo ================================================================
echo PASO 3: Instalando dependencias de la app móvil...
echo ================================================================

cd /d "%MOBILE_APP_DIR%"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error instalando dependencias de la app móvil
    pause
    exit /b 1
)
echo ✅ Dependencias de la app móvil instaladas
echo.

REM ==============================================================================
REM PASO 4: Verificar configuración de EAS
REM ==============================================================================
echo ================================================================
echo PASO 4: Verificando configuración de EAS...
echo ================================================================

if not exist "%MOBILE_APP_DIR%\eas.json" (
    echo ⚠️  eas.json no encontrado. Creando configuración...
    call eas build:configure
) else (
    echo ✅ eas.json encontrado
)

echo.

REM ==============================================================================
REM PASO 5: Generar APK con EAS Build
REM ==============================================================================
echo ================================================================
echo PASO 5: Generando APK con EAS Build...
echo ================================================================

echo Selecciona el perfil de build:
echo   1) preview    - APK para pruebas internas (DEFAULT)
echo   2) production - App Bundle para Play Store
echo   3) firebase   - APK para distribución Firebase
echo.
set /p BUILD_CHOICE="Ingresa tu opción [1-3] (default: 1): "

if "%BUILD_CHOICE%"=="2" (
    set PROFILE=production
) else if "%BUILD_CHOICE%"=="3" (
    set PROFILE=firebase-dist
) else (
    set PROFILE=preview
)

echo.
echo 📦 Iniciando build con perfil: %PROFILE%
echo.

REM Ejecutar EAS Build
call eas build --platform android --profile %PROFILE% --non-interactive

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error en el build
    pause
    exit /b 1
)

echo.
echo ================================================================
echo ✅ BUILD COMPLETADO EXITOSAMENTE
echo ================================================================
echo.
echo 📱 El APK ha sido generado y está disponible en EAS.
echo    Usa el siguiente comando para descargar:
echo.
echo    eas build:list
echo.
echo    O descarga desde: https://expo.dev
echo.

REM ==============================================================================
REM PASO 6: Resumen y siguientes pasos
REM ==============================================================================
echo ================================================================
echo 📋 SIGUIENTES PASOS:
echo ================================================================
echo.
echo 1. Descargar el APK desde EAS:
echo    eas build:list
echo.
echo 2. Iniciar el backend:
echo    cd %BACKEND_DIR% ^&^& npm start
echo.
echo 3. Instalar el APK en dispositivo Android
echo.
echo 4. Verificar sincronización y OneDrive
echo.
echo ================================================================
echo       ✅ SCRIPT COMPLETADO EXITOSAMENTE
echo ================================================================
echo.

pause
