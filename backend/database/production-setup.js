/**
 * Production Database Setup Script
 * Sets up the database with secure defaults and generates admin credentials
 */

const { executeQuery, testConnection } = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Run production database setup
 */
async function setupProduction() {
  console.log('🚀 Starting production database setup...');
  
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Run schema migration
    console.log('📋 Creating database schema...');
    await runSchemaMigration();

    // Create secure admin user
    console.log('👤 Creating admin user with secure credentials...');
    const adminCredentials = await createSecureAdmin();

    // Insert system settings
    console.log('⚙️ Configuring system settings...');
    await insertSystemSettings();

    // Create audit log entry
    console.log('📝 Creating initial audit log...');
    await createInitialAuditLog();

    console.log('✅ Production database setup completed successfully!');
    console.log('');
    console.log('🔐 ADMIN CREDENTIALS (SAVE THESE SECURELY):');
    console.log('   Username:', adminCredentials.username);
    console.log('   Password:', adminCredentials.password);
    console.log('   Email:', adminCredentials.email);
    console.log('');
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   1. Change the admin password immediately after first login');
    console.log('   2. Enable email verification in system settings if needed');
    console.log('   3. Configure SMTP settings for email functionality');
    console.log('   4. Update CORS origins in system settings for your domain');
    console.log('   5. Review and adjust rate limiting settings as needed');
    console.log('');
    console.log('🌐 Next steps:');
    console.log('   1. Deploy your application to production');
    console.log('   2. Configure environment variables');
    console.log('   3. Set up SSL/TLS certificates');
    console.log('   4. Configure monitoring and backups');

  } catch (error) {
    console.error('❌ Production setup failed:', error.message);
    throw error;
  }
}

/**
 * Run schema migration
 */
async function runSchemaMigration() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    // Split SQL statements and filter out comments
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} schema statements...`);
    
    for (const statement of statements) {
      try {
        await executeQuery(statement);
      } catch (error) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    console.log('✅ Schema migration completed');
    
  } catch (error) {
    console.error('❌ Schema migration failed:', error.message);
    throw error;
  }
}

/**
 * Create secure admin user
 */
async function createSecureAdmin() {
  try {
    // Generate secure random password
    const password = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(password, 12);
    
    const adminData = {
      username: 'admin',
      email: 'admin@skilluplab.com',
      password,
      passwordHash
    };

    // Insert admin user
    await executeQuery(`
      INSERT IGNORE INTO users (
        username, email, password_hash, role, first_name, last_name, 
        email_verified, is_active, created_at
      ) VALUES (?, ?, ?, 'admin', 'System', 'Administrator', TRUE, TRUE, NOW())
    `, [adminData.username, adminData.email, adminData.passwordHash]);

    // Log admin creation
    await executeQuery(`
      INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, details, ip_address, created_at
      ) VALUES (1, 'user_created', 'user', 1, ?, '127.0.0.1', NOW())
    `, [JSON.stringify({ role: 'admin', created_by: 'system', secure_setup: true })]);

    return adminData;
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    throw error;
  }
}

/**
 * Insert system settings
 */
async function insertSystemSettings() {
  try {
    const seedPath = path.join(__dirname, 'seed-production.sql');
    const seedSQL = await fs.readFile(seedPath, 'utf8');
    
    // Split SQL statements
    const statements = seedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} seed statements...`);
    
    for (const statement of statements) {
      try {
        await executeQuery(statement);
      } catch (error) {
        // Ignore duplicate entry errors for seed data
        if (!error.message.includes('Duplicate entry')) {
          console.warn('Seed warning:', error.message);
        }
      }
    }

    console.log('✅ System settings configured');
    
  } catch (error) {
    console.error('❌ Failed to insert system settings:', error.message);
    throw error;
  }
}

/**
 * Create initial audit log
 */
async function createInitialAuditLog() {
  try {
    await executeQuery(`
      INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, details, ip_address, created_at
      ) VALUES (NULL, 'system_initialized', 'system', NULL, ?, '127.0.0.1', NOW())
    `, [JSON.stringify({
      version: '1.0.0',
      environment: 'production',
      setup_date: new Date().toISOString(),
      features_enabled: [
        'form_templates',
        'form_analytics', 
        'bulk_operations',
        'export_data',
        'api_access',
        'audit_logging',
        'performance_monitoring'
      ]
    })]);

    console.log('✅ Initial audit log created');
    
  } catch (error) {
    console.error('❌ Failed to create audit log:', error.message);
    throw error;
  }
}

/**
 * Validate production environment
 */
async function validateEnvironment() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'NODE_ENV'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  NODE_ENV is not set to "production"');
  }

  // Validate JWT secrets are secure
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for production');
  }

  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long for production');
  }

  console.log('✅ Environment validation passed');
}

// Main execution
async function main() {
  try {
    console.log('🔍 Validating production environment...');
    await validateEnvironment();
    
    await setupProduction();
    
    console.log('🎉 Production setup completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Production setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  setupProduction,
  validateEnvironment,
  createSecureAdmin,
  runSchemaMigration
};
