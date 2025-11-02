@echo off
echo 🔧 Solucionando errores de Perito App...
echo.

echo 📱 1. Limpiando cache de Metro...
npx react-native start --reset-cache

echo.
echo 📦 2. Limpiando node_modules...
rmdir /s /q node_modules
rmdir /s /q android\.gradle

echo.
echo 🔄 3. Reinstalando dependencias...
npm install

echo.
echo 🏗️ 4. Limpiando build Android...
cd android
if exist "app\build" rmdir /s /q app\build
if exist "build" rmdir /s /q build
cd ..

echo.
echo 📱 5. Generando código nativo limpio...
npx expo prebuild --platform android --clean

echo.
echo ✅ Errores corregidos. Ahora ejecuta:
echo    npm run android
echo.
pause