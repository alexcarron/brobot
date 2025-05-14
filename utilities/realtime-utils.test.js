const { wait } = require("./realtime-utils");

describe('wait()', () => {
	it('should resolve after specified number duration', async () => {
		const startTime = Date.now();
		await wait(10);
		const endTime = Date.now();
		expect(endTime - startTime).toBeGreaterThan(9); // allow for some margin of error
	});

	it('should resolve after specified object duration', async () => {
		const startTime = Date.now();
		await wait({ milliseconds: 10 });
		const endTime = Date.now();
		expect(endTime - startTime).toBeGreaterThan(9); // allow for some margin of error
	});

	it('should throw error with invalid duration format', async () => {
		expect.assertions(1);
		try {
			await wait(' invalid duration ');
		} catch (error) {
			expect(error.message).toBe('Invalid duration format. Use a number or an object specifying time units.');
		}
	});

	it('should resolve immediately with zero duration', async () => {
		const startTime = Date.now();
		await wait(0);
		const endTime = Date.now();
		expect(endTime - startTime).toBeLessThan(100); // allow for some margin of error
	});

	it('should throw error with negative duration', async () => {
		expect.assertions(1);
		try {
			await wait(-1);
		}
		catch (error) {
			expect(error.message).toBe('Duration cannot be negative.');
		}
	});

	it('should throw error with negative object duration', async () => {
		expect.assertions(1);
		try {
			await wait({ milliseconds: 900 , seconds: -10, });
		}
		catch (error) {
			expect(error.message).toBe('Total duration cannot be negative.');
		}
	});
});