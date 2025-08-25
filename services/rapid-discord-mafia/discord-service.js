/* eslint-disable jsdoc/require-property-description */
const { TextChannel, Message, Guild, PermissionFlagsBits, Role } = require("discord.js");
const { ids } = require("../../bot-config/discord-ids");
const { fetchGuild, fetchGuildMember, fetchRole, fetchTextChannel } = require("../../utilities/discord-fetch-utils.js");
/**
 * @typedef {object} RealDiscordService
 * @property {boolean} isMockService
 * @property {import("discord.js").Guild} rdm_guild
 * @property {import("discord.js").TextChannel} announce_channel
 * @property {import("discord.js").TextChannel} mafia_channel
 * @property {import("discord.js").TextChannel} town_discussion_channel
 * @property {import("discord.js").Role} living_role
 * @property {import("discord.js").Role} spectator_role
 * @property {import("discord.js").Role} ghost_role
 * @property {(message: string) => Promise<import("discord.js").Message>} announce
 * @property {(message: string) => Promise<import("discord.js").Message>} sendToMafia
 * @property {(message: string) => Promise<import("discord.js").Message>} sendToTownDiscussion
 */

/**
 * @typedef {object} MockDiscordService
 * @property {boolean} isMockService
 * @property {import("discord.js").Guild|undefined} rdm_guild
 * @property {import("discord.js").TextChannel|undefined} announce_channel
 * @property {import("discord.js").TextChannel|undefined} mafia_channel
 * @property {import("discord.js").TextChannel|undefined} town_discussion_channel
 * @property {import("discord.js").Role|undefined} living_role
 * @property {import("discord.js").Role|undefined} spectator_role
 * @property {import("discord.js").Role|undefined} ghost_role
 * @property {(message: string) => Promise<import("discord.js").Message|undefined>} announce
 * @property {(message: string) => Promise<import("discord.js").Message|undefined>} sendToMafia
 * @property {(message: string) => Promise<import("discord.js").Message|undefined>} sendToTownDiscussion
 */

/**
 * @typedef {RealDiscordService|MockDiscordService} DiscordServiceType
 */


/**
 * Enum of names of all Discord roles for Rapid Discord Mafia
 */
const RDMDiscordRole = Object.freeze({
	LIVING: "Living",
	SPECTATOR: "Spectators",
	GHOSTS: "Ghosts",
	ON_TRIAL: "On Trial"
});

/**
 * The Discord service for Rapid Discord Mafia
 */
class DiscordService {
	/**
	 * The guild that Rapid Discord Mafia is hosted on
	 * @type {Guild | undefined}
	 */
	rdm_guild;

	/**
	 * The text channel where game announcements are made
	 * @type {TextChannel | undefined}
	 */
	announce_channel;

	/**
	 * The text channel where mafia privately discusses
	 * @type {TextChannel | undefined}
	 */
	mafia_channel;

	/**
	 * The text channel where town discusses
	 * @type {TextChannel | undefined}
	 */
	town_discussion_channel;

	/**
	 * Whether or not this instance is for testing only
	 * @type {boolean}
	 */
	isMockService;


	/**
	 * The Discord role living players have
	 * @type {Role | undefined}
	 */
	living_role;

	/**
	 * The Discord role spectators have
	 * @type {Role | undefined}
	 */
	spectator_role;

	/**
	 * The Discord role ghost players have
	 * @type {Role | undefined}
	 */
	ghost_role;

	constructor({isMockService=false}) {
		this.isMockService = isMockService;

		if (!this.isMockService) {
			this.setupChannels();
		}
	}

	async setupChannels() {
		await this.setupRDMGuild();
		this.setupAnnounceChannel();
		this.setupMafiaChannel();
		this.setupTownDiscussionChannel();
		this.setupSpectatorRole();
		this.setupLivingRole();
		this.setupGhostRole();
	}

	/**
	 * @returns {this is MockDiscordService} If this is a mock Discord service
	 */
  isMock() {
    return this.isMockService === true;
  }

