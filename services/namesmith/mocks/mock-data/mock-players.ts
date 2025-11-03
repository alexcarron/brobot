import { InvalidArgumentError, returnNonNullOrThrow } from "../../../../utilities/error-utils";
import { getRandomNumericUUID } from "../../../../utilities/random-utils";
import { WithAtLeast, WithAtLeastOneProperty, WithID } from "../../../../utilities/types/generic-types";
import { isNumber, isString } from "../../../../utilities/types/type-guards";
import { DatabaseQuerier } from "../../database/database-querier";
import { RoleRepository } from "../../repositories/role.repository";
import { DBPerk, Perk } from "../../types/perk.types";
import { DBPlayer, MinimalPlayer, Player, PlayerDefinition } from "../../types/player.types";
import { PlayerAlreadyExistsError } from "../../utilities/error.utility";
import { toMinimalPlayerObject } from "../../utilities/player.utility";
import { toPerk } from '../../utilities/perk.utility';
import { Role } from "../../types/role.types";
import { PerkRepository } from "../../repositories/perk.repository";

/**
 * An array of mock player data for use in tests.
 */
export const mockPlayers: WithID<PlayerDefinition>[] = [
	{
		id: "1234567890",
		currentName: "John Doe",
		publishedName: "John Doe",
		tokens: 10,
		role: null,
		perks: [],
		inventory: "John Doe",
		lastClaimedRefillTime: null,
	},
	{
		id: "1234567891",
		currentName: "abcdefgh",
		publishedName: "abcd",
		tokens: 0,
		role: null,
		perks: [],
		inventory: "abcdefghijklmnopqrstuvwxyz",
		lastClaimedRefillTime: null,
	},
	{
		id: "1234567892",
		currentName: "UNPUBLISHED",
		publishedName: null,
		tokens: 0,
		role: null,
		perks: [],
		inventory: "UNPUBLISHED",
		lastClaimedRefillTime: null,
	},
	{
		id: "1234567893",
		currentName: "non-voter",
		publishedName: "non-voter",
		tokens: 0,
		role: null,
		perks: [],
		inventory: "non-voter",
		lastClaimedRefillTime: null,
	}
];

/**
 * Creates a mock player object with default values for optional properties.
 * @param options - An object with the following properties:
 * @param options.id - The ID of the player.
 * @param options.currentName - The current name of the player.
 * @param options.publishedName - The published name of the player.
 * @param options.tokens - The number of tokens the player has.
 * @param options.role - The role of the player.
 * @param options.perks - The perks the player has.
 * @param options.inventory - The player's inventory.
 * @param options.lastClaimedRefillTime - The last time the player claimed a refill.
 * @returns A mock player object with the given properties and default values for optional properties.
 */
export const createMockPlayerObject = ({
	id,
	currentName = "",
	publishedName = null,
	tokens = 0,
	role = null,
	perks = [],
	inventory = "",
	lastClaimedRefillTime = null
}: WithAtLeast<Player, "id">): Player => {
	if (id === undefined || typeof id !== "string")
		throw new InvalidArgumentError(`createMockPlayerObject: player id must be a string, but got ${id}.`);

	return {id, currentName, publishedName, tokens, role, perks, inventory, lastClaimedRefillTime};
}

/**
 * Adds a player to the database with the given properties.
 * @param db - The in-memory database.
 * @param playerData - The player data to add.
 * @param playerData.id - The ID of the player.
 * @param playerData.currentName - The current name of the player.
 * @param playerData.publishedName - The published name of the player.
 * @param playerData.tokens - The number of tokens the player has.
 * @param playerData.role - The role of the player.
 * @param playerData.inventory - The player's inventory.
 * @param playerData.lastClaimedRefillTime - The last time the player claimed a refill.
 * @param playerData.perks - An array of perks to give the player. Each perk can be a Perk object, ID, or name.
 * @returns The player object that was added to the database.
 * @example
 * const db = new DatabaseQuerier(":memory:");
 * addMockPlayer(db, {
 *   currentName: "John Doe",
 *   tokens: 10,
 *   perks: ["Mine Bonus"]
 * });
 */
