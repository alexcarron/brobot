import { getRandomNameUUID } from "../../../../utilities/random-utils";
import { WithAllOptional } from "../../../../utilities/types/generic-types";
import { isString } from "../../../../utilities/types/type-guards";
import { MysteryBoxes } from "../../constants/mystery-boxes.constants";
import { DatabaseQuerier } from "../../database/database-querier";
import { MysteryBoxRepository } from "../../repositories/mystery-box.repository";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { MysteryBox, MysteryBoxDefinition, MysteryBoxResolvable } from "../../types/mystery-box.types";
import { PlayerResolvable } from "../../types/player.types";
import { returnIfNotFailure } from "../../utilities/workflow.utility";
import { buyMysteryBox } from "../../workflows/buy-mystery-box.workflow";


/**
 * Adds a mystery box to the database with the given properties.
 * @param db - The in-memory database.
 * @param mysteryBoxDefinition - The definition of the mystery box to add.
 * @returns The added mystery box with an ID.
 */
export const addMockMysteryBox = (
	db: DatabaseQuerier,
	mysteryBoxDefinition: Partial<MysteryBoxDefinition> = {}
): MysteryBox => {
	let {
    name = undefined,
	} = mysteryBoxDefinition;

	const {
		id = undefined,
		tokenCost = 0,
		characterOdds = { a: 1 },
	} = mysteryBoxDefinition;

	if (name === undefined)
		name = getRandomNameUUID();

	const mysteryBoxRepository = MysteryBoxRepository.fromDB(db);
	return mysteryBoxRepository.addMysteryBox({
		id, name, tokenCost, characterOdds
	});
};


/**
 * Forces a player to buy a new mystery box, giving them enough tokens to do so if they don't have enough.
 * @param player - The player to force to buy the mystery box.
 * @param mysteryBoxDefinition - The definition of the mystery box to buy.
 * @returns The result of buying the mystery box.
 */
export function forcePlayerToBuyNewMysteryBox(
	player: PlayerResolvable,
	mysteryBoxDefinition: WithAllOptional<MysteryBoxDefinition> = {}
) {
	const { playerService } = getNamesmithServices();
	const db = playerService.playerRepository.db;

	const newMysteryBox = addMockMysteryBox(db, mysteryBoxDefinition);
	if (playerService.getTokens(player) < newMysteryBox.tokenCost)
		playerService.giveTokens(player, newMysteryBox.tokenCost);

	return returnIfNotFailure(
		buyMysteryBox({
			player,
			mysteryBox: newMysteryBox.id,
		})
	)
}

export function forcePlayerToBuyMysteryBox(
	playerResolvable: PlayerResolvable,
	mysteryBoxResolvable?: MysteryBoxResolvable | string,
	recievedCharactersOverride?: string,
) {
	const { playerService, mysteryBoxService } = getNamesmithServices();

	if (isString(mysteryBoxResolvable)) {
		recievedCharactersOverride = mysteryBoxResolvable;
		mysteryBoxResolvable = undefined;
	}

	if (mysteryBoxResolvable === undefined) {
		mysteryBoxResolvable = MysteryBoxes.ALL_CHARACTERS.id;
	}

	const mysteryBox = mysteryBoxService.resolveMysteryBox(mysteryBoxResolvable);
	if (playerService.getTokens(playerResolvable) < mysteryBox.tokenCost)
		playerService.giveTokens(playerResolvable, mysteryBox.tokenCost);

	return returnIfNotFailure(
		buyMysteryBox({
			player: playerResolvable,
			mysteryBox: mysteryBoxResolvable,
			recievedCharactersOverride: recievedCharactersOverride,
		})
	)
}