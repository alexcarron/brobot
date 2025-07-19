const { sendToPublishedNamesChannel, sendToNamesToVoteOnChannel, isNonPlayer, resetMemberToNewPlayer, changeDiscordNameOfPlayer, } = require("../utilities/discord-action.utility");
const PlayerRepository = require("../repositories/player.repository");
const { logWarning } = require("../../../utilities/logging-utils");
const { ButtonStyle } = require("discord.js");
const { addButtonToMessageContents } = require("../../../utilities/discord-action-utils");
const { fetchNamesmithGuildMember, fetchNamesmithGuildMembers } = require("../utilities/discord-fetch.utility");
const { isPlayer } = require("../utilities/player.utility");
const { ResourceNotFoundError, InvalidArgumentError } = require("../../../utilities/error-utils");

/**
 * Provides methods for interacting with players.
 */
class PlayerService {
	static MAX_NAME_LENGTH = 32;

	/**
	 * Constructs a new PlayerService instance.
	 * @param {PlayerRepository} playerRepository - The repository used for accessing players.
	 */
	constructor(playerRepository) {
		this.playerRepository = playerRepository;
	}

	/**
	 * Resolves a player from the given resolvable.
	 * @param {string | object} playerResolvable - The player resolvable to resolve.
	 * @returns {{
	 * 	id: string,
	 *  currentName: string,
	 *  publishedName: string | null,
	 *  inventory: string,
	 * 	role: string | null,
	 * 	tokens: number
	 * }} The resolved player object.
	 * @throws {Error} If the player resolvable is invalid or the player is not found.
	 */
	resolvePlayer(playerResolvable) {
		if (isPlayer(playerResolvable)) {
			const player = playerResolvable;
			return player;
		}
		else if (typeof playerResolvable === "string") {
			const playerID = playerResolvable;
			const player = this.playerRepository.getPlayerByID(playerID);

			if (player === undefined)
				throw new ResourceNotFoundError(`resolvePlayer: Player with id ${playerID} does not exist.`);

			return player;
		}

		throw new InvalidArgumentError(`resolvePlayer: Invalid player resolvable ${playerResolvable}`);
	}

	/**
	 * Resolves a player resolvable to a player ID.
	 * @param {string | object} playerResolvable - The player resolvable to resolve.
	 * @returns {string} The resolved player ID.
	 * @throws {Error} If the player resolvable is invalid or the player is not found.
	 */
	resolvePlayerID(playerResolvable) {
		if (isPlayer(playerResolvable)) {
			const player = playerResolvable;
			return player.id;
		}
		else if (typeof playerResolvable === "string") {
			const playerID = playerResolvable;
			if (/^\d+$/.test(playerID))
				return playerID;

			throw new ResourceNotFoundError(`resolvePlayerID: Player with id ${playerID} does not exist.`);
		}

		throw new InvalidArgumentError(`resolvePlayerID: Invalid player resolvable ${playerResolvable}`);
	}

	/**
	 * Retrieves the inventory of a player.
	 * @param {string | object} playerResolvable - The player resolvable whose inventory is being retrieved.
	 * @returns {string} The inventory of the player.
	 */
	getInventory(playerResolvable) {
		const playerID = this.resolvePlayerID(playerResolvable);
		return this.playerRepository.getInventory(playerID);
	}

	/**
	 * Retrieves the current name of a player.
	 * @param {string | object} playerResolvable - The player resolvable whose current name is being retrieved.
	 * @returns {string} The current name of the player.
	 */
	getCurrentName(playerResolvable) {
		const playerID = this.resolvePlayerID(playerResolvable);
		return this.playerRepository.getCurrentName(playerID);
	}

	/**
	 * Changes the current name of a player.
	 * @param {string | object} playerResolvable - The player resolvable whose current name is being changed.
	 * @param {string} newName - The new name to assign to the player.
	 * @throws {Error} - If the new name is longer than MAX_NAME_LENGTH.
	 * @returns {Promise<void>} A promise that resolves once the name has been changed.
	 */
	async changeCurrentName(playerResolvable, newName) {
		const playerID = this.resolvePlayerID(playerResolvable);

		if (typeof newName !== "string")
			throw new InvalidArgumentError("changeCurrentName: newName must be a string.");

		if (newName.length > PlayerService.MAX_NAME_LENGTH)
			throw new InvalidArgumentError(`changeCurrentName: newName must be less than or equal to ${PlayerService.MAX_NAME_LENGTH}.`);

		this.playerRepository.changeCurrentName(playerID, newName);
		await changeDiscordNameOfPlayer(playerID, newName);
	}

