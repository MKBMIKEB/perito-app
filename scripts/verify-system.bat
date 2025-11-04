@echo off
REM ==============================================================================
REM Script de Verificación del Sistema - Perito App
REM Verifica que todos los componentes estén correctamente configurados
REM ==============================================================================

cls
echo ================================================================
echo       🔍 PERITO APP - VERIFICACIÓN DEL SISTEMA
echo ================================================================
echo.

set PROJECT_ROOT=%~dp0..
set MOBILE_APP_DIR=%PROJECT_ROOT%\perito-app
set BACKEND_DIR=%PROJECT_ROOT%\backend
set WEB_APP_DIR=%PROJECT_ROOT%\web-coordinador

set PASS_COUNT=0
set FAIL_COUNT=0
set WARN_COUNT=0

echo 📂 Verificando estructura del proyecto...
echo.

REM ==============================================================================
REM 1. Verificar Herramientas Instaladas
REM ==============================================================================
echo ================================================================
echo 1. HERRAMIENTAS INSTALADAS
echo ================================================================

where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%v in ('node --version') do set NODE_VERSION=%%v
    echo ✅ Node.js: %NODE_VERSION%
    set /a PASS_COUNT+=1
) else (
    echo ❌ Node.js NO INSTALADO
    set /a FAIL_COUNT+=1
)

where npm >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%v in ('npm --version') do set NPM_VERSION=%%v
    echo ✅ npm: %NPM_VERSION%
    set /a PASS_COUNT+=1
) else (
    echo ❌ npm NO INSTALADO
    set /a FAIL_COUNT+=1
)

where eas >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ EAS CLI instalado
    set /a PASS_COUNT+=1
) else (
    echo ⚠️  EAS CLI no instalado (requerido para builds)
    set /a WARN_COUNT+=1
)

echo.

REM ==============================================================================
REM 2. Verificar Estructura de Directorios
REM ==============================================================================
echo ================================================================
echo 2. ESTRUCTURA DE DIRECTORIOS
echo ================================================================

if exist "%MOBILE_APP_DIR%" (
    echo ✅ App Móvil: %MOBILE_APP_DIR%
    set /a PASS_COUNT+=1
) else (
    echo ❌ App Móvil NO ENCONTRADA
    set /a FAIL_COUNT+=1
)

if exist "%BACKEND_DIR%" (
    echo ✅ Backend: %BACKEND_DIR%
    set /a PASS_COUNT+=1
) else (
    echo ❌ Backend NO ENCONTRADO
    set /a FAIL_COUNT+=1
)

if exist "%WEB_APP_DIR%" (
    echo ✅ App Web: %WEB_APP_DIR%
    set /a PASS_COUNT+=1
) else (
    echo ❌ App Web NO ENCONTRADA
    set /a FAIL_COUNT+=1
)

echo.

REM ==============================================================================
REM 3. Verificar Archivos de Configuración
REM ==============================================================================
echo ================================================================
echo 3. ARCHIVOS DE CONFIGURACIÓN
echo ================================================================

if exist "%MOBILE_APP_DIR%\package.json" (
    echo ✅ App Móvil: package.json
    set /a PASS_COUNT+=1
) else (
    echo ❌ package.json NO ENCONTRADO en app móvil
    set /a FAIL_COUNT+=1
)

if exist "%MOBILE_APP_DIR%\eas.json" (
    echo ✅ App Móvil: eas.json
    set /a PASS_COUNT+=1
) else (
    echo ⚠️  eas.json no encontrado (se puede generar)
    set /a WARN_COUNT+=1
)

if exist "%MOBILE_APP_DIR%\app.json" (
    echo ✅ App Móvil: app.json
    set /a PASS_COUNT+=1
) else (
    echo ❌ app.json NO ENCONTRADO
    set /a FAIL_COUNT+=1
)

if exist "%BACKEND_DIR%\package.json" (
    echo ✅ Backend: package.json
    set /a PASS_COUNT+=1
) else (
    echo ❌ package.json NO ENCONTRADO en backend
    set /a FAIL_COUNT+=1
)

if exist "%BACKEND_DIR%\.env" (
    echo ✅ Backend: .env
    set /a PASS_COUNT+=1
) else (
    echo ⚠️  .env no encontrado en backend (usar .env.example)
    set /a WARN_COUNT+=1
)

echo.

REM ==============================================================================
REM 4. Verificar Servicios Principales
REM ==============================================================================
echo ================================================================
echo 4. SERVICIOS PRINCIPALES
echo ================================================================

if exist "%BACKEND_DIR%\server.js" (
    echo ✅ Backend: server.js
    set /a PASS_COUNT+=1
) else (
    echo ❌ server.js NO ENCONTRADO
    set /a FAIL_COUNT+=1
)

