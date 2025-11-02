# 🏗️ Arquitectura PeritoApp - Ecosistema Microsoft Azure

## 📐 Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USUARIOS FINALES                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐              ┌──────────────────┐                │
│  │   APP MÓVIL      │              │    APP WEB       │                │
│  │  React Native    │              │   React/HTML     │                │
│  │  (Expo)          │              │  (Coordinador)   │                │
│  └────────┬─────────┘              └────────┬─────────┘                │
│           │                                  │                           │
└───────────┼──────────────────────────────────┼───────────────────────────┘
            │                                  │
            │         ┌────────────────────────┘
            │         │
            ▼         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      AZURE ACTIVE DIRECTORY (AAD)                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  • Autenticación MSAL (OAuth 2.0)                               │   │
│  │  • Client ID / Tenant ID                                        │   │
│  │  • Roles: Perito, Supervisor, Administrador                     │   │
│  │  • Single Sign-On (SSO)                                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ Token JWT
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        AZURE API MANAGEMENT (OPCIONAL)                   │
│  • Rate Limiting                                                         │
│  • API Gateway                                                           │
│  • Logging centralizado                                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         AZURE APP SERVICE                                │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │              BACKEND API (Node.js + Express)                   │     │
│  │  ┌─────────────────────────────────────────────────────────┐  │     │
│  │  │  ENDPOINTS:                                             │  │     │
│  │  │  • POST   /api/auth/login                              │  │     │
│  │  │  • POST   /api/casos                                   │  │     │
│  │  │  • POST   /api/upload/foto                             │  │     │
│  │  │  • POST   /api/upload/formulario                       │  │     │
│  │  │  • GET    /api/casos/:id                               │  │     │
│  │  │  • GET    /api/casos/perito/:peritoId                  │  │     │
│  │  │  • POST   /api/onedrive/crear-carpeta                  │  │     │
│  │  │  • GET    /api/onedrive/listar/:casoId                 │  │     │
│  │  └─────────────────────────────────────────────────────────┘  │     │
│  └───────────────────────────────────────────────────────────────┘     │
└────────┬───────────────────┬────────────────────┬────────────────────────┘
         │                   │                    │
         ▼                   ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐
│  AZURE SQL      │  │ MICROSOFT       │  │  AZURE KEY VAULT     │
│  DATABASE       │  │ GRAPH API       │  │                      │
│                 │  │                 │  │  • Client Secret     │
│  • Casos        │  │  ┌───────────┐  │  │  • DB Connection     │
│  • Peritos      │  │  │ OneDrive  │  │  │  • API Keys          │
│  • Formularios  │  │  │ Business  │  │  │  • Tokens            │
│  • Metadata     │  │  └─────┬─────┘  │  └──────────────────────┘
│  • Ubicaciones  │  │        │        │
└─────────────────┘  └────────┼────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │      MICROSOFT ONEDRIVE              │
                    │      (Almacenamiento)                │
                    │                                      │
                    │  OneDrive/                           │
                    │  └─ DatosPeritos/                    │
                    │     ├─ CASO_001/                     │
                    │     │  ├─ Fotos/                     │
                    │     │  │  ├─ fachada_001.jpg         │
                    │     │  │  └─ interior_001.jpg        │
                    │     │  └─ Formularios/               │
                    │     │     └─ formulario_campo.json   │
                    │     ├─ CASO_002/                     │
                    │     └─ CASO_003/                     │
                    └──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    DISTRIBUCIÓN Y CI/CD                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────┐     ┌────────────────────┐                      │
│  │  AZURE DEVOPS      │     │   APP CENTER       │                      │
│  │  / GITHUB ACTIONS  │     │                    │                      │
│  │                    │     │  • Build iOS/Andr  │                      │
│  │  • CI/CD Backend   │     │  • Distribución    │                      │
│  │  • Deploy Web      │     │  • Analytics       │                      │
│  │  • Tests           │     │  • Crash Reports   │                      │
│  └────────────────────┘     └────────┬───────────┘                      │
│                                      │                                   │
│                                      ▼                                   │
│                           ┌────────────────────┐                         │
│                           │ MICROSOFT INTUNE   │                         │
│                           │ (Endpoint Manager) │                         │
│                           │                    │                         │
│                           │ • MDM Deployment   │                         │
│                           │ • App Policies     │                         │
│                           │ • Device Security  │                         │
│                           └────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos Completo

### 1️⃣ Autenticación (Primera vez)

```
Usuario → App Móvil/Web → Azure AD (MSAL)
                           ↓
                    Token JWT + Refresh Token
                           ↓
              Almacenamiento local seguro
```

### 2️⃣ Captura y Envío de Datos (Perito en campo)

```
1. Perito abre caso asignado
2. Toma fotos y completa formulario
3. App envía a Backend:
   POST /api/upload/foto
   {
     casoId: "CASO_001",
     tipo: "fachada",
     foto: base64_image,
     coordenadas: { lat: 4.6097, lng: -74.0817 },
     timestamp: "2025-11-01T10:30:00Z"
   }

4. Backend procesa:
   ├─ Valida token JWT
   ├─ Verifica permisos del perito
   ├─ Crea carpeta en OneDrive (si no existe)
   │  └─ Graph API: /drives/{drive-id}/root:/DatosPeritos/CASO_001/Fotos
   ├─ Sube foto a OneDrive
   ├─ Guarda metadata en Azure SQL
   └─ Retorna confirmación

5. App muestra confirmación al perito
```

### 3️⃣ Visualización (Coordinador en web)

