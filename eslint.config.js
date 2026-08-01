const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

const MONEY_MODULE = 'src/domain/money.ts';

const BIG_JS_MESSAGE = `Import the money helpers from ${MONEY_MODULE} instead. It is the only module allowed to configure big.js.`;

const BIG_JS_SPECIFIER_PATTERN = String.raw`/^big\.js(\/.*)?$/`;

module.exports = [
  ...expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'web-build/*', 'coverage/*', 'node_modules/*', '.expo/*'],
  },

  {
    files: ['jest.setup.js'],
    languageOptions: { globals: { jest: 'readonly' } },
  },

  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [MONEY_MODULE],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['big.js', 'big.js/*'],
              message: BIG_JS_MESSAGE,
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: `ImportExpression > Literal[value=${BIG_JS_SPECIFIER_PATTERN}]`,
          message: BIG_JS_MESSAGE,
        },
        {
          selector: `CallExpression[callee.name='require'] > Literal[value=${BIG_JS_SPECIFIER_PATTERN}]`,
          message: BIG_JS_MESSAGE,
        },
      ],
    },
  },
];
