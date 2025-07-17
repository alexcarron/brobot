module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	transform: {
		// Transform .ts/.tsx files with ts-jest
    '^.+\\.tsx?$': 'ts-jest',
  },

  testRunner: 'jest-jasmine2',
  setupFilesAfterEnv: ['why-so-loud-jest'],
  verbose: false,
	moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
	testMatch: [
			"**/?(*.)+(spec|test).[tj]s?(x)"
	],
  transformIgnorePatterns: [
    '/node_modules/',           // Ignore transforming node_modules by default
  ],
};