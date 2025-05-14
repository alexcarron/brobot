const { Client, Guild } = require("discord.js");
const { mockClient, MOCK_GUILD_DATA } = require("./mock-utils");

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

	describe('.guilds', () => {
		describe('.cache', () => {
			it('should include a mock guild', () => {
				const client = mockClient();
				expect(client.guilds.cache.size).toBeGreaterThan(0);
			});

			it('should retrieve a mock guild', () => {
				const client = mockClient();
				const guild = client.guilds.cache.first();
				expect(guild).toBeInstanceOf(Guild);
			});

			it('should retrieve mock guild by correct id', () => {
				const client = mockClient();
				const guild = client.guilds.cache.get(MOCK_GUILD_DATA.id);
				expect(guild).toBeInstanceOf(Guild);
			});

			it('should retrieve undefined if guild does not exist', () => {
				const client = mockClient();
				const guild = client.guilds.cache.get('invalid-id');
				expect(guild).toBeUndefined();
			});
		});

		describe('.fetch()', () => {
			it('should retrieve a mock guild', async () => {
				const client = mockClient();
				const guild = await client.guilds.fetch(MOCK_GUILD_DATA.id);
				expect(guild).toBeInstanceOf(Guild);
			});

			it('should throw an error if guild does not exist', async () => {
				const client = mockClient();
				await expect(client.guilds.fetch('invalid-id')).rejects.toThrow();
			});
		});
	});

	it('should return Client instance', () => {
		const client = mockClient();
		console.log(client);
		expect(client).toBeInstanceOf(Client);
	});
});