	/**
	 * @returns {this is RealDiscordService} If this is a real Discord service
	 */
  isReal() {
    return this.isMockService === false;
  }

	async setupRDMGuild() {
		this.rdm_guild = await fetchGuild(ids.servers.rapid_discord_mafia);
	}

	async setupAnnounceChannel() {
		if (!this.isReal()) return;

		this.announce_channel = await fetchTextChannel(
			this.rdm_guild,
			ids.rapid_discord_mafia.channels.game_announce
		);
	}

	async setupMafiaChannel() {
		if (!this.isReal()) return;

		this.mafia_channel = await fetchTextChannel(
			this.rdm_guild,
			ids.rapid_discord_mafia.channels.mafia_chat
		);
	}

	async setupSpectatorRole() {
		if (!this.isReal()) return;

		this.spectator_role = await fetchRole(
			this.rdm_guild,
			ids.rapid_discord_mafia.roles.spectators
		)
	}

	async setupLivingRole() {
		if (!this.isReal()) return;

		this.living_role = await fetchRole(
			this.rdm_guild,
			ids.rapid_discord_mafia.roles.living
		)
	}

	async setupGhostRole() {
		if (!this.isReal()) return;

		this.ghost_role = await fetchRole(
			this.rdm_guild,
			ids.rapid_discord_mafia.roles.ghosts
		)
	}

