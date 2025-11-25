import { InvalidArgumentError, returnNonNullOrThrow } from "../../../../utilities/error-utils";
import { getRandomNumericUUID } from "../../../../utilities/random-utils";
import { WithAllOptional, WithAtLeast } from "../../../../utilities/types/generic-types";
import { isNumber, isString } from "../../../../utilities/types/type-guards";
import { DatabaseQuerier } from "../../database/database-querier";
import { RoleRepository } from "../../repositories/role.repository";
import { asDBPerk, Perk, toPerk } from "../../types/perk.types";
import { asMinimalPlayer, MinimalPlayer, Player, PlayerDefinition, PlayerResolvable } from "../../types/player.types";
import { PlayerAlreadyExistsError } from "../../utilities/error.utility";
import { Role } from "../../types/role.types";
import { PerkRepository } from "../../repositories/perk.repository";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { returnIfNotFailure } from "../../utilities/workflow.utility";
import { mineTokens } from "../../workflows/mine-tokens.workflow";
import { claimRefill } from "../../workflows/claim-refill.workflow";
import { addDays } from "../../../../utilities/date-time-utils";

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
	}: WithAllOptional<PlayerDefinition> = {},
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


			const row = db.getRow(
				"SELECT * FROM perk WHERE id = ?",
				[perkID]
			);

			if (row === undefined) {
				throw new InvalidArgumentError(`addMockPlayer: No perk found with ID ${perkID}.`);
			}

			actualPerks.push(toPerk(row));
		}
		else {
			const perkName = perkResolvable;
			const getPerkByName = db.prepare("SELECT * FROM perk WHERE name = @name");
			const row = getPerkByName.get({ name: perkName });

			if (row === undefined) {
				throw new InvalidArgumentError(`addMockPlayer: No perk found with name ${perkName}.`);
			}

			const dbPerk = asDBPerk(row);
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
	editedPlayer: WithAtLeast<MinimalPlayer, "id">
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

	const row = db.getRow(
		"SELECT * FROM player WHERE id = @id",
		{ id: editedPlayer.id }
	);

	if (row === undefined)
		throw new InvalidArgumentError(`editMockPlayer: No player found with ID ${editedPlayer.id}.`);

	return asMinimalPlayer(row);
}

/**
 * Forces a player to publish a name by giving them the input characters, changing their current name to the published name, and publishing the name.
 * @param playerResolvable - The player resolvable to force to publish the name.
 * @param publishedName - The name to force the player to publish.
 * @returns The resolved player after the name has been published.
 */
export function forcePlayerToPublishName(
	playerResolvable: PlayerResolvable,
	publishedName: string
) {
	const { playerService } = getNamesmithServices();
	playerService.giveCharacters(playerResolvable, publishedName);
	playerService.changeCurrentName(playerResolvable, publishedName);
	playerService.publishName(playerResolvable);
	return playerService.resolvePlayer(playerResolvable);
}

/**
 * Forces a player to mine tokens by giving them the input characters and overriding the amount of tokens earned by mining.
 * @param playerResolvable - The player resolvable to force to mine tokens.
 * @param tokens - The number of tokens to give the player by overriding the amount of tokens earned by mining.
 * @returns The result of the mineTokens workflow.
 */
export function forcePlayerToMineTokens(
	playerResolvable: PlayerResolvable,
	tokens: number
) {
	return returnIfNotFailure(
		mineTokens({
			playerMining: playerResolvable,
			tokenOverride: tokens
		})
	);
}

/**
 * Forces a player to claim a token refill by overriding the number of tokens earned from the claim and reseting their cooldown before and after
 * @param playerResolvable - The player resolvable to force to claim a token refill.
 * @param tokens - The number of tokens to give the player by overriding the amount of tokens earned from the claim.
 * @returns The result of the claimRefill workflow.
 */
export function forcePlayerToClaimRefill(
	playerResolvable: PlayerResolvable,
	tokens: number
) {
	const { playerService } = getNamesmithServices();
	const manyDaysAgo = addDays(new Date(), -1000);
	playerService.setLastRefillTime(playerResolvable, manyDaysAgo);

	const result = returnIfNotFailure(
		claimRefill({
			playerRefilling: playerResolvable,
			tokenOverride: tokens
		})
	);

	playerService.setLastRefillTime(playerResolvable, manyDaysAgo);

	return result;
}