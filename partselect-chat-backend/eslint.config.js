import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      // Allow any types for now since this is a development project
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      
      // Standard good practices
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off', // Allow console for debugging
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      'drizzle/',
      'migrations/',
      '*.js',
      '*.mjs',
    ],
  }
);