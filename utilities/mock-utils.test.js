const { Client } = require("discord.js");
const { mockClient } = require("./mock-utils");

describe('mockClient()', () => {
	describe('.isReady()', () => {
		it('should be a function', () => {
			const client = mockClient();
			expect(typeof client.isReady).toBe('function');
		});

		it('should return true when isReady option is true', () => {
			const client = mockClient({ isReady: true });
			expect(client.isReady()).toBe(true);
		});

		it('should return false when isReady option is false', () => {
			const client = mockClient({ isReady: false });
			expect(client.isReady()).toBe(false);
		});

		it('should return true by default', () => {
			const client = mockClient();
			expect(client.isReady()).toBe(true);
		});
	});

	it('should return Client instance', () => {
		const client = mockClient();
		console.log(client);
		expect(client).toBeInstanceOf(Client);
	});
});