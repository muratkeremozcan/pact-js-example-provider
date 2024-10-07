import type { JestConfigWithTsJest } from 'ts-jest'

export const config: JestConfigWithTsJest = {
  clearMocks: true,
  testTimeout: 10000,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts*', // Include all source TypeScript files
    '!src/server*.ts', // routes are tested via e2e
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
  coverageThreshold: {
    global: {
      statements: 40,
      branches: 40,
      lines: 40,
      functions: 40
    }
  },
  moduleDirectories: ['node_modules', 'src'],
  modulePathIgnorePatterns: ['dist'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }]
  },
  testMatch: ['**/*.test.ts'],
  testEnvironment: 'node'
}

export default config
