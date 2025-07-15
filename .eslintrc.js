module.exports = {
	root: true,
  env: {
    node: true,
    es2021: true,  // modern JS support,
    "jest/globals": true,  // Recognize jest, describe, test, etc.
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'jsdoc',
    'promise',
		'no-floating-promise',
    'jest',
  ],
  extends: [
    'eslint:recommended',
    'plugin:promise/recommended',
		// includes best-practice promise rules :contentReference[oaicite:1]{index=1}
    'plugin:jsdoc/recommended',
		// basic JSDoc validation :contentReference[oaicite:2]{index=2}
    'plugin:jest/recommended',
	],
  rules: {
    // Promise rules
    'require-await': 'error',
    'no-floating-promise/no-floating-promise': 'error',
		'promise/always-return': 'error',

    // JSDoc rules
    'jsdoc/no-undefined-types': ['warn', {
      disableReporting: true,
      markVariablesAsUsed: true,
    }],
    'jsdoc/require-jsdoc': ['warn', {
      require: { FunctionDeclaration: true, ClassDeclaration: true }
    }],
  },
  settings: {
    jsdoc: {
      // treat types in JSDoc as valid; helps with resolving references
      mode: 'typescript',
    },
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/__tests__/**/*.js'],
      env: {
        jest: true,
      },
    },
  ],
};
