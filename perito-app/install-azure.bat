@echo off
echo ================================================
echo Instalando dependencias de Azure para React Native
echo ================================================

cd "c:\Users\MichaelRamirez\OneDrive - INGENIERIA LEGAL SAS\Documentos\perito-app\perito-app"

echo.
echo [1/3] Instalando @azure/msal-react-native...
call npm install @azure/msal-react-native

echo.
echo [2/3] Instalando react-native-inappbrowser-reborn (para autenticación)...
call npm install react-native-inappbrowser-reborn

echo.
echo [3/3] Instalando axios para llamadas HTTP...
call npm install axios

echo.
echo ================================================
echo ✅ Dependencias instaladas correctamente
echo ================================================
echo.
echo Ahora puedes ejecutar: npm start
pause
