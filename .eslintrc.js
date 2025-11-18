module.exports = {
  root: true,
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
  rules: {
    // JS rules (apply to JS files)
    'require-await': 'error',
    'no-floating-promise/no-floating-promise': 'error',
    'promise/always-return': 'error',
    'jsdoc/no-undefined-types': ['warn', { disableReporting: true, markVariablesAsUsed: true }],
    'jsdoc/check-param-names': ['error', { checkDestructured: false }],
    'jsdoc/valid-types': 'off',
  },
  overrides: [
    // TypeScript files
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
			parserOptions: {
				project: './tsconfig.json', // <- Required for type-aware rules
				tsconfigRootDir: __dirname, // Ensure ESLint finds the tsconfig
				sourceType: 'module',
			},
      plugins: ['@typescript-eslint'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:promise/recommended',
        'plugin:jsdoc/recommended',
        'plugin:jest/recommended',
      ],
      rules: {
        // TS-specific rules
        '@typescript-eslint/require-await': 'error',
				'@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-floating-promises': 'error',
				'@typescript-eslint/no-explicit-any': 'off',
				'jsdoc/require-param-type': 'off',    // ignore type in @param
				'jsdoc/require-returns-type': 'off',  // ignore type in @returns
				'jest/expect-expect': 'off',
				'@typescript-eslint/ban-ts-comment': 'off',
        // you can add TS overrides here
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
