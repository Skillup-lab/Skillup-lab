/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

const { config } = require('../config/config');

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error handler wrapper
 * Catches async errors and passes them to error handling middleware
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle database errors
 */
function handleDatabaseError(error) {
  let message = 'Database operation failed';
  let statusCode = 500;
  
  // MySQL specific errors
  if (error.code) {
    switch (error.code) {
      case 'ER_DUP_ENTRY':
        message = 'Duplicate entry. This record already exists.';
        statusCode = 409;
        break;
      case 'ER_NO_REFERENCED_ROW_2':
        message = 'Referenced record does not exist.';
        statusCode = 400;
        break;
      case 'ER_ROW_IS_REFERENCED_2':
        message = 'Cannot delete record. It is referenced by other records.';
        statusCode = 400;
        break;
      case 'ER_DATA_TOO_LONG':
        message = 'Data too long for field.';
        statusCode = 400;
        break;
      case 'ER_BAD_NULL_ERROR':
        message = 'Required field cannot be null.';
        statusCode = 400;
        break;
      case 'ECONNREFUSED':
        message = 'Database connection refused.';
        statusCode = 503;
        break;
      case 'ETIMEDOUT':
        message = 'Database connection timeout.';
        statusCode = 503;
        break;
      default:
        message = 'Database error occurred.';
        statusCode = 500;
    }
  }
  
  return new AppError(message, statusCode);
}

/**
 * Handle JWT errors
 */
function handleJWTError(error) {
  let message = 'Authentication failed';
  let statusCode = 401;
  
  if (error.name === 'JsonWebTokenError') {
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    message = 'Token expired';
  } else if (error.name === 'NotBeforeError') {
    message = 'Token not active';
  }
  
  return new AppError(message, statusCode);
}

/**
 * Handle validation errors
 */
function handleValidationError(error) {
  const errors = error.array ? error.array() : [error];
  const message = errors.map(err => err.msg || err.message).join('. ');
  return new AppError(`Validation failed: ${message}`, 400);
}

/**
 * Send error response in development
 */
function sendErrorDev(err, res) {
  res.status(err.statusCode).json({
    success: false,
    error: err.status,
    message: err.message,
    stack: err.stack,
    details: err
  });
}

/**
 * Send error response in production
 */
function sendErrorProd(err, res) {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    
    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
}

/**
 * Global error handling middleware
 */
function globalErrorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  if (config.server.env === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    
    // Handle specific error types
    if (err.code && err.code.startsWith('ER_')) {
      error = handleDatabaseError(err);
    } else if (err.name && err.name.includes('JsonWebToken')) {
      error = handleJWTError(err);
    } else if (err.array && typeof err.array === 'function') {
      error = handleValidationError(err);
    }
    
    sendErrorProd(error, res);
  }
}

/**
 * Handle unhandled routes
 */
function handleNotFound(req, res, next) {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
}

/**
 * Handle uncaught exceptions
 */
function handleUncaughtException() {
  process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
  });
}

/**
 * Handle unhandled promise rejections
 */
function handleUnhandledRejection(server) {
  process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
}

/**
 * Handle SIGTERM signal
 */
function handleSIGTERM(server) {
  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
      console.log('💥 Process terminated!');
    });
  });
}

/**
 * Validation error formatter
 */
function formatValidationErrors(errors) {
  return errors.map(error => ({
    field: error.param || error.path,
    message: error.msg || error.message,
    value: error.value
  }));
}

/**
 * Log error details
 */
function logError(error, req = null) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    isOperational: error.isOperational
  };
  
  if (req) {
    errorInfo.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    };
  }
  
  console.error('Application Error:', JSON.stringify(errorInfo, null, 2));
}

/**
 * Create standardized API response
 */
function createResponse(success, data = null, message = null, errors = null) {
  const response = { success };
  
  if (message) response.message = message;
  if (data) response.data = data;
  if (errors) response.errors = errors;
  
  return response;
}

/**
 * Success response helper
 */
function successResponse(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json(createResponse(true, data, message));
}

/**
 * Error response helper
 */
function errorResponse(res, message = 'Error', statusCode = 500, errors = null) {
  return res.status(statusCode).json(createResponse(false, null, message, errors));
}

module.exports = {
  AppError,
  asyncHandler,
  globalErrorHandler,
  handleNotFound,
  handleUncaughtException,
  handleUnhandledRejection,
  handleSIGTERM,
  formatValidationErrors,
  logError,
  createResponse,
  successResponse,
  errorResponse
};
