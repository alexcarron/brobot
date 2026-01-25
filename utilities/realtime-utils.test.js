const { wait } = require("./realtime-utils");

describe('wait()', () => {
	it('should resolve after specified number duration', async () => {
		const startTime = Date.now();
		await wait(10);
		const endTime = Date.now();
		expect(endTime - startTime).toBeGreaterThanOrEqual(10); // allow for some margin of error
	});

	it('should resolve after specified object duration', async () => {
		const startTime = Date.now();
		await wait({ milliseconds: 10 });
		const endTime = Date.now();
		expect(endTime - startTime).toBeGreaterThanOrEqual(10); // allow for some margin of error
	});

	it('should throw error with invalid duration format', () => {
		expect(() => wait(' invalid duration ')).toThrow('Invalid duration format. Use a number or an object specifying time units.');
	});

	it('should resolve immediately with zero duration', async () => {
		const startTime = Date.now();
		await wait(0);
		const endTime = Date.now();
		expect(endTime - startTime).toBeLessThan(100); // allow for some margin of error
	});

	it('should throw error with negative duration', () => {
		expect(() => wait(-10)).toThrow('Duration cannot be negative.');
	});

	it('should throw error with negative object duration', () => {
		expect(() =>
			wait({ milliseconds: 900 , seconds: -10, })
		).toThrow('Total duration cannot be negative.');
	});
});