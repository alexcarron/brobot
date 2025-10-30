import { InvalidArgumentError } from "../../../utilities/error-utils";
import { Override } from "../../../utilities/types/generic-types";
import { MAX_NAME_LENGTH } from "../constants/namesmith.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { DBPerk, DBPlayerPerk } from "../types/perk.types";
import { DBPlayer, MinimalPlayer, Player, PlayerID } from "../types/player.types";
import { PlayerNotFoundError, PlayerAlreadyExistsError } from "../utilities/error.utility";
import { toPerk } from "../utilities/perk.utility";
import { toMinimalPlayerObject } from "../utilities/player.utility";

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
	 * Retrieves a list of all minimal player objects in the game.
	 * @returns An array of minimal player objects.
	 */
	private getMinimalPlayers(): MinimalPlayer[] {
		const query = `SELECT * FROM player`;
		const dbPlayers = this.db.getRows(query) as DBPlayer[];
		return dbPlayers.map(dbPlayer => toMinimalPlayerObject(dbPlayer));
	}

	private attachExistingPerksToPlayer(
		minimalPlayer: MinimalPlayer
	): Player {
		const dbPerks = this.db.getRows(
			`SELECT id, name, description
				FROM playerPerk
				JOIN perk ON playerPerk.perkID = perk.id
				WHERE playerID = @playerID`,
			{ playerID: minimalPlayer.id }
		) as Array<DBPerk>;

		return {
			...minimalPlayer,
			role: null,
			perks: dbPerks.map(toPerk),
		};
	}

	/**
	 * Maps an array of minimal player objects to an array of player objects, including each player's perks.
	 * @param minimalPlayers - An array of minimal player objects.
	 * @returns An array of player objects.
	 */
	private attachExistingPerksToPlayers(minimalPlayers: MinimalPlayer[]): Player[] {
		const playerPerks = this.db.getRows(
			`SELECT playerID, perkID, id, name, description, wasOffered
				FROM playerPerk
				JOIN perk ON playerPerk.perkID = perk.id`
		) as Array<DBPlayerPerk & DBPerk>;

		return minimalPlayers.map(minimalPlayer => {
			const perks = playerPerks
				.filter(playerPerk => playerPerk.playerID === minimalPlayer.id)
				.map(playerPerk => toPerk(playerPerk));

			return {
				...minimalPlayer,
				role: null,
				perks
			}
		});
	}

	/**
	 * Returns a list of all player objects in the game.
	 * @returns An array of player objects.
	 */
	getPlayers(): Player[] {
		const minimalPlayers = this.getMinimalPlayers();
		return this.attachExistingPerksToPlayers(minimalPlayers);
	}

	getMinimalPlayerByID(playerID: PlayerID): MinimalPlayer | null {
		const query = `SELECT * FROM player WHERE id = @id`;
		const player = this.db.getRow(query, { id: playerID }) as DBPlayer | undefined;

		if (player === undefined)
			return null;

		return toMinimalPlayerObject(player);
	}

	/**
	 * Retrieves a player by their ID.
	 * @param playerID - The ID of the player to be retrieved.
	 * @returns The player object if found, otherwise null.
	 */
	getPlayerByID(playerID: string): Player | null {
		const minimalPlayer = this.getMinimalPlayerByID(playerID);
		if (minimalPlayer === null)
			return null;

		return this.attachExistingPerksToPlayer(minimalPlayer);
	}

	/**
	 * Retrieves a player by its ID. If the player does not exist, an error is thrown.
	 * @param playerID - The ID of the player to be retrieved.
	 * @returns The player object with the given ID.
	 * @throws {PlayerNotFoundError} - If the player does not exist.
	 */
	getPlayerOrThrow(playerID: PlayerID): Player {
		const player = this.getPlayerByID(playerID);

		if (player === null)
			throw new PlayerNotFoundError(playerID);

		return player
	}

	/**
	 * Retrieves a list of minimal player objects with the given current name.
	 * @param currentName - The current name to search for.
	 * @returns An array of minimal player objects with the given current name.
	 */
	private getMinimalPlayersByCurrentName(currentName: string): MinimalPlayer[] {
		const query = `SELECT * FROM player WHERE currentName = @currentName`;

		const player = this.db.getRows(query, { currentName }) as DBPlayer[];

		return player.map(dbPlayer => toMinimalPlayerObject(dbPlayer));
	}

	/**
	 * Retrieves a list of all player objects with the given current name.
	 * @param currentName - The current name to search for.
	 * @returns An array of player objects with the given current name.
	 */
	getPlayersByCurrentName(currentName: string): Player[] {
		const minimalPlayers = this.getMinimalPlayersByCurrentName(currentName);
		return this.attachExistingPerksToPlayers(minimalPlayers);
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

	private getMinimalPlayersWithoutPublishedNames(): Override<MinimalPlayer, {
		publishedName: null
	}>[]  {
		const query = `SELECT * FROM player WHERE publishedName IS NULL`;
		const dbPlayers = this.db.getRows(query) as DBPlayer[];
		return dbPlayers.map(dbPlayer => ({
			...toMinimalPlayerObject(dbPlayer),
			publishedName: null
		}));
	}

	/**
	 * Retrieves a list of players without published names.
	 * @returns An array of player objects without a published name.
	 */
	getPlayersWithoutPublishedNames(): Override<Player, {
		publishedName: null
	}>[] {
		const minimalPlayers = this.getMinimalPlayersWithoutPublishedNames();
		return this.attachExistingPerksToPlayers(minimalPlayers) as any;
	}

	/**
	 * Retrieves a list of players with published names.
	 * @returns An array of minimal player objects with published names.
	 */
	private getMinimalPlayersWithPublishedNames(): Override<MinimalPlayer, {
		publishedName: string
	}>[]  {
		const query = `SELECT * FROM player WHERE publishedName IS NOT NULL`;
		const dbPlayers = this.db.getRows(query) as DBPlayer[];
		return dbPlayers.map(dbPlayer => ({
			...toMinimalPlayerObject(dbPlayer),
			publishedName: dbPlayer.publishedName!
		}));
	}

	/**
	 * Retrieves a list of players with published names.
	 * @returns An array of player objects with a published name.
	 */
	getPlayersWithPublishedNames(): Override<Player,
		{publishedName: string}
	>[] {
		const minimalPlayers = this.getMinimalPlayersWithPublishedNames();
		return this.attachExistingPerksToPlayers(minimalPlayers) as any;
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
	 * Retrieves the number of tokens a player has.
	 * @param playerID - The ID of the player whose tokens are being retrieved.
	 * @returns The number of tokens the player has.
	 * @throws {PlayerNotFoundError} - If the player with the specified ID is not found.
	 */
	getTokens(playerID: string): number {
		const player = this.getPlayerByID(playerID);

		if (!player)
			throw new PlayerNotFoundError(playerID);

		return player.tokens;
	}

	/**
	 * Sets the number of tokens a player has in the namesmith database.
	 * @param playerID - The ID of the player whose tokens are being set.
	 * @param tokens - The number of tokens the player is being given.
	 * @throws {PlayerNotFoundError} - If the player with the specified ID is not found.
	 * @throws {InvalidArgumentError} - If the number of tokens is negative.
	 */
	setTokens(playerID: string, tokens: number) {
		const query = `
			UPDATE player
			SET tokens = @tokens
			WHERE id = @id
		`;

		const result = this.db.run(query, { tokens, id: playerID });
		if (result.changes === 0)
			throw new PlayerNotFoundError(playerID);
	}

	/**
	 * Retrieves the last time a player claimed a refill from the namesmith database.
	 * @param playerID - The ID of the player whose last claimed refill time is being retrieved.
	 * @returns The last time the player claimed a refill, or null if the player has never claimed a refill.
	 * @throws {PlayerNotFoundError} - If the player with the specified ID is not found.
	 */
	getLastClaimedRefillTime(playerID: string): Date | null {
		const player = this.getPlayerByID(playerID);

		if (!player)
			throw new PlayerNotFoundError(playerID);

		return player.lastClaimedRefillTime;
	}

	/**
	 * Sets the last time a player claimed a refill in the namesmith database.
	 * @param playerID - The ID of the player whose last claimed refill time is being set.
	 * @param lastClaimedRefillTime - The last time the player claimed a refill.
	 * @throws {PlayerNotFoundError} - If the player with the specified ID is not found.
	 */
	setLastClaimedRefillTime(playerID: string, lastClaimedRefillTime: Date) {
		const query = `
			UPDATE player
			SET lastClaimedRefillTime = @lastClaimedRefillTime
			WHERE id = @id
		`;

		const result = this.db.run(query, {
			lastClaimedRefillTime: lastClaimedRefillTime.getTime(),
			id: playerID
		});

		if (result.changes === 0)
			throw new PlayerNotFoundError(playerID);
	}

	/**
	 * Retrieves the role ID of a player from the namesmith database.
	 * @param playerID - The ID of the player whose role ID is being retrieved.
	 * @returns The role ID of the player, or null if the player does not exist.
	 * @throws {PlayerNotFoundError} - If the player with the specified ID is not found.
	 */
	getRoleID(playerID: PlayerID): number | null {
		const roleID = this.db.getValue(
			"SELECT role FROM player WHERE id = @id",
			{ id: playerID }
		);

		if (roleID === undefined)
			throw new PlayerNotFoundError(playerID);

		return roleID as number | null;
	}

	/**
	 * Sets the role ID of a player in the namesmith database.
	 * @param playerID - The ID of the player whose role ID is being set.
	 * @param roleID - The role ID to assign to the player, or null to remove the role ID.
	 * @throws {PlayerNotFoundError} - If the player with the specified ID is not found.
	 */
	setRoleID(playerID: PlayerID, roleID: number | null) {
		const query = `
			UPDATE player
			SET role = @role
			WHERE id = @id
		`;

		const result = this.db.run(query, {
			role: roleID,
			id: playerID
		});

		if (result.changes === 0)
			throw new PlayerNotFoundError(playerID);
	}

	/**
	 * Adds a new player to the game's database.
	 * @param playerID - The ID of the player to be added.
	 */
	createPlayer(playerID: string) {
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
}