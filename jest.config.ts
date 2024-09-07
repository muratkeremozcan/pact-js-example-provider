import type { JestConfigWithTsJest } from 'ts-jest'

export const config: JestConfigWithTsJest = {
  clearMocks: true,
  testTimeout: 10000,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts*', // Include all source TypeScript files
    '!src/server.ts', // routes are tested via e2e
    '!src/**/*.pacttest.ts', // Exclude pacttest files
    '!**/test-helpers/**', // Exclude test helpers
    '!**/*.json',
    '!?(**)/?(*.|*-)types.ts',
    '!**/models/*',
    '!**/__snapshots__/*',
    '!**/scripts/*',
    '!**/node_modules/**'
  ],
  coverageDirectory: './coverage',
  coverageReporters: [
    'clover',
    'json',
    'lcov',
    ['text', { skipFull: true }],
    'json-summary'
  ],
  moduleDirectories: ['node_modules', 'src'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }]
  },
  testMatch: ['**/*.test.ts'],
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['dist'],
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 50,
      lines: 50,
      functions: 50
    }
  },
  globalSetup: './scripts/global-setup.js',
  globalTeardown: './scripts/global-teardown.js'
}

export default config
