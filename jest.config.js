module.exports = {
  testRunner: 'jest-jasmine2',
  setupFilesAfterEnv: ['why-so-loud-jest'],
  verbose: false,
	testMatch: [
			"**/?(*.)+(spec|test).[tj]s?(x)"
	]
};