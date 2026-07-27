// Flat config. `eslint-config-expo/flat` bundles the React, React Hooks and
// React Native rules that match the installed SDK.
//
// `eslint-config-prettier` must stay last: it switches off every stylistic rule
// that would otherwise fight Prettier.
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'web-build/*', 'coverage/*', 'node_modules/*', '.expo/*'],
  },
];
