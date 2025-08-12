/**
 * Production Database Configuration for PlanetScale MySQL
 * Requires valid PlanetScale connection credentials
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

/**
 * Production Database Configuration for PlanetScale
 * Uses DATABASE_URL connection string for optimal PlanetScale compatibility
 */
let dbConfig;

if (process.env.DATABASE_URL) {
  // Parse PlanetScale connection string
  const url = new URL(process.env.DATABASE_URL);
  dbConfig = {
    host: url.hostname,
    port: url.port || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1), // Remove leading slash
    ssl: {
      rejectUnauthorized: true,
      // PlanetScale requires specific SSL configuration
      ca: undefined // Let PlanetScale handle SSL certificates
    },
    // Production-optimized connection pool settings
    connectionLimit: 25,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    // Character encoding for international support
    charset: 'utf8mb4',
    timezone: 'Z',
    // Performance optimizations
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: false,
    // Connection management
    reconnect: true,
    idleTimeout: 300000,
    // Security settings
    multipleStatements: false,
    nestTables: false,
    // PlanetScale specific settings
    flags: [
      'FOUND_ROWS',
      'IGNORE_SPACE',
      'PROTOCOL_41',
      'TRANSACTIONS',
      'RESERVED',
      'SECURE_CONNECTION',
      'MULTI_RESULTS',
      'PS_MULTI_RESULTS',
      'PLUGIN_AUTH',
      'CONNECT_ATTRS',
      'PLUGIN_AUTH_LENENC_CLIENT_DATA',
      'CAN_HANDLE_EXPIRED_PASSWORDS',
      'SESSION_TRACK',
      'DEPRECATE_EOF'
    ]
  };
} else {
  throw new Error('DATABASE_URL is required for production deployment. Please configure your PlanetScale connection string.');
}

/**
 * Create connection pool for better performance
 * Pool automatically handles connection management
 */
const pool = mysql.createPool(dbConfig);

/**
 * Test database connection with comprehensive validation
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();

    // Test basic connectivity
    await connection.ping();

    // Verify database access with a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    if (rows[0].test !== 1) {
      throw new Error('Database query test failed');
    }

    // Verify we can access our database schema
    const [tables] = await connection.execute('SHOW TABLES');

    console.log('✅ PlanetScale database connected successfully');
    console.log(`📊 Database contains ${tables.length} tables`);

    connection.release();
    return true;
  } catch (error) {
    console.error('❌ PlanetScale database connection failed:', error.message);
    console.error('💡 Please verify your DATABASE_URL and PlanetScale configuration');
    return false;
  }
}

/**
 * Execute a query with comprehensive error handling and logging
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
async function executeQuery(query, params = []) {
  const startTime = Date.now();

  try {
    const [results] = await pool.execute(query, params);

    const duration = Date.now() - startTime;

    // Log slow queries in production
    if (duration > 1000) {
      console.warn(`⚠️ Slow query detected (${duration}ms):`, query.substring(0, 100));
    }

    return results;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Enhanced error logging for production debugging
    console.error('❌ Database query failed:', {
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      query: query.substring(0, 200),
      params: params.length,
      duration: `${duration}ms`
    });

    // Re-throw with additional context for application error handling
    const enhancedError = new Error(`Database operation failed: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.query = query;
    enhancedError.sqlCode = error.code;

    throw enhancedError;
  }
}

/**
 * Get a connection from the pool
 * Use this for transactions
 * @returns {Promise<Connection>} Database connection
 */
async function getConnection() {
  return await pool.getConnection();
}

module.exports = {
  pool,
  testConnection,
  executeQuery,
  getConnection
};
