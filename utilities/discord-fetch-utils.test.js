const { fetchGuild, assertClientSetup } = require("./discord-fetch-utils");
const { Guild } = require("discord.js");
const { mockClient, MOCK_GUILD_DATA } = require("./mock-utils");

describe('assertClientSetup()', () => {

	// Reset the client object after each test
	beforeEach(() => {
		global.client = undefined;
	});

	it('should throw an error if client is not defined', () => {
		expect(() => assertClientSetup()).toThrowError('Client is not defined.');
	});

	it('should throw an error if client is defined but not an instance of Client', () => {
		global.client = {};
		expect(() => assertClientSetup()).toThrowError('Client is not an instance of Client.');
	});

	it('should throw an error if client is defined and an instance of Client but not ready', () => {
		global.client = mockClient({ isReady: false });
		expect(() => assertClientSetup()).toThrowError('Client is not ready.');
	});

	it('should not throw an error if client is defined, an instance of Client, and ready', () => {
		global.client = mockClient({ isReady: true });
		expect(() => assertClientSetup()).not.toThrow();
	});
});


describe('fetchGuild()', () => {
	global.client = mockClient();

	it('should resolve with a Guild object if guild ID is valid', async () => {
		const guild = await fetchGuild(MOCK_GUILD_DATA.id);
		expect(guild).toBeInstanceOf(Guild);
		expect(guild.id).toBe(MOCK_GUILD_DATA.id);
		expect(guild.name).toBe(MOCK_GUILD_DATA.name);
	});

	it('should reject with an error if guild ID is invalid', async () => {
		await expect(fetchGuild('invalid-id')).rejects.toThrow();
	});
});