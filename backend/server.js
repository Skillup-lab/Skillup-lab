/**
 * SkillUp Lab Backend Server
 * Node.js/Express API with role-based access control
 */

// Handle uncaught exceptions
const { handleUncaughtException } = require('./middleware/errorHandler');
handleUncaughtException();

// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const { config, validateConfig } = require('./config/config');
const { testConnection } = require('./config/database');

// Import middleware
const { 
  cors, 
  helmet, 
  generalLimiter, 
  authLimiter,
  submissionLimiter,
  sanitizeInput, 
  preventSQLInjection, 
  limitRequestSize,
  securityHeaders 
} = require('./middleware/security');

const { 
  createRequestLogger, 
  addRequestId, 
  logAPIUsage, 
  logStartup, 
  logShutdown 
} = require('./middleware/logger');

const { 
  globalErrorHandler, 
  handleNotFound, 
  handleUnhandledRejection, 
  handleSIGTERM 
} = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const formRoutes = require('./routes/forms');
const submissionRoutes = require('./routes/submissions');

// Validate configuration
validateConfig();

// Create Express app
const app = express();

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet);
app.use(cors);
app.use(securityHeaders);

// Request logging
app.use(addRequestId);
app.use(createRequestLogger());
app.use(logAPIUsage);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request size limiting
app.use(limitRequestSize('10mb'));

// Input sanitization and SQL injection prevention
app.use(sanitizeInput);
app.use(preventSQLInjection);

// Rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/submissions/', submissionLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/submissions', submissionRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'SkillUp Lab API',
    version: '1.0.0',
    documentation: {
      authentication: '/api/auth',
      users: '/api/users',
      forms: '/api/forms',
      submissions: '/api/submissions'
    },
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/profile'
      },
      users: {
        list: 'GET /api/users',
        create: 'POST /api/users',
        get: 'GET /api/users/:id',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id'
      },
      forms: {
        list: 'GET /api/forms',
        create: 'POST /api/forms',
        get: 'GET /api/forms/:id',
        update: 'PUT /api/forms/:id',
        delete: 'DELETE /api/forms/:id',
        submissions: 'GET /api/forms/:id/submissions'
      },
      submissions: {
        list: 'GET /api/submissions',
        submit: 'POST /api/submissions/form/:formId',
        get: 'GET /api/submissions/:id',
        update: 'PUT /api/submissions/:id',
        delete: 'DELETE /api/submissions/:id',
        stats: 'GET /api/submissions/stats'
      }
    }
  });
});

// Handle 404 for unmatched routes
app.use(handleNotFound);

// Global error handling middleware
app.use(globalErrorHandler);

// Start server
async function startServer() {
  try {
    // Test database connection - REQUIRED for production
    console.log('🔌 Testing PlanetScale database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to PlanetScale database.');
      console.error('💡 Please verify your DATABASE_URL environment variable.');
      console.error('🔗 Get your connection string from: https://app.planetscale.com/');
      process.exit(1);
    }

    // Start the server
    const server = app.listen(config.server.port, () => {
      logStartup(config.server.port, config.server.env);
    });

    // Handle unhandled promise rejections
    handleUnhandledRejection(server);

    // Handle SIGTERM
    handleSIGTERM(server);

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logShutdown(signal);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
