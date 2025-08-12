/**
 * Database migration utility for PlanetScale
 * Handles schema creation and updates
 */

const fs = require('fs').promises;
const path = require('path');
const { executeQuery, testConnection } = require('../config/database');

/**
 * Run database migrations
 * @param {boolean} includeSeed - Whether to include seed data
 */
async function runMigrations(includeSeed = false) {
  try {
    console.log('🚀 Starting database migrations...');
    
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    // Split SQL statements (simple approach)
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} schema statements...`);
    
    for (const statement of statements) {
      try {
        await executeQuery(statement);
      } catch (error) {
        // Ignore table already exists errors
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    console.log('✅ Schema migration completed successfully');

    // Run seed data if requested
    if (includeSeed) {
      await runSeedData();
    }

    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

/**
 * Run seed data
 */
async function runSeedData() {
  try {
    console.log('🌱 Running seed data...');
    
    const seedPath = path.join(__dirname, 'seed.sql');
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

    console.log('✅ Seed data completed successfully');
    
  } catch (error) {
    console.error('❌ Seed data failed:', error.message);
    throw error;
  }
}

/**
 * Drop all tables (use with caution!)
 */
async function dropTables() {
  try {
    console.log('⚠️  Dropping all tables...');
    
    const tables = [
      'form_permissions',
      'refresh_tokens', 
      'form_submissions',
      'form_fields',
      'forms',
      'users'
    ];

    for (const table of tables) {
      try {
        await executeQuery(`DROP TABLE IF EXISTS ${table}`);
        console.log(`🗑️  Dropped table: ${table}`);
      } catch (error) {
        console.warn(`Warning dropping ${table}:`, error.message);
      }
    }

    console.log('✅ All tables dropped successfully');
    
  } catch (error) {
    console.error('❌ Drop tables failed:', error.message);
    throw error;
  }
}

/**
 * Reset database (drop and recreate)
 */
async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    await dropTables();
    await runMigrations(true);
    console.log('✅ Database reset completed successfully');
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      runMigrations(false);
      break;
    case 'seed':
      runSeedData();
      break;
    case 'migrate:seed':
      runMigrations(true);
      break;
    case 'reset':
      resetDatabase();
      break;
    case 'drop':
      dropTables();
      break;
    default:
      console.log('Usage: node migrations.js [migrate|seed|migrate:seed|reset|drop]');
      process.exit(1);
  }
}

module.exports = {
  runMigrations,
  runSeedData,
  dropTables,
  resetDatabase
};
