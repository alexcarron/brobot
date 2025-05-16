const { logWithColor, LogColor, logError, logInfo } = require("./logging-utils");

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

		it('throws an error with a null message', () => {
			const message = null;
			const color = LogColor.GREEN; // Green
			expect(() => logWithColor(message, color)).toThrowError(TypeError);
		});

		it('throws an error with an undefined message', () => {
			const message = undefined;
			const color = LogColor.GREEN; // Green
			expect(() => logWithColor(message, color)).toThrowError(TypeError);
		});

		it('throws an error with a non-string message', () => {
			const message = 123;
			const color = LogColor.GREEN; // Green
			expect(() => logWithColor(message, color)).toThrowError(TypeError);
		});

		it('logs a message with a valid color', () => {
			const message = 'Hello, World!';
			const color = LogColor.GREEN; // Green
			logWithColor(message, color);
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith(`\x1b[32m${message}\x1b[0m`);
		});

		it('throws an error with an invalid color', () => {
			const message = 'Hello, World!';
			const color = 'abc'; // Invalid color
			expect(() => logWithColor(message, color)).toThrowError(TypeError);
		});

		it('throws an error with a null color', () => {
			const message = 'Hello, World!';
			const color = null; // Null color
			expect(() => logWithColor(message, color)).toThrowError(TypeError);
		});

		it('throws an error with an undefined color', () => {
			const message = 'Hello, World!';
			const color = undefined; // Undefined color
			expect(() => logWithColor(message, color)).toThrowError(TypeError);
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

		it('throws an error with a null message', () => {
			const message = null;
			expect(() => logInfo(message)).toThrowError('Message must be a string.');
		});

		it('throws an error with an undefined message', () => {
			const message = undefined;
			expect(() => logInfo(message)).toThrowError('Message must be a string.');
		});

		it('throws an error with a non-string message', () => {
			const message = 123;
			expect(() => logInfo(message)).toThrowError('Message must be a string.');
		});
	})
});