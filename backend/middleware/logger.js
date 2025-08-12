/**
 * Logging Middleware
 * Handles request logging and application logging
 */

const morgan = require('morgan');
const { config } = require('../config/config');

/**
 * Custom token for user ID
 */
morgan.token('user-id', (req) => {
  return req.user ? req.user.id : 'anonymous';
});

/**
 * Custom token for user role
 */
morgan.token('user-role', (req) => {
  return req.user ? req.user.role : 'none';
});

/**
 * Custom token for request ID (if you want to add request tracking)
 */
morgan.token('request-id', (req) => {
  return req.requestId || 'no-id';
});

/**
 * Custom token for response time in milliseconds
 */
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '';
  }
  
  const ms = (res._startAt[0] - req._startAt[0]) * 1000 +
             (res._startAt[1] - req._startAt[1]) * 1e-6;
  
  return ms.toFixed(3);
});

/**
 * Development logging format
 */
const developmentFormat = ':method :url :status :response-time ms - :res[content-length] - User: :user-id (:user-role)';

/**
 * Production logging format
 */
const productionFormat = JSON.stringify({
  timestamp: ':date[iso]',
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time-ms ms',
  contentLength: ':res[content-length]',
  userAgent: ':user-agent',
  ip: ':remote-addr',
  userId: ':user-id',
  userRole: ':user-role',
  requestId: ':request-id'
});

/**
 * Skip logging for certain routes in production
 */
function skipHealthChecks(req, res) {
  // Skip logging for health check endpoints
  if (req.url === '/health' || req.url === '/ping') {
    return true;
  }
  
  // Skip logging for static files
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    return true;
  }
  
  return false;
}

/**
 * Create request logger based on environment
 */
function createRequestLogger() {
  const format = config.server.env === 'production' ? productionFormat : developmentFormat;
  
  return morgan(format, {
    skip: config.server.env === 'production' ? skipHealthChecks : false,
    stream: {
      write: (message) => {
        // Remove trailing newline
        const cleanMessage = message.trim();
        
        if (config.server.env === 'production') {
          try {
            const logData = JSON.parse(cleanMessage);
            console.log('REQUEST:', logData);
          } catch (e) {
            console.log('REQUEST:', cleanMessage);
          }
        } else {
          console.log(cleanMessage);
        }
      }
    }
  });
}

/**
 * Add request ID middleware
 */
function addRequestId(req, res, next) {
  req.requestId = generateRequestId();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Application logger utility
 */
class Logger {
  static log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };
    
    if (config.server.env === 'development') {
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta);
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }
  
  static info(message, meta = {}) {
    this.log('info', message, meta);
  }
  
  static warn(message, meta = {}) {
    this.log('warn', message, meta);
  }
  
  static error(message, meta = {}) {
    this.log('error', message, meta);
  }
  
  static debug(message, meta = {}) {
    if (config.server.env === 'development') {
      this.log('debug', message, meta);
    }
  }
  
  static audit(action, userId, details = {}) {
    this.log('audit', `User ${userId} performed action: ${action}`, {
      userId,
      action,
      ...details
    });
  }
}

/**
 * Security event logger
 */
function logSecurityEvent(event, req, details = {}) {
  Logger.log('security', `Security event: ${event}`, {
    event,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
    ...details
  });
}

/**
 * Database operation logger
 */
function logDatabaseOperation(operation, table, userId = null, details = {}) {
  Logger.log('database', `Database operation: ${operation} on ${table}`, {
    operation,
    table,
    userId,
    ...details
  });
}

/**
 * Performance logger
 */
function logPerformance(operation, duration, details = {}) {
  Logger.log('performance', `Operation ${operation} took ${duration}ms`, {
    operation,
    duration,
    ...details
  });
}

/**
 * API usage logger
 */
function logAPIUsage(req, res, next) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      userRole: req.user?.role
    };
    
    // Log slow requests
    if (duration > 1000) {
      Logger.warn('Slow request detected', logData);
    }
    
    // Log error responses
    if (res.statusCode >= 400) {
      Logger.error('Error response', logData);
    }
  });
  
  next();
}

/**
 * Startup logger
 */
function logStartup(port, env) {
  const startupInfo = {
    port,
    environment: env,
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
  
  Logger.info('Server starting up', startupInfo);
  console.log(`
🚀 SkillUp Lab API Server
📡 Port: ${port}
🌍 Environment: ${env}
⏰ Started at: ${new Date().toLocaleString()}
  `);
}

/**
 * Shutdown logger
 */
function logShutdown(reason = 'Unknown') {
  Logger.info('Server shutting down', { reason, timestamp: new Date().toISOString() });
  console.log(`\n👋 Server shutting down: ${reason}`);
}

module.exports = {
  createRequestLogger,
  addRequestId,
  Logger,
  logSecurityEvent,
  logDatabaseOperation,
  logPerformance,
  logAPIUsage,
  logStartup,
  logShutdown
};
