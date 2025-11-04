/**
 * PeritoApp Backend Server
 * Main entry point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const appInsights = require('applicationinsights');

// Inicializar Application Insights
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(true)
    .start();
  console.log('✅ Application Insights inicializado');
}

// Importar middlewares
const { errorHandler } = require('./middlewares/errorHandler');
const { requestLogger } = require('./middlewares/logger');
const { authenticateToken } = require('./middlewares/auth');

// Importar rutas
const authRoutes = require('./routes/auth');
const casosRoutes = require('./routes/casos');
const uploadRoutes = require('./routes/upload');
const onedriveRoutes = require('./routes/onedrive');
const peritosRoutes = require('./routes/peritos');
const syncRoutes = require('./routes/sync');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARES GLOBALES =====

// Seguridad con Helmet (configurado para permitir app web)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://alcdn.msauth.net", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://login.microsoftonline.com", "https://*.documents.azure.com"]
    }
  }
}));

// CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos de la app web
const path = require('path');
app.use('/web', express.static(path.join(__dirname, '../web-coordinador')));
app.use('/web-coordinador', express.static(path.join(__dirname, '../web-coordinador')));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Logger de peticiones
app.use(requestLogger);

// ===== HEALTH CHECK =====

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

app.get('/', (req, res) => {
  res.json({
    app: 'PeritoApp Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      casos: '/api/casos',
      upload: '/api/upload',
      onedrive: '/api/onedrive',
      peritos: '/api/peritos',
      sync: '/api/sync'
    }
  });
});

// ===== RUTAS DE LA API =====

// Rutas públicas (sin autenticación)
app.use('/api/auth', authRoutes);

// Rutas protegidas (requieren autenticación)
app.use('/api/casos', authenticateToken, casosRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes);
app.use('/api/onedrive', authenticateToken, onedriveRoutes);
app.use('/api/peritos', authenticateToken, peritosRoutes);
app.use('/api/sync', authenticateToken, syncRoutes);

// ===== MANEJO DE ERRORES =====

// 404 - Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.path,
    method: req.method
  });
});

// Error handler global
app.use(errorHandler);

// ===== INICIAR SERVIDOR =====

const server = app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║      🚀 PeritoApp Backend API                             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`🌐 Servidor corriendo en puerto: ${PORT}`);
  console.log(`📅 Fecha: ${new Date().toLocaleString('es-CO')}`);
  console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 CORS habilitado para: ${corsOptions.origin}`);
  console.log('─────────────────────────────────────────────────────────────');
  console.log('Endpoints disponibles:');
  console.log(`  GET  /health                    - Health check`);
  console.log(`  POST /api/auth/login            - Login con Azure AD`);
  console.log(`  GET  /api/casos                 - Listar casos`);
  console.log(`  POST /api/casos                 - Crear caso`);
  console.log(`  POST /api/upload/foto           - Subir foto`);
  console.log(`  POST /api/upload/formulario     - Subir formulario`);
  console.log(`  POST /api/onedrive/crear-carpeta - Crear carpeta en OneDrive`);
  console.log(`  GET  /api/onedrive/listar/:id   - Listar archivos de caso`);
  console.log('═════════════════════════════════════════════════════════════\n');
});

// Manejo de shutdown graceful
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT recibido. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Capturar errores no manejados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  if (appInsights.defaultClient) {
    appInsights.defaultClient.trackException({ exception: reason });
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (appInsights.defaultClient) {
    appInsights.defaultClient.trackException({ exception: error });
  }
  process.exit(1);
});

module.exports = app;
