module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint',
    'unused-imports',
    'sort-keys-fix',
    'sort-destructure-keys',
    'typescript-sort-keys',
    'prettier',
  ],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'import/extensions': 'off',
    'class-methods-use-this': 'off',
    'func-style': ['error', 'expression'],
    'import/prefer-default-export': 'off',
    'no-underscore-dangle': 'off',
    'prefer-const': 'error',
    'prettier/prettier': 'error',
    'sort-destructure-keys/sort-destructure-keys': [
      'error',
      {
        caseSensitive: false,
      },
    ],
    'sort-keys-fix/sort-keys-fix': 'error',
    'typescript-sort-keys/interface': [
      'error',
      'asc',
      {
        caseSensitive: false,
        natural: false,
        requiredFirst: false,
      },
    ],
    'typescript-sort-keys/string-enum': [
      'error',
      'asc',
      {
        caseSensitive: false,
      },
    ],
    'unused-imports/no-unused-imports': 'error',
  },
}
