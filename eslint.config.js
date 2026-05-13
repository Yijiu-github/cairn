// ESLint Flat Config (ESLint 9+)
// 仓库根唯一配置，包级别可 extend 不可覆盖核心规则。
//
// 启用此配置前需安装：
//   pnpm add -D -w eslint typescript typescript-eslint \
//     eslint-plugin-import eslint-plugin-unicorn \
//     eslint-config-prettier @vitest/eslint-plugin \
//     globals
//
// 文档：https://eslint.org/docs/latest/use/configure/configuration-files

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // 1. 全局忽略
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/out/**',
      '**/.turbo/**',
      '**/.vite/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/*.generated.*',
      'release/**',
      'app-builds/**',
    ],
  },

  // 2. 基础 JS 规则
  js.configs.recommended,

  // 3. TypeScript strict + stylistic
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // 4. TS 项目级别配置
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2024,
      },
    },
    plugins: {
      import: importPlugin,
      unicorn,
    },
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: ['./tsconfig.base.json'] },
        node: true,
      },
    },
    rules: {
      // --- 类型严格 ---
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // --- 项目硬约束（来自 coding-standards.md）---
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-globals': [
        'error',
        {
          name: 'process',
          message: '请通过统一 config 模块访问环境变量，不要直接使用 process.env。',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[object.name="process"][property.name="env"]',
          message: '请通过 @cairn/config 访问环境变量，禁止直接 process.env.X。',
        },
      ],

      // --- import 顺序 ---
      'import/order': [
        'error',
        {
          'groups': [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'type',
          ],
          'newlines-between': 'always',
          'pathGroups': [
            { pattern: '@cairn/**', group: 'internal', position: 'after' },
          ],
          'pathGroupsExcludedImportTypes': ['type'],
          'alphabetize': { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-default-export': 'warn',
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',

      // --- unicorn 精选 ---
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'unicorn/no-null': 'off', // null 在 DB 边界处仍然有用
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-top-level-await': 'error',
      'unicorn/throw-new-error': 'error',
      'unicorn/no-array-for-each': 'off',
      'unicorn/prevent-abbreviations': 'off', // 太激进
    },
  },

  // 5. 测试文件
  {
    files: ['**/*.{spec,test}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'import/no-default-export': 'off',
    },
  },

  // 6. 配置文件（CJS / 脚本）
  {
    files: ['**/*.{js,cjs,mjs}', '**/*.config.{ts,js,mjs}'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-default-export': 'off',
    },
  },

  // 7. 关闭与 Prettier 冲突的规则（必须放最后）
  prettier,
);
