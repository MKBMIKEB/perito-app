# ☁️ Migración a Microsoft Azure

Guía completa para migrar el sistema de Perito App de Firebase a Microsoft Azure.

---

## 🎯 Arquitectura Azure vs Firebase

| Funcionalidad | Firebase | Microsoft Azure |
|---------------|----------|-----------------|
| **Base de Datos** | Firestore | **Azure Cosmos DB** (API MongoDB) |
| **Autenticación** | Firebase Auth | **Azure AD B2C** o **App Service Auth** |
| **Almacenamiento** | Firebase Storage | **Azure Blob Storage** |
| **Hosting Web** | Firebase Hosting | **Azure Static Web Apps** o **App Service** |
| **Funciones** | Cloud Functions | **Azure Functions** |
| **Notificaciones** | FCM | **Azure Notification Hubs** |

---

## 💡 Ventajas de Usar Azure

✅ **Integración con Microsoft 365**
- Usa las mismas cuentas de trabajo
- Integración con Teams, Outlook, SharePoint

✅ **Seguridad Empresarial**
- Azure Active Directory
- Políticas de seguridad centralizadas
- Cumplimiento GDPR, ISO, SOC

✅ **Costos Predecibles**
- Licencias empresariales existentes
- Mejores precios por volumen
- Facturación consolidada

✅ **Soporte Profesional**
- Soporte 24/7 en español
- SLA garantizado
- Microsoft Partner Network

---

## 📋 Servicios Azure Necesarios

### 1. **Azure Cosmos DB** (Reemplazo de Firestore)
- **Tipo**: Base de datos NoSQL
- **API**: MongoDB (compatible con código existente)
- **Precio**: ~$24/mes para desarrollo
- **Escalable**: Hasta millones de documentos

### 2. **Azure App Service** (Reemplazo de Firebase Hosting)
- **Tipo**: Hosting web
- **Incluye**: Panel del coordinador
- **Precio**: ~$13/mes (Plan Básico)
- **SSL**: Gratuito

### 3. **Azure Blob Storage** (Reemplazo de Firebase Storage)
- **Tipo**: Almacenamiento de archivos
- **Uso**: Fotos de evidencias
- **Precio**: ~$0.02/GB/mes
- **CDN**: Opcional para delivery rápido

### 4. **Azure AD B2C** (Reemplazo de Firebase Auth)
- **Tipo**: Autenticación de usuarios
- **Gratis**: Hasta 50,000 usuarios
- **Incluye**: SSO, MFA, políticas de contraseña

### 5. **Azure Functions** (Opcional)
- **Tipo**: Código serverless
- **Uso**: Procesamiento de formularios, notificaciones
- **Precio**: 1M ejecuciones gratis/mes

---

## 🚀 Plan de Migración

### Fase 1: Configuración Inicial (1 día)
1. ✅ Crear cuenta Azure (o usar existente)
2. ✅ Crear Resource Group para el proyecto
3. ✅ Configurar Azure Cosmos DB
4. ✅ Crear Azure Storage Account

### Fase 2: Backend (2-3 días)
1. ✅ Migrar estructura de datos a Cosmos DB
2. ✅ Actualizar servicios de la app móvil
3. ✅ Configurar autenticación con Azure AD B2C
4. ✅ Implementar upload de fotos a Blob Storage

### Fase 3: Frontend (1 día)
1. ✅ Migrar panel web a Azure Static Web Apps
2. ✅ Actualizar conexiones a Cosmos DB
3. ✅ Configurar dominio personalizado

### Fase 4: Testing (1 día)
1. ✅ Pruebas de sincronización
2. ✅ Pruebas de rendimiento
3. ✅ Pruebas de seguridad

---

## 💻 Opción Simplificada: Azure SQL Database

Si prefieres SQL en lugar de NoSQL:

### **Azure SQL Database** (Alternativa a Cosmos DB)
- **Ventaja**: Familiar para equipos .NET/SQL Server
- **Herramientas**: SQL Server Management Studio
- **ORM**: Entity Framework compatible
- **Precio**: Desde $5/mes (DTU básico)

---

## 🔧 Configuración Paso a Paso

### Paso 1: Crear Azure Cosmos DB

