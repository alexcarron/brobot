const { sendToPublishedNamesChannel, changeDiscordNameOfPlayer, } = require("../utilities/discord-action.utility");
const PlayerRepository = require("../repositories/player.repository");

const MAX_NAME_LENGTH = 32;

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

	async publishName(playerID) {
		const currentName = await this.getCurrentName(playerID);
		await this.playerRepository.publishName(playerID, currentName);
		await sendToPublishedNamesChannel(
			`<@${playerID}> has published their name:\n` +
			`\`${currentName}\``
		);
	}
}

module.exports = PlayerService;