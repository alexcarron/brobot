const Database = require("better-sqlite3");

const MAX_NAME_LENGTH = 32;

/**
 * Provides access to the dynamic player data.
 */
class PlayerRepository {
	/**
	 * @type {Database}
	 */
	db;

	/**
	 * Constructs a new PlayerRepository instance.
	 * @param {Database} db - The database connection to use.
	 */
	constructor(db) {
		this.db = db;
	}

	/**
	 * Returns a list of all player objects in the game.
	 * @returns {Promise<Array<{
	 * 	id: string,
	 * 	currentName: string,
	 * 	publishedName: string | null,
	 * 	tokens: number,
	 * 	role: string | null,
	 * 	inventory: string,
	 * }>>} An array of player objects.
	 */
	async getPlayers() {
		const query = `SELECT * FROM player`;
		const getAllPlayers = this.db.prepare(query);
		return getAllPlayers.all();
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
	 * 	inventory: string,
	 * } | undefined>} The player object if found, otherwise undefined.
	 */
	async getPlayerByID(playerID) {
		const query = `SELECT * FROM player WHERE id = @id`;
		const getPlayerById = this.db.prepare(query);
		return getPlayerById.get({ id: playerID });
	}

	/**
	 * Retrieves a list of players without published names.
	 * @returns {Promise<Array<{
	 * 	id: string,
	 * 	currentName: string,
	 * 	publishedName: null,
	 * 	tokens: number,
	 * 	role: string | null,
	 * 	inventory: string,
	 * }>>} An array of player objects without a published name.
	 */
	async getPlayersWithoutPublishedNames() {
		const query = `SELECT * FROM player WHERE publishedName IS NULL`;
		const getPlayersWithoutPublishedNames = this.db.prepare(query);
		return getPlayersWithoutPublishedNames.all();
	}

	/**
	 * Retrieves the inventory of a player.
	 * @param {string} playerID - The ID of the player whose inventory is being retrieved.
	 * @returns {Promise<string>} The inventory of the player.
	 */
	async getInventory(playerID) {
		const player = await this.getPlayerByID(playerID);
		if (!player)
			throw new Error(`getInventory: Player with ID ${playerID} not found`);

		return player.inventory;
	}

	/**
	 * Retrieves the current name of a player.
	 * @param {string} playerID - The ID of the player whose name is being retrieved.
	 * @returns {Promise<string>} The current name of the player.
	 */
	async getCurrentName(playerID) {
		const player = await this.getPlayerByID(playerID);
		if (!player)
			throw new Error(`getCurrentName: Player with ID ${playerID} not found`);

		return player.currentName;
	}

	/**
	 * Changes the current name of a player.
	 * @param {string} playerID - The ID of the player whose name is being changed.
	 * @param {string} newName - The new name to assign to the player.
	 * @returns {Promise<void>} A promise that resolves once the name has been changed.
	 */
	async changeCurrentName(playerID, newName) {
		if (newName === undefined)
			throw new Error("changeCurrentName: newName is undefined.");

		if (newName.length > MAX_NAME_LENGTH)
			throw new Error(`changeCurrentName: newName must be less than or equal to ${MAX_NAME_LENGTH}.`);

		const query = `
			UPDATE player
			SET currentName = @newName
			WHERE id = @id
		`;

		const changeCurrentName = this.db.prepare(query);
		const result = changeCurrentName.run({ newName, id: playerID });
		if (result.changes === 0)
			throw new Error(`changeCurrentName: Player with ID ${playerID} not found.`);
	}

	/**
	 * Retrieves a player's published name from the namesmith database.
	 * @param {string} playerID - The ID of the player whose name is being retrieved.
	 * @returns {Promise<string | undefined>} The published name of the player, or undefined if the player has no published name.
	 */
	async getPublishedName(playerID) {
		const player = await this.getPlayerByID(playerID);
		if (!player)
			throw new Error(`getPublishedName: Player with ID ${playerID} not found`);
		return player.publishedName;
	}

	/**
	 * Publishes a player's name to the namesmith database.
	 * @param {string} playerID - The ID of the player whose name is being published.
	 * @param {string} name - The name to be published for the player.
	 * @returns {Promise<void>} A promise that resolves once the published name has been saved to the database.
	 */
	async publishName(playerID, name) {
		if (name === undefined)
			throw new Error("publishName: name is undefined.");

		if (name.length > MAX_NAME_LENGTH)
			throw new Error(`publishName: name must be less than or equal to ${MAX_NAME_LENGTH}.`);

		const query = `
			UPDATE player
			SET publishedName = @name
			WHERE id = @id
		`;

		const publishName = this.db.prepare(query);
		const result = publishName.run({ name, id: playerID });
		if (result.changes === 0)
			throw new Error(`publishName: Player with ID ${playerID} not found.`);
	}

	/**
	 * Adds a new player to the game's database.
	 * @param {string} playerID - The ID of the player to be added.
	 * @returns {Promise<void>} A promise that resolves once the player has been added.
	 */
	async addPlayer(playerID) {
		const query = `
			INSERT INTO player (id, currentName, publishedName, tokens, role, inventory)
			VALUES (@id, @currentName, @publishedName, @tokens, @role, @inventory)
		`;

		const addPlayer = this.db.prepare(query);
		const result = addPlayer.run({
			id: playerID,
			currentName: "",
			publishedName: null,
			tokens: 0,
			role: null,
			inventory: ""
		});

		if (result.changes === 0)
			throw new Error(`addPlayer: Player with ID ${playerID} already exists.`);
	}

	/**
	 * Resets the list of players, clearing all existing players.
	 * @returns {Promise<void>} A promise that resolves once the players have been cleared and saved.
	 */
	async reset() {
		const query = `DELETE FROM player`;
		const reset = this.db.prepare(query);
		reset.run();
	}

	/**
	 * Adds a character to the player's inventory.
	 * @param {string} playerID - The ID of the player whose inventory is being modified.
	 * @param {string} characterValue - The value of the character to add to the player's inventory.
	 * @returns {Promise<void>} A promise that resolves once the character has been added to the player's inventory.
	 */
	async addCharacterToInventory(playerID, characterValue) {
		if (characterValue === undefined)
			throw new Error("addCharacterToInventory: characterValue is undefined.");

		if (characterValue.length !== 1)
			throw new Error("addCharacterToInventory: characterValue must be a single character.");

		const query = `
			UPDATE player
			SET inventory = inventory || @characterValue
			WHERE id = @playerID
		`;

		const addCharacterToInventory = this.db.prepare(query);
		const result = addCharacterToInventory.run({ characterValue, playerID });
		if (result.changes === 0)
			throw new Error(`addCharacterToInventory: Player with ID ${playerID} not found.`);
	}
}

module.exports = PlayerRepository