import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import eslintImport from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  {
    files: ['**/*.ts'],
    settings: {
      'import/resolver': {
        typescript: {
          extensions: [".ts"]
        },
      },
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'prettier': prettier,
      'import': eslintImport,
      'simple-import-sort': simpleImportSort,
    },
    ignores: [
      'node_modules',
      'dist',
      'eslint.config.mjs',
      'coverage',
      'coverage/*',
      'coverage/**/*'
    ],
    rules: {
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs['recommended-requiring-type-checking'].rules,
      ...prettier.configs.recommended.rules,

      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/require-await': 'off',
      'no-console': ['warn', { allow: ['error'] }],
      'no-debugger': 'warn',
      'import/no-unresolved': 'error',
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        {
          blankLine: 'always',
          prev: ['const', 'let', 'var', 'import'],
          next: '*',
        },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var', 'import'],
          next: ['const', 'let', 'var', 'import'],
        },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Naming conventions based on naming-cheatsheet: https://github.com/kettanaito/naming-cheatsheet
      '@typescript-eslint/naming-convention': [
        'warn',
        // Default rule for all identifiers (excluding const variables)
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
          filter: {
            regex: '^[A-Z_]+$',
            match: false
          }
        },
        // Prevent interfaces starting with 'I'
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false
          }
        },
        // Enforce PascalCase for classes and types
        {
          selector: ['class', 'typeLike'],
          format: ['PascalCase']
        },
        // Enforce UPPER_CASE for constants (only for true constants)
        {
          selector: 'variable',
          modifiers: ['const'],
          types: ['string', 'number', 'boolean'],
          format: ['UPPER_CASE'],
          filter: {
            regex: '^[A-Z_]+$',
            match: false
          }
        }
      ],

      // Code complexity and size rules
      'max-depth': ['error', 4],
      'max-lines': ['error', 300],
      'max-lines-per-function': ['error', 50],
      'max-nested-callbacks': ['error', 3],
      'max-params': ['error', 5],
      'max-statements': ['error', 50],
      'complexity': ['error', 15],
    },
  },
  // Override for test files to allow more nested callbacks and longer functions
  {
    files: ['**/*.test.ts', '**/*.test.js'],
    rules: {
      'max-nested-callbacks': ['error', 4],
      'max-lines-per-function': ['error', 150],
    },
  },
];
