module.exports = {
  root: true,
  ignorePatterns: ['archived/**'],
  env: {
    node: true,
    es2021: true,
    "jest/globals": true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['jsdoc', 'promise', 'no-floating-promise', 'jest'],
  extends: [
    'eslint:recommended',
    'plugin:promise/recommended',
    'plugin:jsdoc/recommended',
    'plugin:jest/recommended',
  ],
	// JavaScript rules (applies to .js files)
  rules: {
    'require-await': 'error',
    'no-floating-promise/no-floating-promise': 'error',
    'promise/always-return': 'error',
    'jsdoc/no-undefined-types': ['warn', { disableReporting: true, markVariablesAsUsed: true }],
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/check-param-names': ['error', { checkDestructured: false }],
    'jsdoc/valid-types': 'off',
    'no-console': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    // Files whose entire purpose is writing to the console
    {
      files: [
        'utilities/logging-utils.ts',
        'utilities/logging-utils.test.ts',
        'utilities/jest/**',
        'utilities/debug/rapid-call-detector.ts',
        'services/namesmith/scripts/**',
        'services/namesmith/telemetry/analysis/**',
      ],
      rules: {
        'no-console': 'off',
      },
    },
    // TypeScript files
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
			parserOptions: {
				project: './tsconfig.eslint.json',
				tsconfigRootDir: __dirname,
				sourceType: 'module',
			},
      plugins: ['@typescript-eslint'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:promise/recommended',
        'plugin:jsdoc/recommended',
        'plugin:jest/recommended',
      ],
			// TypeScript rules (applies to .ts files)
      rules: {
        '@typescript-eslint/require-await': 'error',
				'@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-floating-promises': 'error',
				'@typescript-eslint/no-explicit-any': 'off',
				'jsdoc/require-param-type': 'off',
				'jsdoc/require-returns-type': 'off',
				'jsdoc/require-jsdoc': 'off',
				'jest/expect-expect': 'off',
				'@typescript-eslint/ban-ts-comment': 'off',
				"@typescript-eslint/no-unused-expressions": ["error", { "allowTaggedTemplates": true }]
      },
    },
    // Test files
    {
      files: ['**/*.test.js', '**/__tests__/**/*.js', '**/*.test.ts', '**/__tests__/**/*.ts'],
      env: {
        jest: true,
      },
    },
  ],
  settings: {
    jsdoc: { mode: 'typescript' },
  },
};