	/**
	 * Adds a character to a player's name.
	 * @param {string | object} playerResolvable - The player resolvable whose name is being modified.
	 * @param {string} character - The character to add to the player's name.
	 * @throws {Error} - If the addition of the character to the player's name would result in a name longer than MAX_NAME_LENGTH.
	 */
	addCharacterToName(playerResolvable, character) {
		const playerID = this.resolvePlayerID(playerResolvable);

		const currentName = this.getCurrentName(playerResolvable);
		const newName = currentName + character;

		this.changeCurrentName(playerResolvable, newName);
		this.playerRepository.addCharacterToInventory(playerID, character);
	}

	/**
	 * Retrieves the published name of a player.
	 * @param {string | object} playerResolvable - The player resolvable whose published name is being retrieved.
	 * @returns {string | null} A promise that resolves with the published name of the player, or null if no published name exists.
	 */
	getPublishedName(playerResolvable) {
		const playerID = this.resolvePlayerID(playerResolvable);
		return this.playerRepository.getPublishedName(playerID);
	}

	/**
	 * Publishes a player's current name to the 'Names to Vote On' channel.
	 * If the player has no current name, logs a warning and does nothing.
	 * @param {string | object} playerResolvable - The player resolvable whose name is being published.
	 * @returns {Promise<void>} A promise that resolves once the name has been published.
	 */
	async publishName(playerResolvable) {
		const playerID = this.resolvePlayerID(playerResolvable);
		const currentName = this.getCurrentName(playerResolvable);

		if (
			currentName === undefined ||
			currentName === null ||
			currentName.length === 0
		) {
			logWarning(`publishName: player ${playerID} has no current name to publish.`)
			return;
		}

		this.playerRepository.publishName(playerID, currentName);
		await sendToPublishedNamesChannel(
			`<@${playerID}> has published their name:\n` +
			`\`${currentName}\``
		);
	}

	/**
	 * Publishes names of players who have not yet published their names.
	 * @returns {Promise<void>} A promise that resolves once all unpublished names have been published.
	 */
	async publishUnpublishedNames() {
		const players = this.playerRepository.getPlayersWithoutPublishedNames();
		for (const player of players) {
			await this.publishName(player.id);
		}
	}

	/**
	 * Finalizes a player's name by setting their current name to their published name.
	 * If the player has no published name, logs a warning and does nothing.
	 * Also sends a message to the 'Names to Vote On' channel announcing the final name.
	 * @param {string | object} playerResolvable - The player resolvable whose name is being finalized.
	 * @returns {Promise<void>} A promise that resolves once the name has been finalized.
	 */
	async finalizeName(playerResolvable) {
		const playerID = this.resolvePlayerID(playerResolvable);
		const publishedName = this.getPublishedName(playerResolvable);

		if (
			publishedName === undefined ||
			publishedName === null ||
			publishedName.length === 0
		) {
			logWarning(`finalizeName: player ${playerID} has no published name to finalize.`);
			return;
		}

		await this.changeCurrentName(playerResolvable, publishedName);

		await sendToNamesToVoteOnChannel(
			await addButtonToMessageContents({
				contents: `_ _\n${publishedName}`,
				buttonID: `vote-${playerID}`,
				buttonLabel: 'Vote as Favorite Name',
				buttonStyle: ButtonStyle.Secondary
			})
		);
	}

	async finalizeAllNames() {
		const players = this.playerRepository.getPlayers();

		for (const player of players) {
			await this.finalizeName(player.id);
		}
	}

	/**
	 * Adds a new player to the game.
	 * @param {string | object} playerResolvable - The player resolvable to add to the game.
	 * @throws {Error} - If the player already exists in the game.
	 * @returns {Promise<void>} A promise that resolves once the player has been added.
	 */
	async addNewPlayer(playerResolvable) {
		const playerID = this.resolvePlayerID(playerResolvable);

		if (typeof playerID !== "string")
			throw new InvalidArgumentError(`addNewPlayer: playerID must be a string, but got ${playerID}.`);

		if (this.playerRepository.doesPlayerExist(playerID))
			throw new ResourceNotFoundError(`addNewPlayer: player ${playerID} already exists in the game.`);

		const guildMember = await fetchNamesmithGuildMember(playerID);

		await resetMemberToNewPlayer(guildMember);

		this.playerRepository.addPlayer(playerID);
	}

	/**
	 * Adds all members in the Namesmith server to the game.
	 * Excludes players with the Spectator or Staff roles.
	 * @returns {Promise<void>} A promise that resolves once all players have been added.
	 */
	async addEveryoneInServer() {
		const guildMembers = await fetchNamesmithGuildMembers();

		for (const guildMember of guildMembers) {
			if (await isNonPlayer(guildMember))
				continue;

			if (this.playerRepository.doesPlayerExist(guildMember.id))
				continue;

			await this.addNewPlayer(guildMember.id);
		}
	}

	/**
	 * Resets the player repository, clearing all stored players.
	 */
	reset() {
		this.playerRepository.reset();
	}
}

module.exports = PlayerService;