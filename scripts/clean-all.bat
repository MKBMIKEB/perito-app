@echo off
echo ========================================
echo LIMPIEZA COMPLETA DEL PROYECTO
echo ========================================
echo.

cd /d "%~dp0\..\perito-app"

echo [1/6] Deteniendo procesos Node...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/6] Eliminando node_modules...
if exist node_modules rmdir /s /q node_modules

echo [3/6] Eliminando cache de Metro...
if exist .expo rmdir /s /q .expo

echo [4/6] Eliminando package-lock.json...
if exist package-lock.json del /f /q package-lock.json

echo [5/6] Reinstalando dependencias...
call npm install

echo [6/6] Limpiando cache de Expo...
call npx expo start --clear --no-dev --minify

echo.
echo ========================================
echo LIMPIEZA COMPLETADA
echo ========================================
echo Ahora escanea el QR con Expo Go
echo.
pause
