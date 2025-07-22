jest.mock('../../utilities/discord-fetch-utils', () => ({
	fetchChannel: jest.fn(() => Promise.resolve({ id: 'mockChannelId' })),
	fetchGuild: jest.fn(() => Promise.resolve({ id: 'mockGuildId' })),
	saveObjectToJsonInGitHub: jest.fn(() => Promise.resolve('Saved')),
}))
jest.mock('../../bot-config/discord-ids.js', () => ({
  ll_game_shows: {
    server_id: 'mockServerId',
    channels: {
      general: 'mockGeneralChannelId',
      random: 'mockRandomChannelId',
      empty: 'mockEmptyChannelId',
    },
		roles: {
			daily_questions: 'mockDailyQuestionsRoleId',
		},
  },
}));

const DailyMessageHandler = require("./daily-message-handler");
const { fetchChannel } = require("../../utilities/discord-fetch-utils");
const { TextChannel } = require("discord.js");

describe('DailyMessageHandler', () => {
	/**
	 * @type {DailyMessageHandler}
	 */
	let dailyMessageHandler;

	/**
	 * @type {{[channelName: string]: string[]}}
	 */
	let channelsToMessages;

	beforeEach(() => {
		jest.clearAllMocks();

		channelsToMessages = {
			general: ['Hello, world!', 'Good morning!'],
			random: ['Random message 1', 'Random message 2'],
			empty: [],
		};

		dailyMessageHandler = new DailyMessageHandler(channelsToMessages);
	})

	it('constructor should initialize channelsToMessages and remove empty channels', () => {
    expect(dailyMessageHandler.channelsToMessages)
		.toEqual({
			general: ['Hello, world!', 'Good morning!'],
			random: ['Random message 1', 'Random message 2'],
		});
	});

	it('removeMessage should remove a message and clean up empty channels', () => {
    dailyMessageHandler.removeMessage('general', 'Hello, world!');
    expect(dailyMessageHandler.channelsToMessages.general).toEqual(['Good morning!']);

    dailyMessageHandler.removeMessage('general', 'Good morning!');
    expect(dailyMessageHandler.channelsToMessages).not.toHaveProperty('general');
	});

	it('getRandomChannel should return a random channel name', () => {
    const channelName = dailyMessageHandler.getRandomChannel();
    expect(['general', 'random']).toContain(channelName);
	});

	it('getRandomMessage should return a random message from a channel', () => {
		const message = dailyMessageHandler.getRandomMessage('general');
    expect(['Hello, world!', 'Good morning!']).toContain(message);
	});

	it('sendDailyMessage should send a random message and remove it from the map', async () => {
		const channelsToMessagesBefore = JSON.parse(JSON.stringify(dailyMessageHandler.channelsToMessages));

		const mockChannel = {
			send: jest.fn().mockResolvedValue('Message sent'),
			id: '123',
			name: 'general',
			type: 'GUILD_TEXT',
		};
		Object.setPrototypeOf(mockChannel, TextChannel.prototype);

		jest.spyOn(dailyMessageHandler, 'convertChannelNameToChannel').mockImplementation(() => Promise.resolve(mockChannel));
    jest.spyOn(mockChannel, 'send').mockResolvedValue('Message sent');

    fetchChannel.mockResolvedValue(mockChannel);
    const message = await dailyMessageHandler.sendDailyMessage();

    expect(message).toBe('Message sent');
    expect(mockChannel.send).toHaveBeenCalled();

		const channelsToMessagesAfter = { ...dailyMessageHandler.channelsToMessages };

    expect(channelsToMessagesBefore).not.toEqual(channelsToMessagesAfter);
	});
});