export const addMockPlayer = (
	db: DatabaseQuerier,
	{
		id = undefined,
		currentName = "",
		publishedName = null,
		tokens = 0,
		role: roleResolvable = null,
		perks = [],
		inventory = "",
		lastClaimedRefillTime = null,
	}:
	WithAtLeastOneProperty<PlayerDefinition>
): Player => {
	const perkRepository = new PerkRepository(db);
	const roleRepository = new RoleRepository(db, perkRepository);

	if (id === undefined) {
		id = getRandomNumericUUID();
	}

	if (inventory === "" && currentName !== "")
		inventory = currentName;

	const existingPlayer = db.getRow(
		"SELECT id FROM player WHERE id = ?",
		[id]
	);

	if (existingPlayer !== undefined) {
		throw new PlayerAlreadyExistsError(id);
	}

	let role: Role | null = null;
	if (isNumber(roleResolvable)) {
		role = roleRepository.getRoleOrThrow(roleResolvable);
	}
	else if (isString(roleResolvable)) {
		role = returnNonNullOrThrow(
			roleRepository.getRoleByName(roleResolvable)
		);

	}
	else if (roleResolvable !== null) {
		role = roleRepository.getRoleOrThrow(roleResolvable.id);
	}

	const player = { id, currentName, publishedName, tokens, role, inventory, lastClaimedRefillTime};
	const insertPlayer = db.prepare(`
		INSERT INTO player (id, currentName, publishedName, tokens, role, inventory, lastClaimedRefillTime)
		VALUES (@id, @currentName, @publishedName, @tokens, @role, @inventory, @lastClaimedRefillTime)
	`);
	insertPlayer.run({
		id: id,
		currentName: currentName,
		publishedName: publishedName,
		tokens: tokens,
		role: role?.id ?? null,
		inventory: inventory,
		lastClaimedRefillTime:
			lastClaimedRefillTime === null
				? null
				: lastClaimedRefillTime.getTime()
	});

	const givePlayerPerk = db.prepare(`
		INSERT INTO playerPerk (playerID, perkID)
		VALUES (@playerID, @perkID)
	`);

	const actualPerks: Perk[] = [];
	for (const perkResolvable of perks) {
		if (isNumber(perkResolvable)) {
			const perkID = perkResolvable;
			givePlayerPerk.run({ playerID: id, perkID });

			const dbPerk = db.getRow(
				"SELECT * FROM perk WHERE id = ?",
				[perkID]
			) as DBPerk | undefined;

			if (dbPerk === undefined) {
				throw new InvalidArgumentError(`addMockPlayer: No perk found with ID ${perkID}.`);
			}

			actualPerks.push(toPerk(dbPerk));
		}
		else {
			const perkName = perkResolvable;
			const getPerkByName = db.prepare("SELECT * FROM perk WHERE name = @name");
			const dbPerk = getPerkByName.get({ name: perkName }) as DBPerk | undefined;

			if (dbPerk === undefined) {
				throw new InvalidArgumentError(`addMockPlayer: No perk found with name ${perkName}.`);
			}

			givePlayerPerk.run({ playerID: id, perkID: dbPerk.id });

			actualPerks.push(toPerk(dbPerk));
		}
	}

	return {
		...player,
		role: role,
		perks: actualPerks,
	};
};

export const editMockPlayer = (
	db: DatabaseQuerier,
	editedPlayer: WithAtLeast<DBPlayer, "id">
): MinimalPlayer => {
	const setQueries: string[] =
		Object.entries(editedPlayer)
			.filter(([key, value]) =>
				key !== "id" &&
				value !== undefined
			)
			.map(([key]) => `${key} = @${key}`);

	if (setQueries.length === 0)
		throw new InvalidArgumentError("editMockPlayer: No properties to update.");

	const updateQuery = `
		UPDATE player
		SET ${setQueries.join(", ")}
		WHERE id = @id
	`;

	const result = db.run(updateQuery, { ...editedPlayer });

	if (result.changes === 0)
		throw new InvalidArgumentError(`editMockPlayer: No player found with ID ${editedPlayer.id}.`);

	const newMockPlayer = db.getRow(
		"SELECT * FROM player WHERE id = @id",
		{ id: editedPlayer.id }
	) as DBPlayer | undefined;

	if (newMockPlayer === undefined)
		throw new InvalidArgumentError(`editMockPlayer: No player found with ID ${editedPlayer.id}.`);

	return toMinimalPlayerObject(newMockPlayer);
}