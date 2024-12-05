module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@react/(.*)$': '<rootDir>/src/react/$1',
    '^@rust/(.*)$': '<rootDir>/src/rust/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '^../rust/src/lib$': '<rootDir>/src/test/__mocks__/rust-lib.mock.ts',
    '^../../rust/src/lib$': '<rootDir>/src/test/__mocks__/rust-lib.mock.ts',
    '^../../core/(.*)$': '<rootDir>/src/core/$1',
    '^../react/(.*)$': '<rootDir>/src/react/$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/benchmark/**'
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }
  },
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  testTimeout: 120000 // Increase timeout for long-running tests
};
