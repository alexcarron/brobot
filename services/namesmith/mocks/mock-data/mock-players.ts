import { InvalidArgumentError } from "../../../../utilities/error-utils";
import { getRandomNumericUUID } from "../../../../utilities/random-utils";
import { WithAllOptional, WithAtLeast } from "../../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../../database/database-querier";
import { asMinimalPlayer, MinimalPlayer, Player, PlayerDefinition, PlayerResolvable } from "../../types/player.types";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { returnIfNotFailure } from "../../utilities/workflow.utility";
import { mineOneLayer } from "../../workflows/mine-tokens.workflow";
import { claimRefill } from "../../workflows/claim-refill.workflow";
import { addDays } from "../../../../utilities/date-time-utils";
import { PlayerRepository } from "../../repositories/player.repository";
import { getCharacters } from "../../../../utilities/string-checks-utils";

/**
 * Creates a mock player object with default values for optional properties.
 * @param options - An object with the following properties:
 * @param options.id - The ID of the player.
 * @param options.currentName - The current name of the player.
 * @param options.tokens - The number of tokens the player has.
 * @param options.role - The role of the player.
 * @param options.perks - The perks the player has.
 * @param options.publishedNames - The player's published names.
 * @param options.inventory - The player's inventory.
 * @param options.lastClaimedRefillTime - The last time the player claimed a refill.
 * @param options.hasPickedPerk - Whether the player has picked a perk.
 * @returns A mock player object with the given properties and default values for optional properties.
 */
export const createMockPlayerObject = ({
	id,
	currentName = "",
	tokens = 0,
	role = null,
	perks = [],
	publishedNames = [],
	inventory = "",
	lastClaimedRefillTime = null,
	hasPickedPerk = false,
}: WithAtLeast<Player, "id">): Player => {
	if (id === undefined || typeof id !== "string")
		throw new InvalidArgumentError(`createMockPlayerObject: player id must be a string, but got ${id}.`);

	return {id, currentName, tokens, role, perks, publishedNames, inventory, lastClaimedRefillTime, hasPickedPerk};
}

/**
 * Adds a player to the database with the given properties.
 * @param db - The in-memory database.
 * @param playerData - The player data to add.
 * @param playerData.id - The ID of the player.
 * @param playerData.currentName - The current name of the player.
 * @param playerData.tokens - The number of tokens the player has.
 * @param playerData.role - The role of the player.
 * @param playerData.inventory - The player's inventory.
 * @param playerData.lastClaimedRefillTime - The last time the player claimed a refill.
 * @param playerData.perks - An array of perks to give the player. Each perk can be a Perk object, ID, or name.
 * @param playerData.hasPickedPerk - Whether the player has picked a perk.
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
		tokens = 0,
		role = null,
		perks = [],
		inventory = "",
		lastClaimedRefillTime = null,
		hasPickedPerk = false,
	}: WithAllOptional<PlayerDefinition> = {},
): Player => {
	if (id === undefined) {
		id = getRandomNumericUUID();
	}

	if (inventory === "" && currentName !== "")
		inventory = currentName;

	const playerRepository = PlayerRepository.fromDB(db);
	return playerRepository.addPlayer({
		id, currentName, tokens, role, perks, inventory, lastClaimedRefillTime, hasPickedPerk
	})
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
 * Forces a player to have a certain inventory by giving them the characters in the inventory that they don't already have.
 * @param playerResolvable - The player resolvable to force to have the inventory.
 * @param inventory - The inventory to force the player to have.
 */
export function forcePlayerToHaveInventory(playerResolvable: PlayerResolvable, inventory: string) {
	const characters = getCharacters(inventory);

	const { playerService } = getNamesmithServices();
	const currentInvetory = playerService.getInventory(playerResolvable);
	
	const missingCharacters = characters.filter(character => !currentInvetory.includes(character));
	playerService.giveCharacters(playerResolvable, missingCharacters.join(""));
}

/**
 * Forces a player to change their name by giving them the characters in the new name, changing their current name to the new name, and logging the change in the activity log.
 * @param playerResolvable - The player resolvable to force to change their name.
 * @param newName - The new name to force the player to change to.
 * @returns The resolved player after the name has been changed.
 */
export function forcePlayerToChangeName(
	playerResolvable: PlayerResolvable,
	newName: string
): Player {
	const { playerService, activityLogService } = getNamesmithServices();
	const nameBefore = playerService.getCurrentName(playerResolvable);
	const currentInventory = playerService.getInventory(playerResolvable);

	playerService.setInventory(playerResolvable, currentInventory + newName);
	playerService.changeCurrentName(playerResolvable, newName);

	activityLogService.logChangeName({
		playerChangingName: playerResolvable,
		nameBefore,
	});
	return playerService.resolvePlayer(playerResolvable);
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
): Player {
	const { playerService, publishedNameService, activityLogService } = getNamesmithServices();
	playerService.giveCharacters(playerResolvable, publishedName);
	playerService.changeCurrentName(playerResolvable, publishedName);
	publishedNameService.forceSetPublishedNameInSlot(playerResolvable, publishedName, 1);
	activityLogService.logPublishName({
		playerPublishingName: playerResolvable,
	});
	return playerService.resolvePlayer(playerResolvable);
}

/**
 * Forces a player to publish a name into a specific published name slot, overwriting whatever currently occupies that slot, by giving them the input characters, changing their current name to the published name, and force-setting the published name slot.
 * @param playerResolvable - The player resolvable to force to publish the name.
 * @param publishedName - The name to force the player to publish.
 * @param slotNumber - The published name slot to overwrite.
 * @returns The resolved player after the name has been published.
 */
export function forcePlayerToPublishNameInSlot(
	playerResolvable: PlayerResolvable,
	publishedName: string,
	slotNumber: number
): Player {
	const { playerService, publishedNameService, activityLogService } = getNamesmithServices();
	playerService.giveCharacters(playerResolvable, publishedName);
	playerService.changeCurrentName(playerResolvable, publishedName);
	publishedNameService.forceSetPublishedNameInSlot(playerResolvable, publishedName, slotNumber);
	activityLogService.logPublishName({
		playerPublishingName: playerResolvable,
	});
	return playerService.resolvePlayer(playerResolvable);
}

/**
 * Forces a player to mine tokens by overriding the amount of tokens gained on a single, safe first-layer mine.
 * @param playerResolvable - The player resolvable to force to mine tokens.
 * @param tokens - The number of tokens to give the player by overriding the amount of tokens gained by mining.
 * @returns The result of the mineOneLayer workflow.
 */
export function forcePlayerToMineTokens(
	playerResolvable: PlayerResolvable,
	tokens: number
) {
	return returnIfNotFailure(
		mineOneLayer({
			player: playerResolvable,
			currentLayerNumber: 1,
			tokensMinedThisSession: 0,
			tokenGainedOverride: tokens
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
	tokens?: number
) {
	const { playerService } = getNamesmithServices();
	const manyDaysAgo = addDays(new Date(), -1000);
	const cooldownExpiresAt = playerService.getNextAvailableRefillTime(playerResolvable);
	const now = new Date();

	if (now.getTime() < cooldownExpiresAt.getTime()) {
		playerService.setLastRefillTime(playerResolvable, manyDaysAgo);
	}

	const result = returnIfNotFailure(
		claimRefill({
			playerRefilling: playerResolvable,
			tokenOverride: tokens
		})
	);

	return result;
}