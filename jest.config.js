/**
 * Jest Configuration for WorkIn Extension
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.js',
    'background/**/*.js',
    'content/**/*.js',
    'popup/**/*.js',
    'shared/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Globals
  globals: {
    chrome: {}
  }
};