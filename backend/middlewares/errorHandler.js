/**
 * Middleware centralizado de manejo de errores
 */

const appInsights = require('applicationinsights');

/**
 * Error handler global
 */
function errorHandler(err, req, res, next) {
  // Log del error
  console.error('═══════════════════════════════════════════════════');
  console.error('❌ ERROR CAPTURADO:');
  console.error('Ruta:', req.method, req.path);
  console.error('Usuario:', req.user?.email || 'No autenticado');
  console.error('Mensaje:', err.message);
  console.error('Stack:', err.stack);
  // Redactar campos sensibles del body antes de loguear
  const safeBody = (() => {
    try {
      const b = typeof req.body === 'object' && req.body !== null ? { ...req.body } : req.body;
      if (b && typeof b === 'object') {
        if (typeof b.password !== 'undefined') b.password = '<redacted>';
        if (typeof b.client_secret !== 'undefined') b.client_secret = '<redacted>';
      }
      return b;
    } catch {
      return undefined;
    }
  })();
  if (safeBody) {
    console.error('Body (safe):', safeBody);
  }
  console.error('═══════════════════════════════════════════════════');

  // Enviar a Application Insights
  if (appInsights.defaultClient) {
    appInsights.defaultClient.trackException({
      exception: err,
      properties: {
        method: req.method,
        path: req.path,
        user: req.user?.email,
        query: req.query,
        body: req.body
      }
    });
  }

  // Determinar código de estado
  const statusCode = err.statusCode || err.status || 500;

  // Respuesta al cliente
  const errorResponse = {
    error: err.name || 'Error',
    message: err.message || 'Error interno del servidor',
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Errores personalizados
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'No autenticado', details = null) {
    super(message, 401, details);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'No tienes permisos para esta acción') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflicto de datos') {
    super(message, 409);
  }
}

class GraphAPIError extends AppError {
  constructor(message, details = null) {
    super(`Error en Microsoft Graph API: ${message}`, 502, details);
  }
}

class DatabaseError extends AppError {
  constructor(message, details = null) {
    super(`Error en base de datos: ${message}`, 500, details);
  }
}

module.exports = {
  errorHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  GraphAPIError,
  DatabaseError
};
