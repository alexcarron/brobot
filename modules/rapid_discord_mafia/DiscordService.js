const { TextChannel, Message, Guild, PermissionFlagsBits } = require("discord.js");
const { getGuild, getChannel, getGuildMember } = require("../functions");
const ids = require("../../data/ids.json")

class DiscordService {
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
	 * The text channel where town discusses
	 * @type {TextChannel}
	 */
	town_discussion_channel;

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
		await this.setupTownDiscussionChannel();
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

	async setupTownDiscussionChannel() {
		this.text_channel = await getChannel(
			this.rdm_guild,
			ids.rapid_discord_mafia.channels.town_discussion
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

	/**
	 * Announces a discord message in the town discussion channel
	 * @param {string} message - The message you want to announce to the town discussion channel.
	 * @returns {Promise<Message | undefined>} The Discord message sent. undefined if mock service
	 */
	async sendToTownDiscussion(message) {
		if (!this.isMockService)
			return await this.town_discussion_channel.send(message);
		else
			return undefined;
	}

	/**
	 * Creates a discord channel with a name in a specific category that's private to a specific user
	 * @param {Object} parameters
	 * @param {string} parameters.name - The name of the channel.
	 * @param {string} parameters.category_id - The id of the cateogry the channel will be in
	 * @param {string} parameters.guild_member_id - The id of the guild member this channel will be private for
	 * @returns {Promise<TextChannel | undefined>} The created Discord channel. undefined if mock service
	 */
	async createPrivateChannel({name, category_id, guild_member_id}) {
		if (!this.isMockService) {
			const guild_member = await getGuildMember(this.rdm_guild, guild_member_id);

			return await this.rdm_guild.channels.create({
				name: name,
				parent: category_id,
				permissionOverwrites: [
					{
						id: rdm_guild.roles.everyone,
						deny: [PermissionFlagsBits.ViewChannel],
					},
					{
						id: guild_member,
						allow: [PermissionFlagsBits.ViewChannel],
					}
				],
			});
		}
		else {
			return undefined;
		}
	}

	/**
	 * Send a message to a channel and pin it
	 * @param {Object} parameters
	 * @param {string} parameters.channel - The id of the text channel the message is being sent in
	 * @param {string} parameters.contents - The contents of the message being sent
	 * @returns {Promise<Message>} The message that was sent
	 */
	async sendAndPinMessage({channel_id, contents}) {
		if (!this.isMockService) {
			const text_channel = await getChannel(this.rdm_guild, channel_id);
			const message = await text_channel.send(contents);
			await message.pin();

			return message
		}
		else {
			return undefined;
		}
	}

	/**
	 * Send a message to a channel
	 * @param {Object} parameters
	 * @param {string} parameters.channel - The id of the text channel the message is being sent in
	 * @param {string} parameters.contents - The contents of the message being sent
	 * @returns {Promise<Message>} The message that was sent
	 */
	async sendMessage({channel_id, contents}) {
		if (!this.isMockService) {
			const text_channel = await getChannel(this.rdm_guild, channel_id);
			const message = await text_channel.send(contents);

			return message
		}
		else {
			return undefined;
		}
	}

	/**
	 * Deletes a channel
	 * @param {string} channel_id - The id of the channel that will be deleted
	 */
	async deleteChannel(channel_id) {
		if (!this.isMockService) {
			const text_channel = await getChannel(this.rdm_guild, channel_id);
			text_channel.delete();
		}
	}

	/**
	 * Adds a view channel permission to a guild member on a channel
	 * @param {Object} parameters
	 * @param {string} channel_id - The id of the channel you want to add a viewer to
	 * @param {string} guild_member_id - The id of the guild member you want to be able to see the channel
	 */
	async addViewerToChannel({channel_id, guild_member_id}) {
		if (!this.isMockService) {
			const text_channel = await getChannel(this.rdm_guild, channel_id);
			const guild_member = await getGuildMember(this.rdm_guild, guild_member_id);

			await text_channel.permissionOverwrites.edit(
				guild_member.user,
				{ ViewChannel: true }
			);
		}
	}

	/**
	 * Gives a guild member access to see the mafia channel
	 * @param {string} guild_member_id  - The id of the guild member you want to be able to see the mafia channel
	 */
	async addViewerToMafiaChannel(guild_member_id) {
		if (!this.isMockService) {
			await this.addViewerToChannel({
				channel_id: this.mafia_channel.id,
				guild_member_id: guild_member_id,
			});
		}
	}

	/**
	 * Removes send messages permission from a guild member on a channel
	 * @param {Object} parameters
	 * @param {string} channel_id - The id of the channel you want to remove send message permissions from
	 * @param {string} guild_member_id - The id of the guild member you do not want to be able to send messages in the channel
	 */
	async removeSenderFromChannel({channel_id, guild_member_id}) {
		if (!this.isMockService) {
			const text_channel = await getChannel(this.rdm_guild, channel_id);
			const guild_member = await getGuildMember(this.rdm_guild, guild_member_id);

			await text_channel.permissionOverwrites.edit(
				guild_member.user,
				{
					SendMesages: false,
					AddReactions: false,
				}
			);
		}
	}

	/**
	 * Restrict a guild member from sending messages in the mafia channel
	 * @param {string} guild_member_id - The id of the guild member you do not want to be able to send messages in the mafia channel
	 */
	async removeSenderFromMafiaChannel(guild_member_id) {
		if (!this.isMockService) {
			await this.removeSenderFromChannel({
				channel_id: this.mafia_channel.id,
				guild_member_id: guild_member_id,
			});
		}
	}

	/**
	 * Restrict a guild member from sending messages in the town discussion channel
	 * @param {string} guild_member_id - The id of the guild member you do not want to be able to send messages in the town discussion channel
	 */
	async removeSenderFromTownDiscussionChannel(guild_member_id) {
		if (!this.isMockService) {
			await this.removeSenderFromChannel({
				channel_id: this.town_discussion_channel.id,
				guild_member_id: guild_member_id,
			});
		}
	}

	/**
	 * Restrict a guild member from sending messages in the announcements channel
	 * @param {string} guild_member_id - The id of the guild member you do not want to be able to send messages in the announcements channel
	 */
	async removeSenderFromAnnouncementsChannel(guild_member_id) {
		if (!this.isMockService) {
			await this.removeSenderFromChannel({
				channel_id: this.announce_channel.id,
				guild_member_id: guild_member_id,
			});
		}
	}

	/**
	 * Adds send messages permission to a guild member on a channel
	 * @param {Object} parameters
	 * @param {string} channel_id - The id of the channel you want to add send message permissions to
	 * @param {string} guild_member_id - The id of the guild member you want to be able to send messages in the channel
	 */
	async addSenderToChannel({channel_id, guild_member_id}) {
		if (!this.isMockService) {
			const text_channel = await getChannel(this.rdm_guild, channel_id);
			const guild_member = await getGuildMember(this.rdm_guild, guild_member_id);

			await text_channel.permissionOverwrites.edit(
				guild_member.user,
				{
					SendMesages: null,
					AddReactions: null,
				}
			);
		}
	}

	/**
	 * Let a guild member aend messages in the town discussion channel
	 * @param {string} guild_member_id - The id of the guild member you want to be able to send messages in the town discussion channel
	 */
	async addSenderToTownDiscussionChannel(guild_member_id) {
		if (!this.isMockService) {
			await this.addSenderToChannel({
				channel_id: this.town_discussion_channel.id,
				guild_member_id: guild_member_id,
			});
		}
	}

	/**
	 * Let a guild member send messages in the announcements channel
	 * @param {string} guild_member_id - The id of the guild member you want to be able to send messages in the announcements channel
	 */
	async addSenderToAnnouncementsChannel(guild_member_id) {
		if (!this.isMockService) {
			await this.addSenderToChannel({
				channel_id: this.announce_channel.id,
				guild_member_id: guild_member_id,
			});
		}
	}
}

module.exports = DiscordService;