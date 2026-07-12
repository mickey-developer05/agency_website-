const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || null;
  const requestId = req.id || 'system';

  // Log error
  logger.error(`${req.method} ${req.path} failed: ${message}`, {
    requestId,
    status,
    error: err,
    stack: err.stack
  });

  // Standardized response
  res.status(status).json({
    success: false,
    status,
    message,
    data: null,
    errors: errors || message,
    error: message,
    timestamp: new Date().toISOString(),
    requestId
  });
}

module.exports = errorHandler;
