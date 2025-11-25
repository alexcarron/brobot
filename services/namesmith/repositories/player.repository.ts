import { InvalidArgumentError, returnNonNullOrThrow } from "../../../utilities/error-utils";
import { getRandomNumericUUID } from "../../../utilities/random-utils";
import { Override, WithOptional, WithRequiredAndOneOther } from "../../../utilities/types/generic-types";
import { MAX_NAME_LENGTH } from "../constants/namesmith.constants";
import { DatabaseQuerier, toParameterSetClause } from "../database/database-querier";
import { asMinimalPlayer, asMinimalPlayers, MinimalPlayer, Player, PlayerDefinition, PlayerID, PlayerResolvable } from "../types/player.types";
import { RoleID } from "../types/role.types";
import { PlayerNotFoundError, PlayerAlreadyExistsError } from "../utilities/error.utility";
import { RoleRepository } from "./role.repository";
import { PerkRepository } from './perk.repository';
import { isString } from "../../../utilities/types/type-guards";
import { isOneSymbol } from "../../../utilities/string-checks-utils";
import { createMockDB } from "../mocks/mock-database";

/**
 * Provides access to the dynamic player data.
 */
export class PlayerRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 * @param roleRepository - The role repository instance used for retrieving role data.
	 * @param perkRepository - The perk repository instance used for retrieving perk data.
	 */
	constructor(
		public db: DatabaseQuerier,
		public roleRepository: RoleRepository,
		public perkRepository: PerkRepository
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new PlayerRepository(db,
			RoleRepository.fromDB(db),
			PerkRepository.fromDB(db)
		);
	}

	static asMock() {
		const db = createMockDB();
		return PlayerRepository.fromDB(db);
	}

	/**
	 * Retrieves a list of all minimal player objects in the game.
	 * @returns An array of minimal player objects.
	 */
	private getMinimalPlayers(): MinimalPlayer[] {
		return asMinimalPlayers(
			this.db.getRows('SELECT * FROM player')
		)
	}

	private toPlayerFromMinimal(
		minimalPlayer: MinimalPlayer
	): Player {
		const role = this.roleRepository.getRoleOfPlayerID(minimalPlayer.id);
		const perks = this.perkRepository.getPerksOfPlayerID(minimalPlayer.id);

		return {
			...minimalPlayer,
			role,
			perks,
		};
	}

	/**
	 * Maps an array of minimal player objects to an array of player objects, including each player's perks.
	 * @param minimalPlayers - An array of minimal player objects.
	 * @returns An array of player objects.
	 */
	private toPlayersFromMinimals(minimalPlayers: MinimalPlayer[]): Player[] {
		return minimalPlayers.map(
			minimalPlayer => this.toPlayerFromMinimal(minimalPlayer)
		);
	}

	/**
	 * Returns a list of all player objects in the game.
	 * @returns An array of player objects.
	 */
	getPlayers(): Player[] {
		const minimalPlayers = this.getMinimalPlayers();
		return this.toPlayersFromMinimals(minimalPlayers);
	}

	private getMinimalPlayerByID(playerID: PlayerID): MinimalPlayer | null {
		const row = this.db.getRow(
			'SELECT * FROM player WHERE id = ?', playerID
		);

		if (row === undefined)
			return null;

		return asMinimalPlayer(row);
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

		return this.toPlayerFromMinimal(minimalPlayer);
	}

	getMinimalPlayerOrThrow(playerID: PlayerID): MinimalPlayer {
		return returnNonNullOrThrow(
			this.getMinimalPlayerByID(playerID),
			new PlayerNotFoundError(playerID)
		);
	}

	/**
	 * Retrieves a player by its ID. If the player does not exist, an error is thrown.
	 * @param playerID - The ID of the player to be retrieved.
	 * @returns The player object with the given ID.
	 * @throws {PlayerNotFoundError} - If the player does not exist.
	 */
	getPlayerOrThrow(playerID: PlayerID): Player {
		return returnNonNullOrThrow(
			this.getPlayerByID(playerID),
			new PlayerNotFoundError(playerID)
		)
	}

	/**
	 * Resolves a player from the given resolvable.
	 * @param playerResolvable - The player resolvable to resolve.
	 * @returns The resolved player object.
	 * @throws {PlayerNotFoundError} If the player resolvable is invalid or the player is not found.
	 */
	resolvePlayer(playerResolvable: PlayerResolvable): Player {
		const playerID: PlayerID =
			isString(playerResolvable)
				? playerResolvable
				: playerResolvable.id;

		return this.getPlayerOrThrow(playerID);
	}
	/**
	 * Resolves a player resolvable to a player ID.
	 * @param playerResolvable - The player resolvable to resolve.
	 * @returns The resolved player ID.
	 * @throws {PlayerNotFoundError} If the player resolvable is invalid or the player is not found.
	 */
	resolveID(playerResolvable: PlayerResolvable): PlayerID {
		if (isString(playerResolvable)) {
			const playerID = playerResolvable;
			return playerID;
		}
		else {
			const player = playerResolvable;
			return player.id;
		}
	}

	/**
	 * Retrieves a list of minimal player objects with the given current name.
	 * @param currentName - The current name to search for.
	 * @returns An array of minimal player objects with the given current name.
	 */
	private getMinimalPlayersByCurrentName(currentName: string): MinimalPlayer[] {
		return asMinimalPlayers(
			this.db.getRows(
				'SELECT * FROM player WHERE currentName = @currentName',
				{ currentName }
			)
		)
	}

	/**
	 * Retrieves a list of all player objects with the given current name.
	 * @param currentName - The current name to search for.
	 * @returns An array of player objects with the given current name.
	 */
	getPlayersByCurrentName(currentName: string): Player[] {
		const minimalPlayers = this.getMinimalPlayersByCurrentName(currentName);
		return this.toPlayersFromMinimals(minimalPlayers);
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
		const rows = this.db.getRows(
			'SELECT * FROM player WHERE publishedName IS NULL'
		);

		return rows.map(row => ({
			...asMinimalPlayer(row),
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
		return this.toPlayersFromMinimals(minimalPlayers) as any;
	}

	/**
	 * Retrieves a list of players with published names.
	 * @returns An array of minimal player objects with published names.
	 */
	private getMinimalPlayersWithPublishedNames(): Override<MinimalPlayer, {
		publishedName: string
	}>[]  {
		const rows = this.db.getRows(
			'SELECT * FROM player WHERE publishedName IS NOT NULL'
		)
		return rows.map(row => {
			const minimalPlayer = asMinimalPlayer(row)
			return {
				...minimalPlayer,
				publishedName: minimalPlayer.publishedName!
			}
		});
	}

	/**
	 * Retrieves a list of players with published names.
	 * @returns An array of player objects with a published name.
	 */
	getPlayersWithPublishedNames(): Override<Player,
		{publishedName: string}
	>[] {
		const minimalPlayers = this.getMinimalPlayersWithPublishedNames();
		return this.toPlayersFromMinimals(minimalPlayers) as any;
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
		if (!isOneSymbol(characterValue))
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
	setPublishedName(playerID: string, name: string) {
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
	 * Adds a minimal player to the database with the given properties.
	 * @param minimalPlayerDefinition - The properties of the minimal player to be added.
	 * @param minimalPlayerDefinition.id - The ID of the player to be added (optional).
	 * @param minimalPlayerDefinition.currentName - The current name of the player (optional).
	 * @param minimalPlayerDefinition.publishedName - The published name of the player (optional).
	 * @param minimalPlayerDefinition.tokens - The number of tokens the player has (optional).
	 * @param minimalPlayerDefinition.role - The role of the player (optional).
	 * @param minimalPlayerDefinition.inventory - The player's inventory (optional).
	 * @param minimalPlayerDefinition.lastClaimedRefillTime - The last time the player claimed a refill (optional).
	 * @throws {PlayerAlreadyExistsError} - If a player with the given ID already exists.
	 * @returns The minimal player object with the given properties and the generated ID.
	 */
	private addMinimalPlayer({id, currentName, publishedName, tokens, role, inventory, lastClaimedRefillTime}:
		WithOptional<MinimalPlayer, 'id'>
	): MinimalPlayer {
		if (id === undefined) {
			id = getRandomNumericUUID();
		}

		if (this.doesPlayerExist(id)) {
			throw new PlayerAlreadyExistsError(id);
		}

		this.db.run(
			`INSERT INTO player (id, currentName, publishedName, tokens, role, inventory, lastClaimedRefillTime)
			VALUES (@id, @currentName, @publishedName, @tokens, @role, @inventory, @lastClaimedRefillTime)`,
			{
				id, currentName, publishedName, tokens, role, inventory,
				lastClaimedRefillTime:
					lastClaimedRefillTime?.getTime() ?? null
			}
		);


		return this.getMinimalPlayerOrThrow(id);
	}

	/**
	 * Adds a new player to the game's database with the given properties.
	 * @param playerDefinition - The properties of the player to be added.
	 * @param playerDefinition.id - The ID of the player to be added (optional).
	 * @param playerDefinition.currentName - The current name of the player (optional).
	 * @param playerDefinition.publishedName - The published name of the player (optional).
	 * @param playerDefinition.tokens - The number of tokens the player has (optional).
	 * @param playerDefinition.inventory - The player's inventory (optional).
	 * @param playerDefinition.lastClaimedRefillTime - The last time the player claimed a refill (optional).
	 * @param playerDefinition.role - The role of the player (optional).
	 * @param playerDefinition.perks - The perks of the player (optional).
	 * @throws {PlayerAlreadyExistsError} - If a player with the given ID already exists.
	 * @throws {RoleNotFoundError} - If the role with the given name does not exist.
	 * @throws {PerkNotFoundError} - If the perk with the given name does not exist.
	 * @returns The player object with the given properties and the generated ID.
	 */
	addPlayer({
		id, currentName, publishedName, tokens, inventory, lastClaimedRefillTime,
		role: maybeRoleResolvable,
		perks: perkResolvables
	}: PlayerDefinition) {
		let roleID: RoleID | null = null;
		if (maybeRoleResolvable !== null) {
			const roleResolvable = maybeRoleResolvable;
			roleID = this.roleRepository.resolveID(roleResolvable);
		}

		const minimalPlayer = this.addMinimalPlayer({
			id, currentName, publishedName, tokens, role: roleID, inventory, lastClaimedRefillTime
		});

		this.db.run(
			`UPDATE player
			SET role = @role
			WHERE id = @id`,
			{ role: roleID, id: minimalPlayer.id }
		);

		for (const perk of perkResolvables) {
			const perkID = this.perkRepository.resolveID(perk);
			this.perkRepository.addPerkIDToPlayer(perkID, minimalPlayer.id);
		}

		return this.getPlayerOrThrow(minimalPlayer.id);
	}

	/**
	 * Updates a minimal player with the given properties in the database.
	 * @param minimalPlayerDefinition - The properties of the minimal player to be updated.
	 * @param minimalPlayerDefinition.id - The ID of the player to be updated.
	 * @param minimalPlayerDefinition.currentName - The current name of the player (optional).
	 * @param minimalPlayerDefinition.publishedName - The published name of the player (optional).
	 * @param minimalPlayerDefinition.tokens - The number of tokens the player has (optional).
	 * @param minimalPlayerDefinition.inventory - The player's inventory (optional).
	 * @param minimalPlayerDefinition.lastClaimedRefillTime - The last time the player claimed a refill (optional).
	 * @throws {PlayerNotFoundError} - If the player with the specified ID is not found.
	 * @returns The minimal player object with the given properties and the generated ID.
	 */
	private updateMinimalPlayer(
		{id, currentName, publishedName, tokens, inventory, lastClaimedRefillTime}:
			WithRequiredAndOneOther<Player, "id">
	): MinimalPlayer {
		if (this.doesPlayerExist(id) === false) {
			throw new PlayerNotFoundError(id);
		}

		this.db.run(
			`UPDATE player
			SET ${toParameterSetClause({ currentName, publishedName, tokens, inventory, lastClaimedRefillTime })}
			WHERE id = @id`,
			{
				id, currentName, publishedName, tokens, inventory,
				lastClaimedRefillTime:
					lastClaimedRefillTime?.getTime() ?? null
			}
		);

		return this.getMinimalPlayerOrThrow(id);
	}

	updatePlayer({
		id, currentName, publishedName, tokens, inventory, lastClaimedRefillTime,
		role: roleResolvable,
		perks: perkResolvables
	}:
		WithRequiredAndOneOther<PlayerDefinition, "id">
	) {
		if (
			[currentName, publishedName, tokens, inventory, lastClaimedRefillTime].some((value) => value !== undefined)
		) {
			this.updateMinimalPlayer({ id, currentName, publishedName, tokens: tokens!, inventory, lastClaimedRefillTime });
		}

		if (roleResolvable !== undefined) {
			let roleID: RoleID | null = null;
			if (roleResolvable !== null) {
				roleID = this.roleRepository.resolveID(roleResolvable);
			}

			this.setRoleID(id, roleID);
		}

		if (perkResolvables !== undefined) {
			this.perkRepository.removePerksFromPlayerID(id);

			for (const perk of perkResolvables) {
				const perkID = this.perkRepository.resolveID(perk);
				this.perkRepository.addPerkIDToPlayer(perkID, id);
			}
		}

		return this.getPlayerOrThrow(id);
	}

	/**
	 * Removes a player from the game's database.
	 * @param playerID - The ID of the player to be removed.
	 * @throws {PlayerNotFoundError} - If the player with the specified ID is not found.
	 */
	removePlayer(playerID: string) {
		const result = this.db.run(
			`DELETE FROM player WHERE id = ?`, playerID
		)

		if (result.changes === 0)
			throw new PlayerNotFoundError(playerID);
	}

	/**
	 * Resets the list of players, clearing all existing players.
	 */
	removePlayers() {
		this.db.run(`DELETE FROM player`);
	}
}