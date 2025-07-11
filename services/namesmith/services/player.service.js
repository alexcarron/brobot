const { sendToPublishedNamesChannel, changeDiscordNameOfPlayer, sendToNamesToVoteOnChannel, isNonPlayer, resetMemberToNewPlayer, } = require("../utilities/discord-action.utility");
const PlayerRepository = require("../repositories/player.repository");
const { logWarning } = require("../../../utilities/logging-utils");
const { ButtonStyle } = require("discord.js");
const { addButtonToMessageContents } = require("../../../utilities/discord-action-utils");
const { fetchNamesmithGuildMember, fetchNamesmithGuildMembers } = require("../utilities/discord-fetch.utility");

/**
 * Provides methods for interacting with players.
 */
class PlayerService {
	static MAX_NAME_LENGTH = 32;
	static NO_NAME = "ˑ";

	/**
	 * Constructs a new PlayerService instance.
	 * @param {PlayerRepository} playerRepository - The repository used for accessing players.
	 */
	constructor(playerRepository) {
		this.playerRepository = playerRepository;
	}

	/**
	 * Retrieves the inventory of a player.
	 * @param {string} playerID - The ID of the player whose inventory is being retrieved.
	 * @returns {Promise<string>} The inventory of the player.
	*/
	async getInventory(playerID) {
		return await this.playerRepository.getInventory(playerID);
	}

	/**
	 * Retrieves the current name of a player.
	 * @param {string} playerID - The ID of the player whose name is being retrieved.
	 * @returns {Promise<string>} The current name of the player.
	*/
	async getCurrentName(playerID) {
		return await this.playerRepository.getCurrentName(playerID);
	}

	/**
	 * Changes the current name of a player.
	 * @param {string} playerID - The ID of the player whose name is being changed.
	 * @param {string} newName - The new name to assign to the player.
	 * @throws {Error} - If the new name is longer than MAX_NAME_LENGTH.
	 * @returns {Promise<void>} A promise that resolves once the name has been changed.
	 */
	async changeCurrentName(playerID, newName) {
		if (typeof newName !== "string")
			throw new TypeError("changeCurrentName: newName must be a string.");

		if (newName.length > PlayerService.MAX_NAME_LENGTH)
			throw new TypeError(`changeCurrentName: newName must be less than or equal to ${PlayerService.MAX_NAME_LENGTH}.`);

		if (newName.length === 0) {
			await this.playerRepository.changeCurrentName(playerID, "");
			await changeDiscordNameOfPlayer(playerID, PlayerService.NO_NAME);
		}
		else {
			await this.playerRepository.changeCurrentName(playerID, newName);
			await changeDiscordNameOfPlayer(playerID, newName);
		}
	}

	/**
	 * Adds a character to a player's name.
	 * @param {string} playerID - The ID of the player whose name is being modified.
	 * @param {string} character - The character to add to the player's name.
	 * @throws {Error} - If the addition of the character to the player's name would result in a name longer than MAX_NAME_LENGTH.
	 * @returns {Promise<void>} A promise that resolves once the name has been modified.
	*/
	async addCharacterToName(playerID, character) {
		const currentName = await this.getCurrentName(playerID);
		const newName = currentName + character;

		await this.changeCurrentName(playerID, newName);
		await this.playerRepository.addCharacterToInventory(playerID, character);
	}

	async getPublishedName(playerID) {
		return await this.playerRepository.getPublishedName(playerID);
	}

	/**
	 * Publishes a player's current name to the 'Names to Vote On' channel.
	 * If the player has no current name, logs a warning and does nothing.
	 * @param {string} playerID - The ID of the player whose name is being published.
	 * @returns {Promise<void>} A promise that resolves once the name has been published.
	 */
	async publishName(playerID) {
		const currentName = await this.getCurrentName(playerID);

		if (
			currentName === undefined ||
			currentName === null ||
			currentName.length === 0
		) {
			logWarning(`publishName: player ${playerID} has no current name to publish.`)
			return;
		}

		await this.playerRepository.publishName(playerID, currentName);
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
		const players = await this.playerRepository.getPlayersWithoutPublishedNames();
		for (const player of players) {
			await this.publishName(player.id);
		}
	}

	/**
	 * Finalizes a player's name by setting their current name to their published name.
	 * If the player has no published name, logs a warning and does nothing.
	 * Also sends a message to the 'Names to Vote On' channel announcing the final name.
	 * @param {string} playerID - The ID of the player whose name is being finalized.
	 * @returns {Promise<void>} A promise that resolves once the name has been finalized.
	 */
	async finalizeName(playerID) {
		const publishedName = await this.getPublishedName(playerID);

		if (
			publishedName === undefined ||
			publishedName === null ||
			publishedName.length === 0
		) {
			logWarning(`finalizeName: player ${playerID} has no published name to finalize.`);
			return;
		}

		await this.changeCurrentName(playerID, publishedName);

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
		const players = await this.playerRepository.getPlayers();

		for (const player of players) {
			await this.finalizeName(player.id);
		}
	}

	/**
	 * Adds a new player to the game.
	 * @param {string} playerID - The ID of the player to add.
	 * @throws {Error} - If the player already exists in the game.
	 * @returns {Promise<void>} A promise that resolves once the player has been added.
	 */
	async addNewPlayer(playerID) {
		if (typeof playerID !== "string")
			throw new TypeError(`addNewPlayer: playerID must be a string, but got ${playerID}.`);

		if (await this.playerRepository.doesPlayerExist(playerID))
			throw new Error(`addNewPlayer: player ${playerID} already exists in the game.`);

		const guildMember = await fetchNamesmithGuildMember(playerID);

		await resetMemberToNewPlayer(guildMember);

		await this.playerRepository.addPlayer(playerID);
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

			if (await this.playerRepository.doesPlayerExist(guildMember.id))
				continue;

			await this.addNewPlayer(guildMember.id);
		}
	}

	/**
	 * Resets the player repository, clearing all stored players.
	 * @returns {Promise<void>} A promise that resolves once the repository is reset.
	 */
	async reset() {
		await this.playerRepository.reset();
	}
}

module.exports = PlayerService;