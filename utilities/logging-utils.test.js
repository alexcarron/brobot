const { logWithColor, LogColor } = require("./logging-utils");

describe('logWithColor()', () => {
	beforeEach(() => {
		jest.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		console.log.mockRestore();
	});

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