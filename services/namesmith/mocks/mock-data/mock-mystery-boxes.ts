import { getRandomNameUUID } from "../../../../utilities/random-utils";
import { WithAllOptional } from "../../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../../database/database-querier";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { MinimalMysteryBox, MysteryBoxDefinition } from "../../types/mystery-box.types";
import { PlayerResolvable } from "../../types/player.types";
import { getIDfromCharacterValue } from "../../utilities/character.utility";
import { returnIfNotFailure } from "../../utilities/workflow.utility";
import { buyMysteryBox } from "../../workflows/buy-mystery-box.workflow";


/**
 * Adds a mystery box to the database with the given properties.
 * @param db - The in-memory database.
 * @param mysteryBoxData - The mystery box data to add.
 * @param mysteryBoxData.id - The ID of the mystery box.
 * @param mysteryBoxData.name - The name of the mystery box.
 * @param mysteryBoxData.tokenCost - The number of tokens to purchase the mystery box.
 * @returns The added mystery box with an ID.
 */
export const addMockMysteryBox = (
	db: DatabaseQuerier,
	{
		id = undefined,
    name = undefined,
    tokenCost = 0,
	}: WithAllOptional<MinimalMysteryBox> = {}
): MinimalMysteryBox => {
	if (name === undefined)
		name = getRandomNameUUID();

	if (id === undefined) {
		const runResult = db.run(
			"INSERT INTO mysteryBox (name, tokenCost) VALUES (@name, @tokenCost)",
			{ name, tokenCost }
		);

		if (typeof runResult.lastInsertRowid !== "number")
			id = Number(runResult.lastInsertRowid);
		else
			id = runResult.lastInsertRowid;
	}
	else {
		db.run(
			"INSERT INTO mysteryBox (id, name, tokenCost) VALUES (@id, @name, @tokenCost)",
			{ id, name, tokenCost }
		);
	}

	db.run(
		`INSERT INTO mysteryBoxCharacterOdds (mysteryBoxID, characterID, weight)
		VALUES (@mysteryBoxID, @characterID, @weight);`,
		{
			mysteryBoxID: id,
			characterID: getIDfromCharacterValue("a"),
			weight: 1
		}
	)
	return { id, name, tokenCost };
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