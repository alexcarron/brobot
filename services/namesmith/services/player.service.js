const { sendToPublishedNamesChannel, changeDiscordNameOfPlayer, sendToNamesToVoteOnChannel, } = require("../utilities/discord-action.utility");
const PlayerRepository = require("../repositories/player.repository");
const { logWarning } = require("../../../utilities/logging-utils");

const MAX_NAME_LENGTH = 32;
const NO_NAME = "ˑ";

/**
 * Provides methods for interacting with players.
 */
class PlayerService {
	/**
	 * Constructs a new PlayerService instance.
	 * @param {PlayerRepository} playerRepository - The repository used for accessing players.
	 */
	constructor(playerRepository) {
		this.playerRepository = playerRepository;
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
		if (newName.length > MAX_NAME_LENGTH)
			throw new Error(`changeCurrentName: newName must be less than or equal to ${MAX_NAME_LENGTH}.`);

		if (newName.length === 0)
			newName = NO_NAME;

		await this.playerRepository.changeCurrentName(playerID, newName);

		await changeDiscordNameOfPlayer(playerID, newName);
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
		}

		await this.changeCurrentName(playerID, publishedName);
		await sendToNamesToVoteOnChannel(
			`\`${publishedName}\``
		);
	}

	async finalizeAllNames() {
		const players = await this.playerRepository.getPlayers();

		await sendToNamesToVoteOnChannel(`The game has ended and now it's time to vote on the players' final names!`);
		await sendToNamesToVoteOnChannel(`# Names to vote on`);

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
		await this.playerRepository.addPlayer(playerID);
	}
}

module.exports = PlayerService;