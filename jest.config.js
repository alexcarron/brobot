module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	transform: {
    '^.+\\.tsx?$': '@swc/jest',
  },
	cache: true,
  verbose: false,
	moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
	testMatch: [
		"**/?(*.)+(spec|test).[tj]s?(x)"
	],
  transformIgnorePatterns: [
		'/node_modules/',           // Ignore transforming node_modules by default
  ],

	// Uncomment the following to show the test timing in the console
	// setupFilesAfterEnv: ["<rootDir>/utilities/jest/jest.global-timing.ts"],
	// reporters: [
	// 	'default', '<rootDir>/utilities/jest/timing-reporter.ts'
	// ]
};