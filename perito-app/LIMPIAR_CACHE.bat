@echo off
echo ========================================
echo   LIMPIANDO CACHE COMPLETO DE EXPO
echo ========================================
echo.

echo [1/5] Deteniendo procesos de Expo...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo [2/5] Eliminando cache de Metro Bundler...
rd /s /q .expo 2>nul
rd /s /q .expo-shared 2>nul

echo [3/5] Eliminando cache de Node...
rd /s /q node_modules\.cache 2>nul

echo [4/5] Eliminando archivos temporales...
del /f /q package-lock.json 2>nul

echo [5/5] Reinstalando dependencias...
call npm install

echo.
echo ========================================
echo   CACHE LIMPIADO EXITOSAMENTE
echo ========================================
echo.
echo Ahora ejecuta: npx expo start
echo.
pause
