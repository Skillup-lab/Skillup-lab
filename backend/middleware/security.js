/**
 * Security Middleware
 * Handles rate limiting, CORS, and other security measures
 */

const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const { config } = require('../config/config');

/**
 * General rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

/**
 * Password reset rate limiter
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
    retryAfter: 60 * 60 // 1 hour in seconds
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Form submission rate limiter
 */
const submissionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 form submissions per 5 minutes
  message: {
    success: false,
    message: 'Too many form submissions, please slow down.',
    retryAfter: 5 * 60 // 5 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * CORS configuration
 */
const corsOptions = {
  origin: function (origin, callback) {
    // In production, strictly enforce CORS origins
    if (process.env.NODE_ENV === 'production') {
      if (!origin) {
        // Reject requests with no origin in production (except for same-origin)
        return callback(new Error('Origin header required in production'));
      }

      if (config.security.corsOrigin.indexOf(origin) === -1) {
        console.warn(`🚫 CORS blocked request from unauthorized origin: ${origin}`);
        return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    } else {
      // Development mode - allow requests with no origin
      if (!origin) return callback(null, true);

      if (config.security.corsOrigin.length > 0 && config.security.corsOrigin.indexOf(origin) === -1) {
        return callback(new Error('Not allowed by CORS'));
      }
    }

    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // 24 hours
};

/**
 * Production-hardened Helmet security configuration
 */
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for UI components
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for dynamic content
      imgSrc: ["'self'", "data:", "https:"], // Allow images from HTTPS sources
      connectSrc: ["'self'", "https:"], // Allow HTTPS API calls
      fontSrc: ["'self'", "https:"], // Allow web fonts
      objectSrc: ["'none'"], // Block object/embed tags
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"], // Block iframes
      baseUri: ["'self'"], // Restrict base tag
      formAction: ["'self'"], // Restrict form submissions
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false, // May interfere with some integrations
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
  hidePoweredBy: true
};

/**
 * Input sanitization middleware
 */
function sanitizeInput(req, res, next) {
  // Recursively sanitize object properties
  function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Remove potential XSS patterns
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }
  
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
}

/**
 * SQL injection prevention middleware
 * This is mainly handled by using parameterized queries,
 * but this adds an extra layer of protection
 */
function preventSQLInjection(req, res, next) {
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(--|\/\*|\*\/|;)/g,
    /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\(\s*\d+\s*\))/gi
  ];
  
  function checkForSQLInjection(obj, path = '') {
    if (typeof obj !== 'object' || obj === null) {
      if (typeof obj === 'string') {
        for (const pattern of sqlInjectionPatterns) {
          if (pattern.test(obj)) {
            throw new Error(`Potential SQL injection detected in ${path || 'input'}`);
          }
        }
      }
      return;
    }
    
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        checkForSQLInjection(item, `${path}[${index}]`);
      });
      return;
    }
    
    for (const [key, value] of Object.entries(obj)) {
      checkForSQLInjection(value, path ? `${path}.${key}` : key);
    }
  }
  
  try {
    // Check request body
    if (req.body) {
      checkForSQLInjection(req.body, 'body');
    }
    
    // Check query parameters
    if (req.query) {
      checkForSQLInjection(req.query, 'query');
    }
    
    // Check URL parameters
    if (req.params) {
      checkForSQLInjection(req.params, 'params');
    }
    
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected'
    });
  }
}

/**
 * Request size limiter
 */
function limitRequestSize(maxSize = '10mb') {
  return (req, res, next) => {
    const contentLength = req.get('content-length');
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).json({
          success: false,
          message: 'Request entity too large'
        });
      }
    }
    
    next();
  };
}

/**
 * Helper function to parse size strings
 */
function parseSize(size) {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * (units[unit] || 1));
}

/**
 * Security headers middleware
 */
function securityHeaders(req, res, next) {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
}

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  submissionLimiter,
  corsOptions,
  helmetOptions,
  sanitizeInput,
  preventSQLInjection,
  limitRequestSize,
  securityHeaders,
  cors: cors(corsOptions),
  helmet: helmet(helmetOptions)
};