if exist "%BACKEND_DIR%\routes\sync.js" (
    echo ✅ Backend: Endpoint de sincronización
    set /a PASS_COUNT+=1
) else (
    echo ❌ Endpoint de sincronización NO ENCONTRADO
    set /a FAIL_COUNT+=1
)

if exist "%BACKEND_DIR%\services\onedriveService.js" (
    echo ✅ Backend: Servicio de OneDrive
    set /a PASS_COUNT+=1
) else (
    echo ❌ Servicio de OneDrive NO ENCONTRADO
    set /a FAIL_COUNT+=1
)

if exist "%MOBILE_APP_DIR%\src\services\SyncService.js" (
    echo ✅ App Móvil: Servicio de Sincronización
    set /a PASS_COUNT+=1
) else (
    echo ❌ Servicio de Sincronización NO ENCONTRADO
    set /a FAIL_COUNT+=1
)

if exist "%MOBILE_APP_DIR%\src\services\DatabaseService-native.js" (
    echo ✅ App Móvil: Base de datos SQLite
    set /a PASS_COUNT+=1
) else (
    echo ❌ DatabaseService NO ENCONTRADO
    set /a FAIL_COUNT+=1
)

echo.

REM ==============================================================================
REM 5. Verificar Dependencias Instaladas
REM ==============================================================================
echo ================================================================
echo 5. DEPENDENCIAS INSTALADAS
echo ================================================================

if exist "%MOBILE_APP_DIR%\node_modules" (
    echo ✅ App Móvil: node_modules existe
    set /a PASS_COUNT+=1
) else (
    echo ⚠️  App Móvil: node_modules no encontrado (ejecutar npm install)
    set /a WARN_COUNT+=1
)

if exist "%BACKEND_DIR%\node_modules" (
    echo ✅ Backend: node_modules existe
    set /a PASS_COUNT+=1
) else (
    echo ⚠️  Backend: node_modules no encontrado (ejecutar npm install)
    set /a WARN_COUNT+=1
)

echo.

REM ==============================================================================
REM 6. Verificar Configuración de Android
REM ==============================================================================
echo ================================================================
echo 6. CONFIGURACIÓN DE ANDROID
echo ================================================================

if exist "%MOBILE_APP_DIR%\android\app\src\main\AndroidManifest.xml" (
    echo ✅ AndroidManifest.xml encontrado
    set /a PASS_COUNT+=1
) else (
    echo ❌ AndroidManifest.xml NO ENCONTRADO
    set /a FAIL_COUNT+=1
)

if exist "%MOBILE_APP_DIR%\android\build.gradle" (
    echo ✅ build.gradle encontrado
    set /a PASS_COUNT+=1
) else (
    echo ❌ build.gradle NO ENCONTRADO
    set /a FAIL_COUNT+=1
)

echo.

REM ==============================================================================
REM RESUMEN
REM ==============================================================================
echo ================================================================
echo 📊 RESUMEN DE VERIFICACIÓN
echo ================================================================
echo.
echo ✅ Verificaciones Exitosas: %PASS_COUNT%
echo ⚠️  Advertencias:           %WARN_COUNT%
echo ❌ Verificaciones Fallidas: %FAIL_COUNT%
echo.

if %FAIL_COUNT% GTR 0 (
    echo ❌ EL SISTEMA TIENE PROBLEMAS CRÍTICOS
    echo    Revisa los errores anteriores y corrígelos antes de continuar.
    echo.
) else if %WARN_COUNT% GTR 0 (
    echo ⚠️  EL SISTEMA ESTÁ FUNCIONAL CON ADVERTENCIAS
    echo    Algunas configuraciones opcionales faltan.
    echo.
) else (
    echo ✅ EL SISTEMA ESTÁ COMPLETAMENTE CONFIGURADO
    echo    Listo para build y deployment!
    echo.
)

echo ================================================================
echo 📋 PRÓXIMOS PASOS RECOMENDADOS:
echo ================================================================
echo.
echo 1. Si hay errores críticos, instala las dependencias:
echo    cd %MOBILE_APP_DIR% ^&^& npm install
echo    cd %BACKEND_DIR% ^&^& npm install
echo.
echo 2. Configura variables de entorno:
echo    Copia %BACKEND_DIR%\.env.example a .env
echo    Configura credenciales de Azure y SQL
echo.
echo 3. Ejecuta el build:
echo    .\scripts\build-apk.bat
echo.
echo 4. Inicia el backend:
echo    cd %BACKEND_DIR% ^&^& npm start
echo.
echo ================================================================
echo.

pause
