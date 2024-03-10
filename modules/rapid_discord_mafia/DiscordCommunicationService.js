const { TextChannel, Message, Guild } = require("discord.js");
const { getGuild, getChannel } = require("../functions");
const ids = require("../../data/ids.json")

class DiscordCommunicationService {
	/**
	 * The guild that Rapid Discord Mafia is hosted on
	 * @type {Guild}
	 */
	rdm_guild;

	/**
	 * The text channel where game announcements are made
	 * @type {TextChannel}
	 */
	announce_channel;

	/**
	 * The text channel where mafia privately discusses
	 * @type {TextChannel}
	 */
	mafia_channel;

	/**
	 * Whether or not this instance is for testing only
	 * @type {boolean}
	 */
	isMockService;

	constructor({isMockService=false}) {
		this.isMockService = isMockService;

		if (!this.isMockService) {
			this.setupChannels();
		}
	}

	async setupChannels() {
		await this.setupRDMGuild();
		await this.setupAnnounceChannel();
		await this.setupMafiaChannel();
	}

	async setupRDMGuild() {
		this.rdm_guild = await getGuild(ids.servers.rapid_discord_mafia);
	}

	async setupAnnounceChannel() {
		this.announce_channel = await getChannel(
			this.rdm_guild,
			ids.rapid_discord_mafia.channels.announce
		);
	}

	async setupMafiaChannel() {
		this.mafia_channel = await getChannel(
			this.rdm_guild,
			ids.rapid_discord_mafia.channels.mafia_chat
		);
	}

	/**
	 * Announces a discord message in the announcements channel
	 * @param {string} message - The message you want to announce.
	 * @returns {Promise<Message | undefined>} The Discord message sent. undefined if mock service
	 */
	async announce(message) {
		if (!this.isMockService)
			return await this.announce_channel.send(message);
		else
			return undefined;
	}

	/**
	 * Announces a discord message in the private mafia channel
	 * @param {string} message - The message you want to announce to the mafia channel.
	 * @returns {Promise<Message | undefined>} The Discord message sent. undefined if mock service
	 */
	async sendToMafia(message) {
		if (!this.isMockService)
			return await this.mafia_channel.send(message);
		else
			return undefined;
	}

}

module.exports = DiscordCommunicationService;