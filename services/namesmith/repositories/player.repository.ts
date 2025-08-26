import { InvalidArgumentError } from "../../../utilities/error-utils";
import { Override } from "../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../database/database-querier";
import { DBPlayer, Player, PlayerID } from "../types/player.types";
import { PlayerNotFoundError, PlayerAlreadyExistsError } from "../utilities/error.utility";

const MAX_NAME_LENGTH = 32;

/**
 * Provides access to the dynamic player data.
 */
export class PlayerRepository {
	db: DatabaseQuerier;

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(db: DatabaseQuerier) {
		this.db = db;
	}

	/**
	 * Returns a list of all player objects in the game.
	 * @returns An array of player objects.
	 */
	getPlayers(): Player[] {
		const query = `SELECT * FROM player`;
		const getAllPlayers = this.db.prepare(query);
		return getAllPlayers.all() as DBPlayer[];
	}

	/**
	 * Retrieves a player by their ID.
	 * @param playerID - The ID of the player to be retrieved.
	 * @returns The player object if found, otherwise null.
	 */
	getPlayerByID(playerID: string): Player | null {
		const query = `SELECT * FROM player WHERE id = @id`;
		const getPlayerById = this.db.prepare(query);
		const player = getPlayerById.get({ id: playerID }) as DBPlayer | undefined;
		return player || null;
	}

	/**
	 * Retrieves a list of all player objects with the given current name.
	 * @param currentName - The current name to search for.
	 * @returns An array of player objects with the given current name.
	 */
	getPlayersByCurrentName(currentName: string): Player[] {
		const query = `SELECT * FROM player WHERE currentName = @currentName`;
		const getPlayersByCurrentName = this.db.prepare(query);
		return getPlayersByCurrentName.all({ currentName }) as DBPlayer[];
	}

	/**
	 * Checks if a player exists in the database by their ID.
	 * @param playerID - The ID of the player to check for existence.
	 * @returns True if the player exists, otherwise false.
	 */
	doesPlayerExist(playerID: string): boolean {
		const query = `SELECT id FROM player WHERE id = @id LIMIT 1`;
		const idOfPlayer = this.db.getRow(query, { id: playerID });
		if (idOfPlayer === undefined)
			return false;
		return true;
	}

	/**
	 * Retrieves a list of players without published names.
	 * @returns An array of player objects without a published name.
	 */
	getPlayersWithoutPublishedNames(): Override<Player, "publishedName", null>[] {
		const query = `SELECT * FROM player WHERE publishedName IS NULL`;
		const getPlayersWithoutPublishedNames = this.db.prepare(query);
		return getPlayersWithoutPublishedNames.all() as Override<DBPlayer, "publishedName", null>[];
	}

	/**
	 * Retrieves the inventory of a player.
	 * @param playerID - The ID of the player whose inventory is being retrieved.
	 * @returns The inventory of the player.
	 */
	getInventory(playerID: PlayerID): string {
		const player = this.getPlayerByID(playerID);
		if (!player)
			throw new PlayerNotFoundError(playerID);

		return player.inventory;
	}

	/**
	 * Sets the inventory of a player.
	 * @param playerID - The ID of the player whose inventory is being set.
	 * @param inventory - The new inventory string to assign to the player.
	 * @throws {PlayerNotFoundError} - If the player with the specified ID is not found.
	 */
	setInventory(playerID: PlayerID, inventory: string): void {
		const runResult = this.db.run(
			`UPDATE player SET inventory = @inventory WHERE id = @id`,
			{ inventory, id: playerID }
		);

		if (runResult.changes === 0)
			throw new PlayerNotFoundError(playerID);
	}

	/**
	 * Retrieves the current name of a player.
	 * @param playerID - The ID of the player whose name is being retrieved.
	 * @returns The current name of the player.
	 */
	getCurrentName(playerID: string): string {
		const player = this.getPlayerByID(playerID);
		if (!player)
			throw new PlayerNotFoundError(playerID);

		return player.currentName;
	}

	/**
	 * Changes the current name of a player.
	 * @param playerID - The ID of the player whose name is being changed.
	 * @param newName - The new name to assign to the player.
	 */
	changeCurrentName(playerID: string, newName: string) {
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
	 * @param playerID - The ID of the player whose name is being retrieved.
	 * @returns The published name of the player, or undefined if the player has no published name.
	 */
	getPublishedName(playerID: string): string | null {
		const player = this.getPlayerByID(playerID);
		if (!player)
			throw new PlayerNotFoundError(playerID);

		return player.publishedName;
	}

	/**
	 * Publishes a player's name to the namesmith database.
	 * @param playerID - The ID of the player whose name is being published.
	 * @param name - The name to be published for the player.
	 */
	publishName(playerID: string, name: string) {
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
	 * @param playerID - The ID of the player to be added.
	 */
	addPlayer(playerID: string) {
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
	 * @param playerID - The ID of the player whose inventory is being modified.
	 * @param characterValue - The value of the character to add to the player's inventory.
	 */
	addCharacterToInventory(playerID: string, characterValue: string) {
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