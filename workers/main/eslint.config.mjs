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
          extensions: ['.ts'],
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
      'coverage/**/*',
    ],
    rules: {
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs['recommended-requiring-type-checking'].rules,
      ...prettier.configs.recommended.rules,

      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
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
        // Default rule for all identifiers (excluding string literals and SQL constants)
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
          filter: {
            regex: '^[\'"].*[\'"]$|^[A-Z_]+$',
            match: false,
          },
        },
        // Object literal properties: allow camelCase, snake_case, MongoDB operators, dot notation, and quoted strings
        {
          selector: 'objectLiteralProperty',
          format: null,
          custom: {
            regex:
              '^[a-zA-Z_][a-zA-Z0-9_]*$|^[\'"].*[\'"]$|^[0-9-]+$|^[A-Za-z][A-Za-z0-9-]*$|^\\$[a-zA-Z]+$|^[a-zA-Z_][a-zA-Z0-9_.]*$',
            match: true,
          },
        },
        // Allow PascalCase and snake_case for API/DB compatibility
        {
          selector: 'typeProperty',
          format: null,
          custom: {
            regex: '^[A-Z][a-zA-Z0-9]*$|^[a-z][a-zA-Z0-9_]*$',
            match: true,
          },
        },
        // Prevent interfaces starting with 'I'
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
        },
        // Enforce PascalCase for classes and types
        {
          selector: ['class', 'typeLike'],
          format: ['PascalCase'],
        },
        // Enforce PascalCase or UPPER_CASE for enum members
        {
          selector: 'enumMember',
          format: ['PascalCase', 'UPPER_CASE'],
        },
        // Boolean variables with prefixes (is, has, should, can, will, did)
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'has', 'should', 'can', 'will', 'did'],
        },
        // Variables that represent classes/models (PascalCase) - only for specific patterns
        {
          selector: 'variable',
          format: ['PascalCase'],
          filter: {
            regex:
              '^(FinAppRepository|TargetUnitRepository|TestModel|EmployeeModel|ProjectModel|SlackServiceNoToken|SlackServiceNoChannel)$',
            match: true,
          },
        },
        // Parameters that can be snake_case (for API/DB compatibility)
        {
          selector: 'parameter',
          format: null,
          custom: {
            regex: '^[a-z][a-zA-Z0-9_]*$',
            match: true,
          },
        },
        // Function naming with A/HC/LC pattern prefixes
        {
          selector: 'function',
          format: ['PascalCase'],
          prefix: [
            // Action verbs
            'get',
            'setup',
            'set',
            'reset',
            'remove',
            'delete',
            'compose',
            'handle',
            'create',
            'init',
            'build',
            // Validation/Testing
            'validate',
            'test',
            'expect',
            'mock',
            'try',
            // Formatting/Transformation
            'format',
            'transform',
            'convert',
            // Generation/Processing
            'generate',
            'process',
            'parse',
            // File operations
            'read',
            'write',
            'save',
            'load',
            // Main operations
            'run',
            'start',
            'stop',
            'main',
          ],
        },
        // Creation/Initialization functions should use PascalCase after prefix
        {
          selector: 'function',
          format: ['PascalCase'],
          prefix: ['create', 'init', 'build'],
        },
      ],

      // Code complexity and size rules
      'max-depth': ['error', 4],
      'max-lines': ['error', 300],
      'max-lines-per-function': ['error', 50],
      'max-nested-callbacks': ['error', 3],
      'max-params': ['error', 5],
      'max-statements': ['error', 50],
      'complexity': ['error', 15],
      'max-classes-per-file': ['error', 1],
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
