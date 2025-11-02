# 🔵 Guía de Configuración Azure para Perito App

Esta guía te ayudará a configurar todos los servicios de Azure necesarios para migrar tu aplicación desde Firebase.

**IMPORTANTE:** Esta guía usa **Azure Cosmos DB for MongoDB (vCore)** que te da compatibilidad total con MongoDB.

---

## 📋 Requisitos Previos

- Cuenta de Microsoft Azure (puedes crear una cuenta gratuita en https://azure.microsoft.com/free/)
- Suscripción activa de Azure
- Node.js y npm instalados
- Acceso al Portal de Azure (https://portal.azure.com)

---

## 🎯 Servicios Azure Necesarios

1. **Azure Cosmos DB for MongoDB (vCore)** - Base de datos MongoDB totalmente compatible (reemplazo de Firestore)
2. **Azure Blob Storage** - Almacenamiento de fotos (reemplazo de Firebase Storage)
3. **Azure AD B2C** (Opcional) - Autenticación de usuarios

---

## 🚀 Paso 1: Crear Azure Cosmos DB for MongoDB (vCore)

### 1.1 Acceder al Portal de Azure

1. Ve a https://portal.azure.com
2. Inicia sesión con tu cuenta de Microsoft

### 1.2 Crear Cosmos DB for MongoDB

1. Haz clic en **"Create a resource"** (Crear un recurso)
2. Busca **"Azure Cosmos DB for MongoDB"**
3. Selecciona **"Azure Cosmos DB for MongoDB (vCore)"**
4. Haz clic en **"Create"**

### 1.3 Configurar Cosmos DB for MongoDB (vCore)

Completa el formulario con los siguientes datos:

**Basics:**
- **Subscription**: Selecciona tu suscripción de Azure
- **Resource Group**: Crea uno nuevo llamado `perito-app-rg`
- **Cluster Name**: `perito-app-mongo` (debe ser único globalmente)
- **Location**: Selecciona la región más cercana (ej: `East US`, `Brazil South`, `West Europe`)
- **MongoDB version**: **6.0** (más reciente)
- **Cluster tier**: **M10** para desarrollo (o **Free tier** si está disponible)

**Administrator account:**
- **Username**: `peritoadmin` (o el que prefieras)
- **Password**: Crea una contraseña segura y guárdala

**Networking:**
- **Connectivity method**: **Public endpoint (allowed IP addresses)**
- **Add current client IP address**: ✅ Marca esta opción

4. Haz clic en **"Review + Create"** y luego **"Create"**
5. Espera 10-15 minutos a que se complete el despliegue (MongoDB vCore tarda un poco más)

### 1.4 Obtener Connection String

1. Una vez creado, ve a tu cluster de MongoDB
2. En el menú lateral, haz clic en **"Connection strings"**
3. Copia el **"Primary Connection String"**
4. Se verá así:
   ```
   mongodb://peritoadmin:TU_PASSWORD@perito-app-mongo.mongocluster.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000
   ```
5. Reemplaza `TU_PASSWORD` con tu contraseña

### 1.5 Configurar Firewall (Importante)

1. En tu cluster, ve a **"Networking"**
2. En **"Firewall rules"**, asegúrate de tener:
   - ✅ Tu IP actual
   - ✅ IP de tu servidor de producción (cuando despliegues)
3. Para desarrollo, puedes marcar **"Allow access from Azure services"**
4. Guarda los cambios

### 1.6 Crear Base de Datos y Colecciones

Las colecciones se crearán automáticamente cuando ejecutes el script de inicialización.

O puedes crearlas manualmente:

1. Ve a **"Data Explorer"** en el menú lateral
2. Haz clic en **"New Database"**
3. Nombre: `PeritoAppDB`
4. Crea las siguientes colecciones:
   - `peritos`
   - `casos`
   - `formularios`

---

## 📦 Paso 2: Crear Azure Blob Storage

### 2.1 Crear Cuenta de Storage

1. En el Portal de Azure, haz clic en **"Create a resource"**
2. Busca **"Storage account"**
3. Haz clic en **"Create"**

### 2.2 Configurar Storage Account

- **Resource Group**: Selecciona `perito-app-rg` (el mismo que Cosmos DB)
- **Storage account name**: `peritoappstorage` (debe ser único, solo minúsculas y números)
- **Location**: La misma región que Cosmos DB
- **Performance**: **Standard**
- **Redundancy**: **LRS** (Locally Redundant Storage - más económico)

4. Haz clic en **"Review + Create"** y luego **"Create"**

### 2.3 Crear Contenedor de Blobs

1. Una vez creada la cuenta, ve a ella
2. En el menú lateral, haz clic en **"Containers"**
3. Haz clic en **"+ Container"**
4. Nombre: `fotos-evidencias`
5. Public access level: **Private** (solo acceso autenticado)
6. Haz clic en **"Create"**

### 2.4 Generar SAS Token

1. En tu Storage Account, ve a **"Shared access signature"** en el menú lateral
2. Configura los permisos:
   - ✅ **Read**
   - ✅ **Write**
   - ✅ **Delete**
   - ✅ **List**
   - ✅ **Add**
   - ✅ **Create**
3. Allowed services: ✅ **Blob**
4. Allowed resource types: ✅ **Container**, ✅ **Object**
5. Start time: Fecha actual
6. End time: 1 año desde hoy
7. Haz clic en **"Generate SAS and connection string"**
8. **Copia el SAS token** (empieza con `?sv=...`)

---

## ⚙️ Paso 3: Configurar la Aplicación

### 3.1 Actualizar archivo .env

Crea o edita el archivo `.env` en la raíz de tu proyecto:

```env
# Azure Cosmos DB for MongoDB (vCore)
AZURE_MONGODB_CONNECTION_STRING=mongodb://peritoadmin:TU_PASSWORD@perito-app-mongo.mongocluster.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000
AZURE_MONGODB_DATABASE=PeritoAppDB

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT_NAME=peritoappstorage
AZURE_STORAGE_SAS_TOKEN=TU_SAS_TOKEN_AQUI
AZURE_STORAGE_CONTAINER=fotos-evidencias

NODE_ENV=production
```

**IMPORTANTE:**
- Reemplaza `TU_PASSWORD` en el connection string con tu contraseña de MongoDB
- Reemplaza `TU_SAS_TOKEN_AQUI` con el token de Blob Storage

### 3.2 Actualizar azureConfig.js

Edita el archivo `src/config/azureConfig.js`:

```javascript
export const azureConfig = {
  mongodb: {
    connectionString: process.env.AZURE_MONGODB_CONNECTION_STRING || "mongodb://peritoadmin:PASSWORD@perito-app-mongo.mongocluster.cosmos.azure.com:10255/?ssl=true",
    database: "PeritoAppDB",
    collections: {
      peritos: "peritos",
      casos: "casos",
      formularios: "formularios"
    }
  },
  storage: {
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || "peritoappstorage",
    sasToken: process.env.AZURE_STORAGE_SAS_TOKEN,
    containerName: "fotos-evidencias"
  }
};
```

### 3.3 Instalar Dependencias de Azure

```bash
npm install mongodb@^6.3.0 @azure/storage-blob@^12.17.0 buffer@^6.0.3
```

---

## 📱 Paso 4: Actualizar la App Móvil

### 4.1 Modificar Servicios

Los servicios ya están creados. Solo necesitas reemplazar las importaciones:

**En HomeScreen.js, FormularioCampoScreen.js, etc:**

```javascript
// ANTES (Firebase)
import CasosService from '../services/CasosService';
import AuthService from '../services/AuthService';

// DESPUÉS (Azure MongoDB)
import CasosService from '../services/AzureMongoService';
import AuthService from '../services/AzureMongoAuthService';
```

---

## 🌐 Paso 5: Actualizar Panel Web

### 5.1 Configurar HTML

El archivo `index-azure.html` ya está creado. Ábrelo en tu navegador:

```bash
cd web-coordinador
python -m http.server 8000
```

Luego ve a: http://localhost:8000/index-azure.html

### 5.2 Configurar Credenciales en el Panel

1. En el panel web, ve a la pestaña **"Configuración Azure"**
2. Ingresa:
   - Cosmos DB Endpoint
   - Cosmos DB Primary Key
   - Database ID: `PeritoAppDB`
   - Storage Account Name
   - Storage SAS Token
   - Container Name: `fotos-evidencias`
3. Haz clic en **"Guardar Configuración"**
4. Haz clic en **"Probar Conexión"** para verificar

---

## 🧪 Paso 6: Poblar Datos de Prueba

### 6.1 Configurar Connection String en el Script

1. Abre el archivo `scripts/init-azure-mongodb.js`
2. En la línea 11, reemplaza el connection string con el tuyo:

```javascript
const config = {
  connectionString: "mongodb://peritoadmin:TU_PASSWORD@perito-app-mongo.mongocluster.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000",
  database: "PeritoAppDB",
  // ...
};
```

### 6.2 Ejecutar Script de Inicialización

```bash
node scripts/init-azure-mongodb.js
```

El script creará:
- ✅ 3 peritos de prueba
- ✅ 5 casos de prueba (3 pendientes, 2 asignados)
- ✅ Índices para optimizar consultas
- ✅ Verificación de datos

### 6.3 Credenciales de Prueba

Una vez ejecutado el script, podrás hacer login con:

```
Cédula:   123456789
Password: 123456
```

---

## 🔒 Paso 7: Seguridad y Mejores Prácticas

### 7.1 Proteger Credenciales

**NUNCA** subas el archivo `.env` a Git:

```bash
echo ".env" >> .gitignore
```

### 7.2 Configurar Firewall de MongoDB

Ya lo hiciste en el Paso 1.5, pero verifica:

1. En tu cluster MongoDB, ve a **"Networking"**
2. En **"Firewall rules"**, asegúrate de tener tu IP actual
3. Para producción, agrega solo las IPs necesarias

### 7.3 Habilitar Backup Automático

Azure Cosmos DB for MongoDB hace backups automáticos. Para verificar:

1. Ve a tu cluster de MongoDB
2. Menú lateral → **"Backup"**
3. Los backups se toman automáticamente cada 24 horas
4. Puedes restaurar a cualquier punto en los últimos 7 días

---

## 💰 Paso 8: Optimización de Costos

### 8.1 Cosmos DB for MongoDB (vCore)

**Opciones de tier:**
- **M10** (2 vCores, 2GB RAM): ~$57 USD/mes - Ideal para desarrollo
- **M25** (4 vCores, 8GB RAM): ~$182 USD/mes - Para producción ligera
- **Free Tier**: Si está disponible en tu región, ¡GRATIS para desarrollo!

**Costo estimado para desarrollo**: $0 - $57 USD/mes

### 8.2 Blob Storage

- **Tier**: Hot (para archivos de acceso frecuente)
- **Redundancia**: LRS (la más económica)

**Costo estimado**: $0.02 - $0.50 USD/mes por GB

### 8.3 Créditos Gratuitos

Azure ofrece:
- **$200 USD** en créditos durante los primeros 30 días
- **12 meses gratis** de servicios seleccionados
- Algunos servicios **siempre gratis** en cantidades limitadas

---

## 🧪 Paso 9: Probar la Integración

### 9.1 Probar App Móvil

```bash
cd perito-app
npm install
npx expo start -c
```

Escanea el QR code y verifica:
- ✅ Login funciona
- ✅ Casos se cargan desde Azure
- ✅ Formularios se guardan en Cosmos DB
- ✅ Fotos se suben a Blob Storage

### 9.2 Probar Panel Web

1. Abre http://localhost:8000/index-azure.html
2. Verifica:
   - ✅ Dashboard muestra estadísticas
   - ✅ Puedes crear nuevos casos
   - ✅ Puedes asignar casos a peritos
   - ✅ Los datos se sincronizan con la app móvil

---

## 🐛 Troubleshooting

### Error: "Authentication failed" al conectar a MongoDB

✅ **Solución**:
- Verifica que el connection string tenga la contraseña correcta
- Asegúrate de que no haya caracteres especiales sin codificar en la contraseña
- Verifica que el usuario tenga permisos de lectura/escritura

### Error: "MongoNetworkError" o timeout

✅ **Solución**:
- Verifica que tu IP esté permitida en el Firewall de Azure
- Ve a tu cluster → Networking → Firewall rules
- Agrega tu IP actual con el botón "Add current client IP address"

### Error: "Collection not found"

✅ **Solución**:
- Las colecciones se crean automáticamente al insertar datos
- Ejecuta el script `init-azure-mongodb.js` para crear todo

### Error: "CORS" en el panel web

✅ **Solución**:
- MongoDB no tiene problemas de CORS desde backend
- Si usas desde navegador, necesitarás un proxy

### Fotos no se suben a Blob Storage

✅ **Solución**:
- Verifica que el SAS token tenga permisos de Write
- Verifica que el token no haya expirado
- Revisa que el nombre del contenedor sea correcto

### Script init-azure-mongodb.js falla

✅ **Solución**:
- Verifica que el connection string esté correcto (línea 11)
- Asegúrate de tener instalado: `npm install mongodb`
- Verifica que el cluster esté activo en Azure Portal

---

## 📚 Recursos Adicionales

- [Documentación Azure Cosmos DB for MongoDB](https://docs.microsoft.com/azure/cosmos-db/mongodb/introduction)
- [Documentación Blob Storage](https://docs.microsoft.com/azure/storage/blobs/)
- [Calculadora de Precios Azure](https://azure.microsoft.com/pricing/calculator/)
- [Azure Portal](https://portal.azure.com)
- [MongoDB Driver for Node.js](https://www.mongodb.com/docs/drivers/node/current/)

---

## ✅ Checklist Final

- [ ] Azure Cosmos DB for MongoDB (vCore) creado
- [ ] Connection string copiado
- [ ] Firewall configurado con tu IP
- [ ] Blob Storage creado con contenedor `fotos-evidencias`
- [ ] SAS token generado para Blob Storage
- [ ] Archivo `.env` configurado con credenciales
- [ ] Dependencias instaladas: `npm install`
- [ ] Script de inicialización ejecutado: `node scripts/init-azure-mongodb.js`
- [ ] Datos de prueba verificados en Data Explorer
- [ ] App móvil probada con login
- [ ] Panel web probado
- [ ] `.env` agregado a `.gitignore`

---

## 🎉 ¡Listo!

Tu aplicación ahora está corriendo completamente en **Microsoft Azure**, aprovechando:

✅ **Azure Cosmos DB for MongoDB (vCore)** - Base de datos MongoDB nativa compatible al 100%
✅ **Blob Storage** - Almacenamiento escalable para fotos
✅ **Infraestructura empresarial** de Microsoft
✅ **Compatibilidad total** con MongoDB API
✅ **Integración** con tu entorno corporativo de Microsoft
✅ **Backups automáticos** y recuperación ante desastres

### Ventajas sobre Firebase:

- 🏢 **Entorno Microsoft** - Integración con tu empresa
- 💰 **Costos predecibles** - Sin sorpresas en la factura
- 🔒 **Seguridad empresarial** - Cumple con regulaciones corporativas
- 🌐 **MongoDB nativo** - Sin limitaciones, API completa
- 📊 **Control total** - Acceso a todas las métricas y logs

---

**¿Necesitas ayuda?** Revisa la sección de Troubleshooting o contacta al equipo de desarrollo.
