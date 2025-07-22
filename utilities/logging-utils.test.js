const { logWithColor, LogColor, logError, logInfo, logWarning, logDebug, logSuccess, logWithColors } = require("./logging-utils");

describe('logging-utils.js', () => {
	const mockNowDate = new Date('2023-05-01T12:00:00Z'); // May 1, 2023, 12:00:00 PM UTC-07:00

	beforeEach(() => {
		// Mock console.log(), console.error(), and console.trace() to prevent actual logging during testing.
		jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'error').mockImplementation(() => {});
		jest.spyOn(console, 'trace').mockImplementation(() => {});

		// Mock Date constructor to return the mocked date for testing purposes.
		jest.spyOn(global, 'Date').mockImplementation(() => mockNowDate);
  });

	afterEach(() => {
		jest.restoreAllMocks();
  });

	describe('logWithColor()', () => {
		it('logs a message with a valid color', () => {
			const message = 'Hello, World!';
			const color = LogColor.GREEN; // Green
			logWithColor(message, color);
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith(`\x1b[32m${message}\x1b[0m`);
		});

		it('logs an empty message with a valid color', () => {
			const message = '';
			const color = LogColor.GREEN; // Green
			logWithColor(message, color);
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith(`\x1b[32m${message}\x1b[0m`);
		});

		it('should not throw an error with a null message', () => {
			const message = null;
			const color = LogColor.GREEN; // Green
			expect(() => logWithColor(message, color)).not.toThrow(TypeError);
		});

		it('should not throw an error with an undefined message', () => {
			const message = undefined;
			const color = LogColor.GREEN; // Green
			expect(() => logWithColor(message, color)).not.toThrow(TypeError);
		});

		it('should not throw an error with a non-string message', () => {
			const message = 123;
			const color = LogColor.GREEN; // Green
			expect(() => logWithColor(message, color)).not.toThrow(TypeError);
		});
		
		it('throws an error with an invalid color', () => {
			const message = 'Hello, World!';
			const color = 'abc'; // Invalid color
			expect(() => logWithColor(message, color)).toThrow(TypeError);
		});

		it('throws an error with a null color', () => {
			const message = 'Hello, World!';
			const color = null; // Null color
			expect(() => logWithColor(message, color)).toThrow(TypeError);
		});

		it('throws an error with an undefined color', () => {
			const message = 'Hello, World!';
			const color = undefined; // Undefined color
			expect(() => logWithColor(message, color)).toThrow(TypeError);
		});

	});

	describe('logError()', () => {
		it('should log error message with timestamp and red color', () => {
			const errorMessage = 'Test error message';
			logError(errorMessage);

			expect(console.log).toHaveBeenCalledWith(
				`\x1b[31m[ERROR] 2023-05-01T12:00:00.000Z: ${errorMessage}\x1b[0m`
			);
			expect(console.trace).toHaveBeenCalledWith('Error location:');
		});

		it('should log error message without error when error is null', () => {
			const errorMessage = 'Test error message';
			logError(errorMessage, null);

			expect(console.log).toHaveBeenCalledWith(
				`\x1b[31m[ERROR] 2023-05-01T12:00:00.000Z: ${errorMessage}\x1b[0m`
			);
			expect(console.error).not.toHaveBeenCalled();
			expect(console.trace).toHaveBeenCalledWith('Error location:');
		});
	});

	describe('logWarning()', () => {
		it('should log a non-empty string message', () => {
			const message = 'Hello World!';
			logWarning(message);
			expect(console.log).toHaveBeenCalled();
		});

		it('should not log an empty string message', () => {
			const message = '';
			logWarning(message);
			expect(console.log).not.toHaveBeenCalled();
		});

		it('should not throw an error with a null message', () => {
			const message = null;
			expect(() => logWarning(message)).not.toThrow('Message must be a string.');
		});

		it('should not throw an error with an undefined message', () => {
			const message = undefined;
			expect(() => logWarning(message)).not.toThrow('Message must be a string.');
		});

		it('should not throw an error with a non-string message', () => {
			const message = 123;
			expect(() => logWarning(message)).not.toThrow('Message must be a string.');
		});
	});

	describe('logInfo()', () => {
		it('should log a non-empty string message', () => {
			const message = 'Hello World!';
			logInfo(message);
			expect(console.log).toHaveBeenCalled();
		});

		it('should not log an empty string message', () => {
			const message = '';
			logInfo(message);
			expect(console.log).not.toHaveBeenCalled();
		});

		it('should not throw an error with a null message', () => {
			const message = null;
			expect(() => logInfo(message)).not.toThrow('Message must be a string.');
		});

		it('should not throw an error with an undefined message', () => {
			const message = undefined;
			expect(() => logInfo(message)).not.toThrow('Message must be a string.');
		});

		it('should not throw an error with a non-string message', () => {
			const message = 123;
			expect(() => logInfo(message)).not.toThrow('Message must be a string.');
		});
	});

	describe('logSuccess()', () => {
		it('should log a success message with a valid string', () => {
			const message = 'Test success message';
			logSuccess(message);
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith(`\x1b[32m[SUCCESS]\x1b[0m ${message}`);
		});

		it('should not log a success message with an empty string', () => {
			const message = '';
			logSuccess(message);
			expect(console.log).not.toHaveBeenCalled();
		});

		it('should not throw an error with a null message', () => {
			const message = null;
			expect(() => logSuccess(message)).not.toThrow(TypeError);
		});

		it('should not throw an error with an undefined message', () => {
			const message = undefined;
			expect(() => logSuccess(message)).not.toThrow(TypeError);
		});

		it('should not throw an error with a non-string message', () => {
			const message = 123;
			expect(() => logSuccess(message)).not.toThrow(TypeError);
		});
	});

	describe('logDebug()', () => {
		it('should log a debug message with a valid string', () => {
			const message = 'Hello World!';
			logDebug(message);
			expect(console.log).toHaveBeenCalledTimes(1);
		});

		it('should not log a debug message with an empty string', () => {
			const message = '';
			logDebug(message);
			expect(console.log).not.toHaveBeenCalled();
		});

		it('should not throw an error with a null message', () => {
			const message = null;
			expect(() => logDebug(message)).not.toThrow('Message must be a string.');
		});

		it('should not throw an error with an undefined message', () => {
			const message = undefined;
			expect(() => logDebug(message)).not.toThrow('Message must be a string.');
		});

		it('should not throw an error with a non-string message', () => {
			const message = 123;
			expect(() => logDebug(message)).not.toThrow('Message must be a string.');
		});

		it('should log a debug message with trace when includeTrace set to true', () => {
			const message = 'Hello World!';
			logDebug(message, true);
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.trace).toHaveBeenCalledTimes(1);
		});

		it('should log a debug message without trace when includeTrace set to false', () => {
			const message = 'Hello World!';
			logDebug(message, false);
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.trace).not.toHaveBeenCalled();
		});

		it('should log a debug message without trace when includeTrace not set', () => {
			const message = 'Hello World!';
			logDebug(message);
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.trace).not.toHaveBeenCalled();
		});
	});

	describe('logWithColors()', () => {
		it('throws an error when not using template literal', () => {
			expect(() => logWithColors('hello')).toThrow(TypeError);
		});

		it('handle when expression is not an array', () => {
			logWithColors`hello ${'world'}`;
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith('hello world');
		});

		it('does not throw an error when strings contains non-string elements', () => {
			expect(() => logWithColors(['hello', 123], ['world', LogColor.GREEN])).not.toThrow(TypeError);
		});

		it('does not throw an error when expressions contains tuple elements with incorrect length', () => {
			expect(() =>
				logWithColors`hello ${['world', LogColor.GREEN, 'extra']}`
			).not.toThrow(TypeError);
		});

		it('throws an error when expressions contains tuple elements with invalid color', () => {
			expect(() => logWithColors(['hello'], ['world', 123])).toThrow(TypeError);
		});

		it('logs the correct formatted string when strings and expressions are valid in template literal', () => {
			logWithColors`This is a message with a ${['green', LogColor.GREEN]} and ${['blue', LogColor.BLUE]} word.`;
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith('This is a message with a \x1b[32mgreen\x1b[0m and \x1b[34mblue\x1b[0m word.');
		});

		it('logs the correct formatted string when expressions is empty', () => {
			logWithColors(['hello', 'world']);
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith('helloworld');
		});

		it('logs the correct formatted string when strings contains only one element', () => {
			logWithColors`hello ${['world', LogColor.GREEN]}`;
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith('hello \x1b[32mworld\x1b[0m');
		});

		it('logs the correct formatted string when an expression doesnt contain a color', () => {
			logWithColors`hello ${'world'}`;
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith('hello world');
		});
	});
});