@echo off
echo 🔽 Descargando Java JDK 11...
echo.

echo Este script te ayudará a instalar Java JDK 11
echo.
echo 📋 Opciones disponibles:
echo.
echo 1️⃣  OPCIÓN 1 - Descarga automática con PowerShell
echo 2️⃣  OPCIÓN 2 - Abrir página de descarga manual
echo 3️⃣  OPCIÓN 3 - Usar Chocolatey (si está instalado)
echo.

set /p choice="Elige una opción (1, 2, o 3): "

if "%choice%"=="1" (
    echo.
    echo 🔽 Descargando Java JDK 11 con PowerShell...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://download.java.net/java/GA/jdk11/9/GPL/openjdk-11.0.2_windows-x64_bin.zip' -OutFile 'jdk-11.zip'}"
    
    if exist jdk-11.zip (
        echo ✅ Descarga completada!
        echo 📦 Extrayendo archivos...
        powershell -Command "& {Expand-Archive -Path 'jdk-11.zip' -DestinationPath 'C:\Java\' -Force}"
        echo.
        echo ✅ Java instalado en C:\Java\jdk-11.0.2\
        echo 🔧 Configurando variables de entorno...
        setx JAVA_HOME "C:\Java\jdk-11.0.2" /M
        setx PATH "%PATH%;C:\Java\jdk-11.0.2\bin" /M
        echo.
        echo ✅ ¡Java JDK 11 instalado correctamente!
    ) else (
        echo ❌ Error en la descarga
    )
    
) else if "%choice%"=="2" (
    echo.
    echo 🌐 Abriendo página de descarga...
    start https://www.oracle.com/java/technologies/downloads/#java11-windows
    echo.
    echo 📋 Instrucciones:
    echo 1. Descarga: Windows x64 Installer
    echo 2. Ejecuta el archivo .exe descargado  
    echo 3. Instala con configuración por defecto
    echo 4. Ejecuta verify-java.bat para verificar
    
) else if "%choice%"=="3" (
    echo.
    echo 🍫 Instalando con Chocolatey...
    choco install openjdk11 -y
    if %errorlevel%==0 (
        echo ✅ Java instalado con Chocolatey!
    ) else (
        echo ❌ Chocolatey no está disponible o falló
        echo 💡 Usa la opción 1 o 2
    )
    
) else (
    echo ❌ Opción no válida
)

echo.
echo 🔍 Para verificar la instalación, ejecuta: verify-java.bat
echo.
pause