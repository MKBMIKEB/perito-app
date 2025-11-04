@echo off
echo Configurando variables de entorno para Android...

REM Configurar JAVA_HOME
set JAVA_HOME=C:\Program Files\Java\jdk-11
echo JAVA_HOME=%JAVA_HOME%

REM Configurar ANDROID_HOME
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
echo ANDROID_HOME=%ANDROID_HOME%

REM Agregar al PATH
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%PATH%
echo PATH actualizado

echo.
echo Variables configuradas. Reinicia tu terminal.
pausedc