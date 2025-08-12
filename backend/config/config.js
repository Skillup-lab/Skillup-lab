/**
 * Production Application Configuration
 * Centralizes all environment variables with strict production validation
 */

require('dotenv').config();

// Production environment validation
function validateProductionConfig() {
  if (process.env.NODE_ENV !== 'production') {
    return; // Skip validation for non-production environments
  }

  console.log('🔍 Validating production configuration...');

  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CORS_ORIGIN'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required production environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('💡 Please check your .env file and ensure all production variables are set.');
    process.exit(1);
  }

  // Validate JWT secrets are secure
  if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long for production');
    process.exit(1);
  }

  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    console.error('❌ JWT_REFRESH_SECRET must be at least 32 characters long for production');
    process.exit(1);
  }

  // Validate CORS origins don't include localhost
  if (process.env.CORS_ORIGIN.includes('localhost') || process.env.CORS_ORIGIN.includes('127.0.0.1')) {
    console.error('❌ CORS_ORIGIN should not include localhost URLs in production');
    console.error('💡 Please update CORS_ORIGIN with your production domain(s)');
    process.exit(1);
  }

  // Validate DATABASE_URL format
  if (!process.env.DATABASE_URL.includes('planetscale.com')) {
    console.warn('⚠️  DATABASE_URL does not appear to be a PlanetScale connection string');
  }

  console.log('✅ Production configuration validation passed');
}

// Run validation
validateProductionConfig();

const config = {
  // Server settings
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },

  // Database settings (PlanetScale)
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  },

  // JWT settings (no fallbacks in production)
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  },

  // Security settings (production-hardened)
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : [],
    enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS !== 'false',
    contentSecurityPolicy: process.env.CONTENT_SECURITY_POLICY || "default-src 'self'",
    sessionSecret: process.env.SESSION_SECRET,
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

/**
 * Validate required environment variables
 */
function validateConfig() {
  const required = [
    'JWT_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  console.log('✅ Configuration validated successfully');
}

module.exports = {
  config,
  validateConfig
};
