const { TextChannel } = require("discord.js");
const DailyMessageHandler = require("./DailyMessageHandler");
const cron = require("cron");
const { getChannel, getRandArrayItem } = require("./functions");

jest.mock('discord.js', () => ({
  TextChannel: class {
    send(message) {
      return Promise.resolve(`Message sent: ${message}`);
    }
  }
}));
jest.mock('./functions', () => ({
  getRandArrayItem: jest.fn((array) => array.length === 0 ? null : array[0]), // For simplicity, always return the first item
  getChannel: jest.fn(() => new (require('discord.js').TextChannel)()),
  getGuild: jest.fn(() => ({ id: 'mockGuildId' })),
  saveObjectToGitHubJSON: jest.fn(() => Promise.resolve('Saved'))
}));
jest.mock('../data/ids.json', () => ({
  ll_game_shows: {
    server_id: 'mockServerId',
    channels: {
      general: 'mockGeneralChannelId',
      random: 'mockRandomChannelId',
      empty: 'mockEmptyChannelId',
    },
  },
}));


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

		const mockChannel = new TextChannel();
    jest.spyOn(mockChannel, 'send').mockResolvedValue('Message sent');

    getChannel.mockReturnValue(mockChannel);
    const message = await dailyMessageHandler.sendDailyMessage();

    expect(message).toBe('Message sent');
    expect(mockChannel.send).toHaveBeenCalled();

		const channelsToMessagesAfter = { ...dailyMessageHandler.channelsToMessages };
		console.log({
			channelsToMessagesBefore,
			channelsToMessagesAfter
		});
    expect(channelsToMessagesBefore).not.toEqual(channelsToMessagesAfter);
	});
});