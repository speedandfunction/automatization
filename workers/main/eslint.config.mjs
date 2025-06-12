import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import eslintImport from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  {
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
      
      // Code complexity and size rules
      'max-depth': ['error', 4],
      'max-lines': ['error', 300],
      'max-nested-callbacks': ['error', 3],
      'max-params': ['error', 5],
      'max-statements': ['error', 50],
      'complexity': ['error', 15],
    },
  },
  // Override for test files to allow more nested callbacks
  {
    files: ['**/*.test.ts', '**/*.test.js'],
    rules: {
      'max-nested-callbacks': ['error', 4],
    },
  },
];
