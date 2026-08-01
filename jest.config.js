module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  resolver: 'react-native-worklets/jest/resolver.js',

  moduleNameMapper: {
    '^react-native-gesture-handler/ReanimatedSwipeable$':
      '<rootDir>/node_modules/react-native-gesture-handler/src/components/ReanimatedSwipeable',
  },

  testTimeout: 30000,

  coverageThreshold: {
    global: { statements: 98, branches: 96, functions: 97, lines: 98 },
    './src/domain/': { statements: 98, branches: 96, functions: 97, lines: 98 },
    './src/data/': { statements: 96, branches: 94, functions: 97, lines: 97 },
    './src/state/': { statements: 100, branches: 95, functions: 100, lines: 100 },
  },
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/*.config.js',
  ],
};
