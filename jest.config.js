// jest-expo supplies the React Native transform, module mocks and
// transformIgnorePatterns needed to run tests against the Expo runtime.
module.exports = {
  preset: 'jest-expo',
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/*.config.js',
  ],
};