	async setupTownDiscussionChannel() {
		if (!this.isReal()) return;

		this.town_discussion_channel = await fetchTextChannel(
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
		if (!this.isReal()) return;

		return await this.announce_channel.send(message);
	}

	/**
	 * Announces a discord message in the private mafia channel
	 * @param {string} message - The message you want to announce to the mafia channel.
	 * @returns {Promise<Message | undefined>} The Discord message sent. undefined if mock service
	 */
	async sendToMafia(message) {
		if (!this.isReal()) return;

		return await this.mafia_channel.send(message);
	}

	/**
	 * Announces a discord message in the town discussion channel
	 * @param {string} message - The message you want to announce to the town discussion channel.
	 * @returns {Promise<Message | undefined>} The Discord message sent. undefined if mock service
	 */
	async sendToTownDiscussion(message) {
		if (!this.isReal()) return;

		return await this.town_discussion_channel.send(message);
	}

	/**
	 * Creates a discord channel with a name in a specific category that's private to a specific user
	 * @param {object} parameters - The parameters for creating the channel
	 * @param {string} parameters.name - The name of the channel.
	 * @param {string} parameters.category_id - The id of the cateogry the channel will be in
	 * @param {string} parameters.guild_member_id - The id of the guild member this channel will be private for
	 * @returns {Promise<TextChannel | undefined>} The created Discord channel. undefined if mock service
	 */
	async createPrivateChannel({name, category_id, guild_member_id}) {
		if (!this.isReal()) return;

		const guild_member = await fetchGuildMember(this.rdm_guild, guild_member_id);

		return await this.rdm_guild.channels.create({
			name: name,
			parent: category_id,
			permissionOverwrites: [
				{
					id: this.rdm_guild.roles.everyone,
					deny: [PermissionFlagsBits.ViewChannel],
				},
				{
					id: guild_member,
					allow: [PermissionFlagsBits.ViewChannel],
				}
			],
		});
	}

	/**
	 * Send a message to a channel and pin it
	 * @param {object} parameters - The parameters
	 * @param {string} parameters.channel_id - The id of the text channel the message is being sent in
	 * @param {string} parameters.contents - The contents of the message being sent
	 * @returns {Promise<Message | undefined>} The message that was sent. undefined if mock service
	 */
	async sendAndPinMessage({channel_id, contents}) {
		if (!this.isReal()) return;

		const text_channel = await fetchTextChannel(this.rdm_guild, channel_id);
		const message = await text_channel.send(contents);
		await message.pin();

		return message;
	}

	/**
	 * Send a message to a channel
	 * @param {object} parameters - The parameters
	 * @param {string} parameters.channel_id - The id of the text channel the message is being sent in
	 * @param {string} parameters.contents - The contents of the message being sent
	 * @returns {Promise<Message | undefined>} The message that was sent. undefined if mock service
	 */
	async sendMessage({channel_id, contents}) {
		if (!this.isReal()) return;

		const text_channel = await fetchTextChannel(this.rdm_guild, channel_id);
		const message = await text_channel.send(contents);

		return message;
	}

	/**
	 * Deletes a channel
	 * @param {string} channel_id - The id of the channel that will be deleted
	 */
	async deleteChannel(channel_id) {
		if (!this.isReal()) return;

		const text_channel = await fetchTextChannel(this.rdm_guild, channel_id);
		text_channel.delete();
	}

	/**
	 * Adds a view channel permission to a guild member on a channel
	 * @param {object} parameters - The parameters
	 * @param {string} parameters.channel_id - The id of the channel you want to add a viewer to
	 * @param {string} parameters.guild_member_id - The id of the guild member you want to be able to see the channel
	 */
	async addViewerToChannel({channel_id, guild_member_id}) {
		if (!this.isReal()) return;

		const text_channel = await fetchTextChannel(this.rdm_guild, channel_id);
		const guild_member = await fetchGuildMember(this.rdm_guild, guild_member_id);

		await text_channel.permissionOverwrites.edit(
			guild_member.user,
			{ ViewChannel: true }
		);
	}

	/**
	 * Gives a guild member access to see the mafia channel
	 * @param {string} guild_member_id  - The id of the guild member you want to be able to see the mafia channel
	 */
	async addViewerToMafiaChannel(guild_member_id) {
		if (!this.isReal()) return;

		await this.addViewerToChannel({
			channel_id: this.mafia_channel.id,
			guild_member_id: guild_member_id,
		});
	}

	/**
	 * Removes send messages permission from a guild member on a channel
	 * @param {object} parameters - The parameters
	 * @param {string} parameters.channel_id - The id of the channel you want to remove send message permissions from
	 * @param {string} parameters.guild_member_id - The id of the guild member you do not want to be able to send messages in the channel
	 */
	async removeSenderFromChannel({channel_id, guild_member_id}) {
		if (!this.isReal()) return;

		const text_channel = await fetchTextChannel(this.rdm_guild, channel_id);
		const guild_member = await fetchGuildMember(this.rdm_guild, guild_member_id);

		await text_channel.permissionOverwrites.edit(
			guild_member.user,
			{
				SendMessages: false,
				AddReactions: false,
			}
		);
	}

	/**
	 * Restrict a guild member from sending messages in the mafia channel
	 * @param {string} guild_member_id - The id of the guild member you do not want to be able to send messages in the mafia channel
	 */
	async removeSenderFromMafiaChannel(guild_member_id) {
		if (!this.isReal()) return;

		await this.removeSenderFromChannel({
			channel_id: this.mafia_channel.id,
			guild_member_id: guild_member_id,
		});
	}

	/**
	 * Restrict a guild member from sending messages in the town discussion channel
	 * @param {string} guild_member_id - The id of the guild member you do not want to be able to send messages in the town discussion channel
	 */
	async removeSenderFromTownDiscussionChannel(guild_member_id) {
		if (!this.isReal()) return;

		await this.removeSenderFromChannel({
			channel_id: this.town_discussion_channel.id,
			guild_member_id: guild_member_id,
		});
	}

	/**
	 * Restrict a guild member from sending messages in the announcements channel
	 * @param {string} guild_member_id - The id of the guild member you do not want to be able to send messages in the announcements channel
	 */
	async removeSenderFromAnnouncementsChannel(guild_member_id) {
		if (!this.isReal()) return;

		await this.removeSenderFromChannel({
			channel_id: this.announce_channel.id,
			guild_member_id: guild_member_id,
		});
	}

	/**
	 * Adds send messages permission to a guild member on a channel
	 * @param {object} parameters - The parameters
	 * @param {string} parameters.channel_id - The id of the channel you want to add send message permissions to
	 * @param {string} parameters.guild_member_id - The id of the guild member you want to be able to send messages in the channel
	 */
	async addSenderToChannel({channel_id, guild_member_id}) {
		if (!this.isReal()) return;

		const text_channel = await fetchTextChannel(this.rdm_guild, channel_id);
		const guild_member = await fetchGuildMember(this.rdm_guild, guild_member_id);

		await text_channel.permissionOverwrites.edit(
			guild_member.user,
			{
				SendMessages: null,
				AddReactions: null,
			}
		);
	}

	/**
	 * Let a guild member aend messages in the town discussion channel
	 * @param {string} guild_member_id - The id of the guild member you want to be able to send messages in the town discussion channel
	 */
	async addSenderToTownDiscussionChannel(guild_member_id) {
		if (!this.isReal()) return;

		await this.addSenderToChannel({
			channel_id: this.town_discussion_channel.id,
			guild_member_id: guild_member_id,
		});
	}

	/**
	 * Let a guild member send messages in the announcements channel
	 * @param {string} guild_member_id - The id of the guild member you want to be able to send messages in the announcements channel
	 */
	async addSenderToAnnouncementsChannel(guild_member_id) {
		if (!this.isReal()) return;

		await this.addSenderToChannel({
			channel_id: this.announce_channel.id,
			guild_member_id: guild_member_id,
		});
	}

	/**
	 * Gives a guild member the spectator role
	 * @param {string} guild_member_id - The id of the guild member being given the role
	 */
	async giveMemberSpectatorRole(guild_member_id) {
		if (!this.isReal()) return;

		const guild_member = await fetchGuildMember(this.rdm_guild, guild_member_id);
		guild_member.roles.add(this.spectator_role);
	}

	/**
	 * Gives a guild member the living role
	 * @param {string} guild_member_id - The id of the guild member being given the role
	 */
	async giveMemberLivingRole(guild_member_id) {
		if (!this.isReal()) return;

		const guild_member = await fetchGuildMember(this.rdm_guild, guild_member_id);
		guild_member.roles.add(this.living_role);
	}

	/**
	 * Gives a guild member the ghost role
	 * @param {string} guild_member_id - The id of the guild member being given the role
	 */
	async giveMemberGhostRole(guild_member_id) {
		if (!this.isReal()) return;

		const guild_member = await fetchGuildMember(this.rdm_guild, guild_member_id);
		guild_member.roles.add(this.ghost_role);
	}

	/**
	 * Removes the spectator role from a guild member
	 * @param {string} guild_member_id - The id of the guild member the role is being removed from
	 */
	async removeSpectatorRoleFromMember(guild_member_id) {
		if (!this.isReal()) return;

		const guild_member = await fetchGuildMember(this.rdm_guild, guild_member_id);
		guild_member.roles.remove(this.spectator_role);
	}

	/**
	 * Removes the living role from a guild member
	 * @param {string} guild_member_id - The id of the guild member the role is being removed from
	 */
	async removeLivingRoleFromMember(guild_member_id) {
		if (!this.isReal()) return;

		const guild_member = await fetchGuildMember(this.rdm_guild, guild_member_id);
		guild_member.roles.remove(this.living_role);
	}

	/**
	 * Removes the ghost role from a guild member
	 * @param {string} guild_member_id - The id of the guild member the role is being removed from
	 */
	async removeGhostRoleFromMember(guild_member_id) {
		if (!this.isReal()) return;

		const guild_member = await fetchGuildMember(this.rdm_guild, guild_member_id);
		guild_member.roles.remove(this.ghost_role);
	}

	/**
	 * Fetches the channel of a given player
	 * @param {{channel_id: string}} player - The player object that the channel is being fetched for
	 * @returns {Promise<TextChannel | undefined>} A Promise that resolves with the TextChannel object if the channel was successfully fetched, or rejects with an Error if not.
	 */
	async fetchPlayerChannel(player) {
		if (!this.isReal()) return;

		return await fetchTextChannel(this.rdm_guild, player.channel_id);
	}
}

module.exports = {DiscordService, RDMDiscordRole};