/**
 * Middleware de logging
 */

const winston = require('winston');
const appInsights = require('applicationinsights');

// Configuración de Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'perito-app-backend' },
  transports: [
    // Escribir logs de error a archivo
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Escribir todos los logs a archivo
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// En desarrollo, también mostrar en consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

/**
 * Middleware para loggear cada request
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Capturar cuando la respuesta termina
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      user: req.user?.email || 'anonymous'
    };

    // Determinar nivel de log según status code
    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Client error', logData);
    } else {
      logger.info('Request completed', logData);
    }

    // Enviar a Application Insights
    if (appInsights.defaultClient) {
      appInsights.defaultClient.trackRequest({
        name: `${req.method} ${req.path}`,
        url: req.url,
        duration: duration,
        resultCode: res.statusCode,
        success: res.statusCode < 400,
        properties: logData
      });
    }

    // Log en consola con formato legible
    const emoji = res.statusCode >= 400 ? '❌' : '✅';
    const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    const reset = '\x1b[0m';

    console.log(
      `${emoji} ${color}${res.statusCode}${reset} ${req.method.padEnd(6)} ${req.path.padEnd(30)} ${duration}ms ${req.user?.email || ''}`
    );
  });

  next();
}

module.exports = {
  logger,
  requestLogger
};
