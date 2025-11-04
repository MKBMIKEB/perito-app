#!/bin/bash

# ==============================================================================
# Script de Build y Despliegue - Perito App
# Genera APK funcional usando EAS Build
# ==============================================================================

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║      📱 PERITO APP - BUILD & DEPLOYMENT SCRIPT           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directorios
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE_APP_DIR="$PROJECT_ROOT/perito-app"
BACKEND_DIR="$PROJECT_ROOT/backend"
WEB_APP_DIR="$PROJECT_ROOT/web-coordinador"

echo -e "${BLUE}📂 Directorio del proyecto:${NC} $PROJECT_ROOT"
echo ""

# ==============================================================================
# PASO 1: Verificar instalación de dependencias
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASO 1: Verificando dependencias...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js:${NC} $(node --version)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm:${NC} $(npm --version)"

# Verificar EAS CLI
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}⚠️  EAS CLI no está instalado. Instalando...${NC}"
    npm install -g eas-cli
fi
echo -e "${GREEN}✅ EAS CLI:${NC} $(eas --version)"

echo ""

# ==============================================================================
# PASO 2: Instalar dependencias del backend
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASO 2: Instalando dependencias del backend...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

cd "$BACKEND_DIR"
npm install
echo -e "${GREEN}✅ Dependencias del backend instaladas${NC}"
echo ""

# ==============================================================================
# PASO 3: Instalar dependencias de la app móvil
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASO 3: Instalando dependencias de la app móvil...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

cd "$MOBILE_APP_DIR"
npm install
echo -e "${GREEN}✅ Dependencias de la app móvil instaladas${NC}"
echo ""

# ==============================================================================
# PASO 4: Verificar configuración de EAS
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASO 4: Verificando configuración de EAS...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

if [ ! -f "$MOBILE_APP_DIR/eas.json" ]; then
    echo -e "${YELLOW}⚠️  eas.json no encontrado. Creando configuración...${NC}"
    eas build:configure
else
    echo -e "${GREEN}✅ eas.json encontrado${NC}"
fi

echo ""

# ==============================================================================
# PASO 5: Generar APK con EAS Build
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASO 5: Generando APK con EAS Build...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}Selecciona el perfil de build:${NC}"
echo "  1) preview    - APK para pruebas internas"
echo "  2) production - App Bundle para Play Store"
echo "  3) firebase   - APK para distribución Firebase"
echo ""
read -p "Ingresa tu opción [1-3] (default: 1): " BUILD_PROFILE

case $BUILD_PROFILE in
    2)
        PROFILE="production"
        ;;
    3)
        PROFILE="firebase-dist"
        ;;
    *)
        PROFILE="preview"
        ;;
esac

echo -e "${BLUE}📦 Iniciando build con perfil:${NC} $PROFILE"
echo ""

# Ejecutar EAS Build
eas build --platform android --profile $PROFILE --non-interactive

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ BUILD COMPLETADO EXITOSAMENTE${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}📱 El APK ha sido generado y está disponible en EAS.${NC}"
    echo -e "${BLUE}   Usa el siguiente comando para descargar:${NC}"
    echo ""
    echo -e "${YELLOW}   eas build:list${NC}"
    echo ""
    echo -e "${BLUE}   O descarga desde:${NC} https://expo.dev"
    echo ""
else
    echo -e "${RED}❌ Error en el build${NC}"
    exit 1
fi

# ==============================================================================
# PASO 6: Resumen y siguientes pasos
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 SIGUIENTES PASOS:${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "1. Descargar el APK desde EAS:"
echo "   ${YELLOW}eas build:list${NC}"
echo ""
echo "2. Iniciar el backend:"
echo "   ${YELLOW}cd $BACKEND_DIR && npm start${NC}"
echo ""
echo "3. Instalar el APK en dispositivo Android"
echo ""
echo "4. Verificar sincronización y OneDrive"
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      ✅ SCRIPT COMPLETADO EXITOSAMENTE                    ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
