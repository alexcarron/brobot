const { saveObjectToJsonInGitHub, loadObjectFromJsonInGitHub } = require("../../../utilities/github-json-storage-utils");

// TODO: Implement with SQLite and Redis

/**
 * Provides access to the dynamic player data.
 */
class PlayerRepository {
	static REPO_NAME = "namesmith-players";
	players = [];

	async load() {
		this.players = await loadObjectFromJsonInGitHub(PlayerRepository.REPO_NAME);
	}

	async save() {
		await saveObjectToJsonInGitHub(
			this.players,
			PlayerRepository.REPO_NAME
		);
	}

	/**
	 * Returns a list of all player objects in the game.
	 * @returns {Promise<Array<{
	 * 	id: string,
	 * 	currentName: string,
	 * 	publishedName: string | null,
	 * 	tokens: number,
	 * 	role: null,
	 * 	perks: null,
	 * 	inventory: string,
	 * 	unlockedRecipes: string[],
	 * 	unlockedMysteryBoxes: number[]
	 * }>>} An array of player objects.
	 */
	async getPlayers() {
		await this.load();
		return this.players;
	}

	/**
	 * Retrieves a player by their ID.
	 * @param {string} playerID - The ID of the player to be retrieved.
	 * @returns {Promise<{
	 * 	id: string,
	 * 	currentName: string,
	 * 	publishedName: string | null,
	 * 	tokens: number,
	 * 	role: string | null,
	 * 	perks: string[] | null,
	 * 	inventory: string,
	 * 	unlockedRecipes: number[],
	 * 	unlockedMysteryBoxes: number[]
	 * } | undefined>} The player object if found, otherwise undefined.
	 */
	async getPlayerByID(playerID) {
		await this.load();
		return this.players.find(player => player.id === playerID);
	}

	/**
	 * Retrieves a list of players without published names.
	 * @returns {Promise<Array<{
	 * 	id: string,
	 * 	currentName: string,
	 * 	publishedName: undefined | null,
	 * 	tokens: number,
	 * 	role: string | null,
	 * 	perks: string[] | null,
	 * 	inventory: string,
	 * 	unlockedRecipes: number[],
	 * 	unlockedMysteryBoxes: number[]
	 * }>>} An array of player objects without a published name.
	 */
	async getPlayersWithoutPublishedNames() {
		await this.load();
		return this.players.filter(player =>
			player.publishedName === undefined ||
			player.publishedName === null
		);
	}

	/**
	 * Retrieves the current name of a player.
	 * @param {string} playerID - The ID of the player whose name is being retrieved.
	 * @returns {Promise<string>} The current name of the player.
	 */
	async getCurrentName(playerID) {
		const player = await this.getPlayerByID(playerID);
		return player.currentName;
	}

	/**
	 * Changes the current name of a player.
	 * @param {string} playerID - The ID of the player whose name is being changed.
	 * @param {string} newName - The new name to assign to the player.
	 * @returns {Promise<void>} A promise that resolves once the name has been changed.
	 */
	async changeCurrentName(playerID, newName) {
		const player = await this.getPlayerByID(playerID);
		player.currentName = newName;
		await this.save();
	}

	/**
	 * Retrieves a player's published name from the namesmith database.
	 * @param {string} playerID - The ID of the player whose name is being retrieved.
	 * @returns {Promise<string | undefined>} The published name of the player, or undefined if the player has no published name.
	 */
	async getPublishedName(playerID) {
		const player = await this.getPlayerByID(playerID);
		return player.publishedName;
	}

	/**
	 * Publishes a player's name to the namesmith database.
	 * @param {string} playerID - The ID of the player whose name is being published.
	 * @param {string} name - The name to be published for the player.
	 * @returns {Promise<void>} A promise that resolves once the published name has been saved to the database.
	 */
	async publishName(playerID, name) {
		const player = await this.getPlayerByID(playerID);
		player.publishedName = name;
		await this.save();
	}

	/**
	 * Adds a new player to the game's database.
	 * @param {string} playerID - The ID of the player to be added.
	 * @returns {Promise<void>} A promise that resolves once the player has been added.
	 */
	async addPlayer(playerID) {
		const existingPlayer = await this.getPlayerByID(playerID);
		if (existingPlayer) return;

		const player = {
			id: playerID,
			currentName: "",
			publishedName: null,
			tokens: 0,
			role: null,
			perks: null,
			inventory: "",
			unlockedRecipes: [],
			unlockedMysteryBoxes: []
		};
		this.players.push(player);
		await this.save();
	}

	/**
	 * Resets the list of players, clearing all existing players.
	 * @returns {Promise<void>} A promise that resolves once the players have been cleared and saved.
	 */

	async reset() {
		this.players = []
		await this.save();
	}
}

module.exports = PlayerRepository