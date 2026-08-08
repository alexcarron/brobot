import { DatabaseQuerier } from "../../database/database-querier";
import { TipRepository } from "../../repositories/tip.repository";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { PlayerResolvable } from "../../types/player.types";
import { Tip, TipDefinition, TipResolvable } from "../../types/tip.types";
import { TipAlreadyExistsError } from "../../utilities/error.utility";
import { getRandomNameUUID } from "../../../../utilities/random-utils";

/**
 * Adds a mock tip to the database.
 * @param db - The database to which the mock tip will be added.
 * @param tipDefinition - The definition of the tip to be added.
 * @returns The added tip object.
 * @throws {TipAlreadyExistsError} If a tip with the given key already exists.
 */
export function addMockTip(
	db: DatabaseQuerier,
	tipDefinition: Partial<TipDefinition> = {}
): Tip {
	const tipRepository = TipRepository.fromDB(db);
	const {
		key = getRandomNameUUID(),
		message = "",
	} = tipDefinition;

	if (tipRepository.doesTipExist(key))
		throw new TipAlreadyExistsError(key);

	return tipRepository.addTip({ key, message });
}

/**
 * Forces a given player to have been shown a given tip a number of times.
 * @param playerResolvable - The player who saw the tip.
 * @param tipResolvable - The tip that was seen.
 * @param timesSeen - How many times to record the tip as seen. Defaults to 1.
 * @returns The player's resulting view count for the tip.
 */
export function forcePlayerToSeeTip(
	playerResolvable: PlayerResolvable,
	tipResolvable: TipResolvable,
	timesSeen: number = 1
): number {
	const { tipService, playerService } = getNamesmithServices();
	const playerID = playerService.resolvePlayer(playerResolvable).id;
	const tipKey = tipService.tipRepository.resolveKey(tipResolvable);

	for (let timeSeen = 0; timeSeen < timesSeen; timeSeen++) {
		tipService.incrementTipViewCountForPlayer(playerID, tipKey);
	}

	return tipService.tipRepository.getViewCount(playerID, tipKey);
}
