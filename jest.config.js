module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest', // <-- include both .ts and .js files
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