1. Ve a [Azure Portal](https://portal.azure.com)
2. Click en **"Crear un recurso"**
3. Busca **"Azure Cosmos DB"**
4. Click en **"Crear"**

**Configuración:**
```
Suscripción: [Tu suscripción]
Grupo de recursos: perito-app-rg
Nombre de cuenta: perito-app-cosmos
API: Azure Cosmos DB for MongoDB
Ubicación: South Central US (más cerca de Colombia)
Modo de capacidad: Serverless (más económico para empezar)
```

5. Click en **"Revisar y crear"** → **"Crear"**
6. Espera 5 minutos mientras se aprovisiona

### Paso 2: Obtener Connection String

1. Ve a tu Cosmos DB → **"Claves"**
2. Copia **"CADENA DE CONEXIÓN PRINCIPAL"**
3. Guárdala (la usaremos después)

### Paso 3: Crear Azure Storage Account

1. Azure Portal → **"Crear un recurso"**
2. Busca **"Cuenta de almacenamiento"**
3. Click en **"Crear"**

**Configuración:**
```
Suscripción: [Tu suscripción]
Grupo de recursos: perito-app-rg
Nombre: peritoappstorage
Ubicación: South Central US
Rendimiento: Estándar
Redundancia: LRS (más económico)
```

4. Click en **"Revisar y crear"** → **"Crear"**

### Paso 4: Crear Contenedor para Fotos

1. Ve a tu Storage Account → **"Contenedores"**
2. Click en **"+ Contenedor"**
3. Nombre: `fotos-evidencias`
4. Nivel de acceso público: **Privado**
5. Click en **"Crear"**

---

## 📱 Actualizar App Móvil para Azure

### Instalar Dependencias

```bash
npm install @azure/cosmos
npm install @azure/storage-blob
npm install @react-native-async-storage/async-storage
```

### Crear AzureConfig.js

```javascript
// src/config/azureConfig.js
export const azureConfig = {
  cosmosDB: {
    endpoint: "https://perito-app-cosmos.documents.azure.com:443/",
    key: "TU_COSMOS_DB_KEY_AQUI",
    databaseId: "PeritoAppDB",
    containers: {
      peritos: "peritos",
      casos: "casos",
      formularios: "formularios"
    }
  },
  storage: {
    accountName: "peritoappstorage",
    sasToken: "TU_SAS_TOKEN_AQUI",
    containerName: "fotos-evidencias"
  }
};
```

---

## 💰 Estimación de Costos Mensual

### Opción 1: Plan Startup (Desarrollo)
```
Azure Cosmos DB (Serverless):     $0-30/mes
Azure App Service (Básico B1):    $13/mes
Azure Storage (100 GB):           $2/mes
Azure AD B2C (gratis):            $0/mes
────────────────────────────────────────
TOTAL:                            ~$15-45/mes
```

### Opción 2: Plan Producción (100 usuarios activos)
```
Azure Cosmos DB (400 RU/s):       $24/mes
Azure App Service (Standard S1):  $70/mes
Azure Storage (500 GB):           $10/mes
Azure CDN (opcional):             $10/mes
Azure Functions (1M ejecuciones): $0/mes (gratis)
────────────────────────────────────────
TOTAL:                            ~$104-114/mes
```

### Comparación con Firebase
```
Firebase (Plan Blaze):            $100-200/mes
Azure (Equivalente):              $104-114/mes

✅ Azure es similar o más económico
✅ Azure incluye soporte empresarial
✅ Azure integra con M365
```

---

## 🔒 Seguridad

### Azure AD B2C - Configuración

1. **Políticas de Contraseña:**
   - Mínimo 8 caracteres
   - Mayúsculas, minúsculas, números
   - Bloqueo después de 5 intentos

2. **Multi-Factor Authentication (MFA):**
   - SMS o Email
   - Microsoft Authenticator

3. **Single Sign-On (SSO):**
   - Integración con Microsoft 365
   - Login con cuenta corporativa

---

## 📊 Monitoreo y Logs

### Azure Monitor
- Métricas en tiempo real
- Alertas automáticas
- Dashboards personalizados

### Application Insights
- Seguimiento de errores
- Performance monitoring
- User analytics

---

## 🆚 Comparación Detallada

### Firestore vs Cosmos DB

| Característica | Firestore | Cosmos DB |
|----------------|-----------|-----------|
| Modelo | Documentos | Documentos (MongoDB API) |
| Queries | Limitadas | SQL-like completo |
| Triggers | Cloud Functions | Azure Functions |
| Replicación | Multi-región | Multi-región + multi-maestro |
| Backup | Manual | Automático |
| Latencia | <100ms | <10ms (con geo-replicación) |

### Firebase Storage vs Azure Blob Storage

| Característica | Firebase Storage | Azure Blob |
|----------------|------------------|------------|
| Precio/GB/mes | $0.026 | $0.018 |
| CDN | Incluido | Opcional ($10/mes) |
| Ancho de banda | $0.12/GB | $0.087/GB |
| Integración | Firebase | Todo Microsoft |

---

## 🎓 Recursos de Aprendizaje

### Documentación Oficial
- [Azure Cosmos DB](https://docs.microsoft.com/azure/cosmos-db/)
- [Azure App Service](https://docs.microsoft.com/azure/app-service/)
- [Azure Storage](https://docs.microsoft.com/azure/storage/)
- [Azure AD B2C](https://docs.microsoft.com/azure/active-directory-b2c/)

### Tutoriales
- [Crear API REST con Azure](https://docs.microsoft.com/learn/paths/create-serverless-applications/)
- [React Native + Azure](https://docs.microsoft.com/learn/modules/react-native-azure/)

### Soporte
- **Portal de Soporte**: https://portal.azure.com → Ayuda + soporte
- **Microsoft Q&A**: https://docs.microsoft.com/answers/
- **Teléfono**: 01-800-123-4567 (Colombia)

---

## ✅ Checklist de Migración

- [ ] Cuenta Azure creada
- [ ] Azure Cosmos DB aprovisionado
- [ ] Azure Storage Account creado
- [ ] Connection strings obtenidas
- [ ] App móvil actualizada
- [ ] Panel web migrado
- [ ] Datos de prueba cargados
- [ ] Testing completo
- [ ] Documentación actualizada
- [ ] Equipo capacitado

---

## 🚀 Próximos Pasos

1. **Ahora**: Crear cuenta Azure y recursos básicos
2. **Siguiente**: Migrar código (tengo los archivos listos)
3. **Después**: Capacitación del equipo
4. **Futuro**: Integración con Microsoft Teams

---

¿Quieres que continúe con la implementación usando Azure?
