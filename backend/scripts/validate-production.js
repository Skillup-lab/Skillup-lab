/**
 * Production Validation Script
 * Validates that the application is properly configured for production deployment
 */

const { testConnection } = require('../config/database');
const { config } = require('../config/config');

async function validateProduction() {
  console.log('🔍 Validating SkillUp Lab for production deployment...\n');
  
  let allChecks = true;
  
  // Environment validation
  console.log('📋 Environment Configuration:');
  allChecks &= checkEnvironment();
  
  // Database validation
  console.log('\n🗄️ Database Configuration:');
  allChecks &= await checkDatabase();
  
  // Security validation
  console.log('\n🔒 Security Configuration:');
  allChecks &= checkSecurity();
  
  // Dependencies validation
  console.log('\n📦 Dependencies:');
  allChecks &= await checkDependencies();
  
  // Final result
  console.log('\n' + '='.repeat(50));
  if (allChecks) {
    console.log('✅ Production validation PASSED');
    console.log('🚀 Application is ready for production deployment!');
    console.log('\nNext steps:');
    console.log('1. Deploy to your production platform');
    console.log('2. Configure DNS and SSL certificates');
    console.log('3. Set up monitoring and alerts');
    console.log('4. Test all functionality in production');
  } else {
    console.log('❌ Production validation FAILED');
    console.log('⚠️  Please fix the issues above before deploying to production');
    process.exit(1);
  }
}

function checkEnvironment() {
  let passed = true;
  
  // Check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ NODE_ENV set to production');
  } else {
    console.log('❌ NODE_ENV should be set to "production"');
    passed = false;
  }
  
  // Check required variables
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'CORS_ORIGIN'];
  for (const varName of required) {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is configured`);
    } else {
      console.log(`❌ ${varName} is missing`);
      passed = false;
    }
  }
  
  // Check JWT secret lengths
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
    console.log('✅ JWT_SECRET is sufficiently long');
  } else {
    console.log('❌ JWT_SECRET must be at least 32 characters');
    passed = false;
  }
  
  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length >= 32) {
    console.log('✅ JWT_REFRESH_SECRET is sufficiently long');
  } else {
    console.log('❌ JWT_REFRESH_SECRET must be at least 32 characters');
    passed = false;
  }
  
  // Check CORS origins
  if (process.env.CORS_ORIGIN && !process.env.CORS_ORIGIN.includes('localhost')) {
    console.log('✅ CORS_ORIGIN configured for production (no localhost)');
  } else {
    console.log('❌ CORS_ORIGIN should not include localhost in production');
    passed = false;
  }
  
  return passed;
}

async function checkDatabase() {
  let passed = true;
  
  try {
    // Test database connection
    const connected = await testConnection();
    if (connected) {
      console.log('✅ Database connection successful');
    } else {
      console.log('❌ Database connection failed');
      passed = false;
    }
    
    // Check if DATABASE_URL is PlanetScale
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('planetscale.com')) {
      console.log('✅ Using PlanetScale database');
    } else {
      console.log('⚠️  DATABASE_URL does not appear to be PlanetScale');
    }
    
    // Check SSL requirement
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslaccept=strict')) {
      console.log('✅ SSL enabled for database connection');
    } else {
      console.log('❌ Database connection should use SSL (sslaccept=strict)');
      passed = false;
    }
    
  } catch (error) {
    console.log('❌ Database validation failed:', error.message);
    passed = false;
  }
  
  return passed;
}

function checkSecurity() {
  let passed = true;
  
  // Check bcrypt salt rounds
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  if (saltRounds >= 12) {
    console.log(`✅ Bcrypt salt rounds: ${saltRounds} (secure)`);
  } else {
    console.log(`❌ Bcrypt salt rounds: ${saltRounds} (should be >= 12)`);
    passed = false;
  }
  
  // Check rate limiting
  const rateLimit = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
  if (rateLimit <= 1000) {
    console.log(`✅ Rate limiting configured: ${rateLimit} requests`);
  } else {
    console.log(`⚠️  Rate limit seems high: ${rateLimit} requests`);
  }
  
  // Check security headers
  if (process.env.ENABLE_SECURITY_HEADERS !== 'false') {
    console.log('✅ Security headers enabled');
  } else {
    console.log('❌ Security headers should be enabled in production');
    passed = false;
  }
  
  return passed;
}

async function checkDependencies() {
  let passed = true;
  
  try {
    // Check for security vulnerabilities
    const { execSync } = require('child_process');
    
    try {
      execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
      console.log('✅ No moderate or high security vulnerabilities found');
    } catch (error) {
      console.log('⚠️  Security vulnerabilities detected - run "npm audit" for details');
      // Don't fail validation for this, but warn
    }
    
    // Check critical dependencies
    const criticalDeps = [
      'express',
      'mysql2',
      'jsonwebtoken',
      'bcryptjs',
      'helmet',
      'cors',
      'express-rate-limit'
    ];
    
    const packageJson = require('../package.json');
    for (const dep of criticalDeps) {
      if (packageJson.dependencies[dep]) {
        console.log(`✅ ${dep} dependency present`);
      } else {
        console.log(`❌ Missing critical dependency: ${dep}`);
        passed = false;
      }
    }
    
  } catch (error) {
    console.log('⚠️  Could not validate dependencies:', error.message);
  }
  
  return passed;
}

// Additional production readiness checks
function checkProductionReadiness() {
  console.log('\n🎯 Production Readiness Checklist:');
  
  const checklist = [
    'Database schema migrated',
    'Admin user created',
    'SSL certificate configured',
    'Domain DNS configured',
    'Monitoring setup',
    'Backup strategy implemented',
    'Error tracking configured',
    'Performance monitoring enabled'
  ];
  
  console.log('\nManual verification required:');
  checklist.forEach(item => {
    console.log(`☐ ${item}`);
  });
  
  console.log('\n💡 Deployment platforms supported:');
  console.log('  • Railway (recommended)');
  console.log('  • Render');
  console.log('  • Vercel');
  console.log('  • DigitalOcean App Platform');
  console.log('  • AWS/GCP/Azure with Docker');
}

// Run validation
if (require.main === module) {
  validateProduction()
    .then(() => {
      checkProductionReadiness();
    })
    .catch(error => {
      console.error('💥 Validation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { validateProduction };
