import type { JestConfigWithTsJest } from 'ts-jest'

export const config: JestConfigWithTsJest = {
  clearMocks: true,
  testTimeout: 30000, // Can be longer due to pact tests
  collectCoverage: false, // You can disable coverage for pact tests if needed
  moduleDirectories: ['node_modules', 'src'],
  modulePathIgnorePatterns: ['dist'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }]
  },
  testMatch: ['**/*.pacttest.ts'], // Pact test file match
  testEnvironment: 'node',
  globalSetup: './scripts/global-setup.ts', // runs before all tests
  globalTeardown: './scripts/global-teardown.ts', // runs after all tests
  setupFilesAfterEnv: ['./scripts/setup-after-env.ts'] // runs before each test file
}

export default config
