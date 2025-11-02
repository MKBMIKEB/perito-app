@echo off
echo Verificando instalación de Java...
echo.

echo ===== JAVA VERSION =====
java -version
echo.

echo ===== JAVA_HOME =====
echo %JAVA_HOME%
echo.

echo ===== JAVAC (Compiler) =====
javac -version
echo.

if %ERRORLEVEL% EQU 0 (
    echo ✅ Java está correctamente instalado!
) else (
    echo ❌ Java no está instalado correctamente
    echo Asegúrate de:
    echo 1. Instalar Java JDK 11
    echo 2. Configurar JAVA_HOME
    echo 3. Reiniciar la terminal
)
echo.
pause