```
1. Coordinador inicia sesión (Azure AD)
2. Solicita casos:
   GET /api/casos?estado=completado

3. Backend retorna:
   {
     casos: [
       {
         id: "CASO_001",
         perito: "Juan Pérez",
         fotos: [
           {
             url: "https://graph.microsoft.com/v1.0/drives/.../items/...",
             tipo: "fachada",
             fecha: "2025-11-01T10:30:00Z"
           }
         ],
         formulario: { ... }
       }
     ]
   }

4. App web descarga fotos desde OneDrive usando Graph API
5. Muestra galería de evidencias organizadas
```

## 🔐 Seguridad en Capas

### Capa 1: Azure Active Directory
- Autenticación multifactor (MFA) opcional
- Políticas de contraseñas robustas
- Conditional Access (acceso solo desde IPs corporativas)

### Capa 2: Backend (App Service)
- Validación de tokens en cada request
- Rate limiting por usuario
- CORS configurado solo para dominios autorizados
- HTTPS obligatorio

### Capa 3: Base de Datos (Azure SQL)
- Cifrado en reposo (TDE)
- Cifrado en tránsito (SSL/TLS)
- Firewall con IPs whitelisted
- Backups automáticos

### Capa 4: OneDrive
- Permisos delegados (usuario debe consentir)
- Acceso de aplicación con Client Secret en Key Vault
- Auditoría de accesos a archivos

### Capa 5: Secrets Management
- Azure Key Vault para todos los secretos
- Managed Identity para App Service
- Rotación automática de secretos

## 📊 Escalabilidad y Rendimiento

### App Service (Backend)
- **Plan**: Premium V3 (auto-scaling)
- **Instancias**: 2-10 (auto-scale basado en CPU/Memoria)
- **Región**: Brazil South o East US

### Azure SQL
- **Tier**: General Purpose
- **Compute**: 2-4 vCores
- **Storage**: 32 GB (escalable a 4TB)
- **Backup**: Geo-redundante

### OneDrive for Business
- **Capacidad**: 1TB por usuario
- **Cuota app**: Sin límite (dentro del tenant)
- **Versioning**: Habilitado (recuperación de archivos)

### CDN (Opcional)
- Azure CDN para fotos frecuentemente accedidas
- Cache de 24 horas
- Reduce latencia para coordinadores

## 🔔 Monitoreo y Observabilidad

### Application Insights
```javascript
// Integrado en backend
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .start();
```

**Métricas monitoreadas:**
- Tiempo de respuesta de APIs
- Tasa de errores
- Uso de CPU/Memoria
- Requests por segundo
- Latencia de Graph API

### Log Analytics
- Logs centralizados de App Service, SQL, y AAD
- Queries KQL para análisis
- Alertas automáticas (ej: error rate > 5%)

### App Center Analytics (Móvil)
- Crashes y errores
- Sesiones de usuario
- Tiempo en cada pantalla
- Eventos personalizados

## 💰 Estimación de Costos (Mensual)

| Servicio | Configuración | Costo Estimado |
|----------|---------------|----------------|
| App Service (P1v3) | 2 instancias | ~$200 USD |
| Azure SQL (GP_Gen5_2) | 2 vCores | ~$360 USD |
| OneDrive for Business | Incluido en M365 | $0 USD* |
| Azure AD Premium P1 | Por usuario | $6 USD/usuario |
| Application Insights | 5GB/mes | ~$10 USD |
| Key Vault | Operaciones | ~$5 USD |
| App Center | Build + Distribución | $40 USD |
| **TOTAL** | | **~$621 USD/mes** |

*Asumiendo licencias M365 Business existentes

## 📱 Distribución Interna

### Flujo con Intune

```
1. Desarrollador → Push a GitHub
2. GitHub Actions → Build en App Center
3. App Center → Genera APK/IPA firmado
4. Intune → Detecta nueva versión
5. Intune → Push automático a dispositivos corporativos
6. Perito → Recibe notificación de actualización
```

### Políticas Intune Recomendadas
- Requerir PIN de dispositivo
- Cifrado de dispositivo obligatorio
- Permitir instalación solo desde Intune
- Wipe remoto si dispositivo se pierde
- Bloquear jailbreak/root

## 🚀 Plan de Despliegue

### Fase 1: Preparación (Semana 1)
- [ ] Crear suscripción Azure
- [ ] Registrar app en Azure AD
- [ ] Configurar OneDrive for Business
- [ ] Crear recursos Azure (App Service, SQL, Key Vault)

### Fase 2: Backend (Semana 2)
- [ ] Desarrollar API REST con Graph API
- [ ] Integrar Azure SQL
- [ ] Configurar autenticación MSAL
- [ ] Deploy a App Service staging

### Fase 3: Apps (Semana 3-4)
- [ ] Integrar MSAL en app móvil
- [ ] Adaptar app web con Azure AD
- [ ] Conectar ambas al backend
- [ ] Testing interno

### Fase 4: CI/CD (Semana 5)
- [ ] Configurar App Center
- [ ] Pipeline de GitHub Actions
- [ ] Integración con Intune
- [ ] Testing de distribución

### Fase 5: Producción (Semana 6)
- [ ] Deploy a producción
- [ ] Migración de datos (si aplica)
- [ ] Capacitación usuarios
- [ ] Monitoreo 24/7

---

## 📚 Siguientes Documentos

1. `AZURE_AD_SETUP.md` - Configuración detallada de Azure AD
2. `BACKEND_API.md` - Código completo del backend
3. `MOBILE_INTEGRATION.md` - Integración MSAL en React Native
4. `WEB_APP.md` - App web con autenticación
5. `CICD_PIPELINE.md` - Pipelines completos
6. `INTUNE_DEPLOYMENT.md` - Distribución empresarial
