/**
 * Test Setup
 * Global test configuration and setup
 */

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  
  // You can add global setup here, such as:
  // - Database connection setup
  // - Test data seeding
  // - Mock configurations
});

// Global test teardown
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // You can add global cleanup here, such as:
  // - Database cleanup
  // - Close connections
  // - Remove test files
});

// Mock console methods in test environment to reduce noise
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    // Uncomment to suppress console.log in tests
    // log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}
