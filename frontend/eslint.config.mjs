import eslintPluginAngular from '@angular-eslint/eslint-plugin';
import eslintPluginAngularTemplate from '@angular-eslint/eslint-plugin-template';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '**/*.html'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.spec.json'],
        sourceType: 'module',
      },
    },
    plugins: {
      '@angular-eslint': eslintPluginAngular,
      prettier: prettierPlugin,
    },
    rules: {
      ...eslintPluginAngular.configs.recommended.rules,
      'prettier/prettier': 'error',
      '@angular-eslint/component-class-suffix': ['error', { suffixes: ['Component', 'View'] }],
      '@angular-eslint/directive-class-suffix': ['error', { suffixes: ['Directive'] }],
    },
  },
  {
    files: ['**/*.html'],
    plugins: {
      '@angular-eslint/template': eslintPluginAngularTemplate,
    },
    rules: {
      ...eslintPluginAngularTemplate.configs.recommended.rules,
    },
  },
  prettierConfig,
];
