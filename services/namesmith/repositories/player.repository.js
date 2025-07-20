const { InvalidArgumentError, ResourceNotFoundError, ResourceConflictError } = require("../../../utilities/error-utils");
const DatabaseQuerier = require("../database/database-querier");
const { PlayerNotFoundError, PlayerAlreadyExistsError } = require("../utilities/error.utility");

const MAX_NAME_LENGTH = 32;

/**
 * Provides access to the dynamic player data.
 */
class PlayerRepository {
	/**
	 * @param {DatabaseQuerier} db - The database querier instance used for executing SQL statements.
	 */
	constructor(db) {
		if (!(db instanceof DatabaseQuerier))
			throw new InvalidArgumentError("CharacterRepository: db must be an instance of DatabaseQuerier.");

		/**
		 * @type {DatabaseQuerier}
		 */
		this.db = db;
	}

	/**
	 * Returns a list of all player objects in the game.
	 * @returns {Array<{
	 * 	id: string,
	 * 	currentName: string,
	 * 	publishedName: string | null,
	 * 	tokens: number,
	 * 	role: string | null,
	 * 	inventory: string,
	 * }>} An array of player objects.
	 */
	getPlayers() {
		const query = `SELECT * FROM player`;
		const getAllPlayers = this.db.prepare(query);
		return getAllPlayers.all();
	}

	/**
	 * Retrieves a player by their ID.
	 * @param {string} playerID - The ID of the player to be retrieved.
	 * @returns {{
	 * 	id: string,
	 * 	currentName: string,
	 * 	publishedName: string | null,
	 * 	tokens: number,
	 * 	role: string | null,
	 * 	inventory: string,
	 * } | undefined} The player object if found, otherwise undefined.
	 */
	getPlayerByID(playerID) {
		const query = `SELECT * FROM player WHERE id = @id`;
		const getPlayerById = this.db.prepare(query);
		return getPlayerById.get({ id: playerID });
	}

	/**
	 * Checks if a player exists in the database by their ID.
	 * @param {string} playerID - The ID of the player to check for existence.
	 * @returns {boolean} True if the player exists, otherwise false.
	 */
	doesPlayerExist(playerID) {
		const query = `SELECT id FROM player WHERE id = @id LIMIT 1`;
		const idOfPlayer = this.db.getRow(query, { id: playerID });
		if (idOfPlayer === undefined)
			return false;
		return true;
	}

	/**
	 * Retrieves a list of players without published names.
	 * @returns {Array<{
	 * 	id: string,
	 * 	currentName: string,
	 * 	publishedName: null,
	 * 	tokens: number,
	 * 	role: string | null,
	 * 	inventory: string,
	 * }>} An array of player objects without a published name.
	 */
	getPlayersWithoutPublishedNames() {
		const query = `SELECT * FROM player WHERE publishedName IS NULL`;
		const getPlayersWithoutPublishedNames = this.db.prepare(query);
		return getPlayersWithoutPublishedNames.all();
	}

	/**
	 * Retrieves the inventory of a player.
	 * @param {string} playerID - The ID of the player whose inventory is being retrieved.
	 * @returns {string} The inventory of the player.
	 */
	getInventory(playerID) {
		const player = this.getPlayerByID(playerID);
		if (!player)
			throw new PlayerNotFoundError(playerID);

		return player.inventory;
	}

	/**
	 * Retrieves the current name of a player.
	 * @param {string} playerID - The ID of the player whose name is being retrieved.
	 * @returns {string} The current name of the player.
	 */
	getCurrentName(playerID) {
		const player = this.getPlayerByID(playerID);
		if (!player)
			throw new PlayerNotFoundError(playerID);

		return player.currentName;
	}

	/**
	 * Changes the current name of a player.
	 * @param {string} playerID - The ID of the player whose name is being changed.
	 * @param {string} newName - The new name to assign to the player.
	 */
	changeCurrentName(playerID, newName) {
		if (newName === undefined)
			throw new InvalidArgumentError("changeCurrentName: newName is undefined.");

		if (newName.length > MAX_NAME_LENGTH)
			throw new InvalidArgumentError(`changeCurrentName: newName must be less than or equal to ${MAX_NAME_LENGTH}.`);

		const query = `
			UPDATE player
			SET currentName = @newName
			WHERE id = @id
		`;

		const changeCurrentName = this.db.prepare(query);
		const result = changeCurrentName.run({ newName, id: playerID });
		if (result.changes === 0)
			throw new PlayerNotFoundError(playerID);
	}

	/**
	 * Retrieves a player's published name from the namesmith database.
	 * @param {string} playerID - The ID of the player whose name is being retrieved.
	 * @returns {string | undefined} The published name of the player, or undefined if the player has no published name.
	 */
	getPublishedName(playerID) {
		const player = this.getPlayerByID(playerID);
		if (!player)
			throw new PlayerNotFoundError(playerID);
		return player.publishedName;
	}

	/**
	 * Publishes a player's name to the namesmith database.
	 * @param {string} playerID - The ID of the player whose name is being published.
	 * @param {string} name - The name to be published for the player.
	 */
	publishName(playerID, name) {
		if (name === undefined)
			throw new InvalidArgumentError("publishName: name is undefined.");

		if (name.length > MAX_NAME_LENGTH)
			throw new InvalidArgumentError(`publishName: name must be less than or equal to ${MAX_NAME_LENGTH}.`);

		const query = `
			UPDATE player
			SET publishedName = @name
			WHERE id = @id
		`;

		const publishName = this.db.prepare(query);
		const result = publishName.run({ name, id: playerID });
		if (result.changes === 0)
			throw new PlayerNotFoundError(playerID);
	}

	/**
	 * Adds a new player to the game's database.
	 * @param {string} playerID - The ID of the player to be added.
	 */
	addPlayer(playerID) {
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
			throw new PlayerAlreadyExistsError(playerID);
	}

	/**
	 * Resets the list of players, clearing all existing players.
	 */
	reset() {
		const query = `DELETE FROM player`;
		const reset = this.db.prepare(query);
		reset.run();
	}

	/**
	 * Adds a character to the player's inventory.
	 * @param {string} playerID - The ID of the player whose inventory is being modified.
	 * @param {string} characterValue - The value of the character to add to the player's inventory.
	 */
	addCharacterToInventory(playerID, characterValue) {
		if (characterValue === undefined)
			throw new InvalidArgumentError("addCharacterToInventory: characterValue is undefined.");

		if (characterValue.length !== 1)
			throw new InvalidArgumentError("addCharacterToInventory: characterValue must be a single character.");

		const query = `
			UPDATE player
			SET inventory = inventory || @characterValue
			WHERE id = @playerID
		`;

		const addCharacterToInventory = this.db.prepare(query);
		const result = addCharacterToInventory.run({ characterValue, playerID });
		if (result.changes === 0)
			throw new PlayerNotFoundError(playerID);
	}
}

module.exports = PlayerRepository