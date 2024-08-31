import type { JestConfigWithTsJest } from 'ts-jest'

export const config: JestConfigWithTsJest = {
  clearMocks: true,
  testTimeout: 20000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!**/*.json',
    '!?(**)/?(*.|*-)types.ts',
    '!**/models/*',
    '!**/__snapshots__/*',
    '!**/scripts/*'
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
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  testMatch: ['**/*.test.(ts)', '**/*.pacttest.(ts)'],
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['dist'],
  coverageThreshold: {
    global: {
      statements: 0,
      branches: 0,
      lines: 0,
      functions: 0
    }
  }
}

export default config
