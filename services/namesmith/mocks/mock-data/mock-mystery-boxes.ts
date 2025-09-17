import { createRandomName } from "../../../../utilities/random-utils";
import { WithAtLeastOneProperty } from "../../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../../database/database-querier";
import { MysteryBox } from "../../types/mystery-box.types";


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
	}: WithAtLeastOneProperty<MysteryBox>
): MysteryBox => {
	if (name === undefined)
		name = createRandomName();

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
	return { id, name, tokenCost };
};