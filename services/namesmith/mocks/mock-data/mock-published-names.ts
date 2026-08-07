import { DatabaseQuerier } from "../../database/database-querier";
import { PlayerResolvable } from "../../types/player.types";
import { PublishedName } from "../../types/published-name.types";
import { PlayerService } from "../../services/player.service";
import { PublishedNameService } from "../../services/published-name.service";
import { PublishedNameRepository } from "../../repositories/published-name.repository";
import { addMockPlayer } from "./mock-players";

/**
 * Adds a published name to the database, creating the owning player if needed.
 * @param db - The in-memory database.
 * @param options - The published name data.
 * @param options.player - The player who owns the published name. A new player is created if omitted or missing.
 * @param options.name - The published name text.
 * @param options.slotNumber - The published name slot the published name occupies. Defaults to the player's lowest available published name slot.
 * @returns The created published name.
 */
export const addMockPublishedName = (
	db: DatabaseQuerier,
	{ player, name = "MockName", slotNumber }: {
		player?: PlayerResolvable;
		name?: string;
		slotNumber?: number;
	} = {}
): PublishedName => {
	const playerService = PlayerService.fromDB(db);
	const publishedNameService = PublishedNameService.fromDB(db);
	const publishedNameRepository = PublishedNameRepository.fromDB(db);

	let playerID: string;
	if (player === undefined) {
		playerID = addMockPlayer(db).id;
	}
	else {
		playerID = playerService.resolveID(player);
		if (!playerService.isPlayer(playerID))
			playerID = addMockPlayer(db, { id: playerID }).id;
	}

	const resolvedSlotNumber =
		slotNumber ?? publishedNameService.getLowestAvailableSlotNumberOfPlayer(playerID) ?? 1;

	return publishedNameRepository.addPublishedName({
		playerID,
		name,
		slotNumber: resolvedSlotNumber,
	});
};
