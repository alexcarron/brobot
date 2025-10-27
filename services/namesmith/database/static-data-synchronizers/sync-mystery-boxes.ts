import { WithOptional } from "../../../../utilities/types/generic-types";
import { Character } from "../../types/character.types";
import { MysteryBox } from "../../types/mystery-box.types";
import { getIDfromCharacterValue } from "../../utilities/character.utility";
import { ForeignKeyConstraintError } from "../../utilities/error.utility";
import { DatabaseQuerier } from "../database-querier";
import { syncCharactersToDB } from "./sync-characters";

/**
 * Syncronizes the database to match a list of data defintions of mystery boxes without breaking existing data.
 * @param db - The database querier instance used for executing SQL statements.
 * @param mysteryBoxes - An array of mystery box objects to be inserted.
 */
export const syncMysteryBoxesToDB = (
	db: DatabaseQuerier,
	mysteryBoxes: Readonly<
		WithOptional<MysteryBox, "id">[]
	>
) => {
	const insertMysteryBox = db.getQuery("INSERT OR IGNORE INTO mysteryBox (name, tokenCost) VALUES (@name, @tokenCost)");
	const insertMysteryBoxCharacterOdds = db.getQuery("INSERT OR IGNORE INTO mysteryBoxCharacterOdds (mysteryBoxID, characterID, weight) VALUES (@mysteryBoxID, @characterID, @weight)");

	const insertMysteryBoxes = db.getTransaction((mysteryBoxes: MysteryBox[]) => {
		db.run("DELETE FROM mysteryBoxCharacterOdds");
		db.run("DELETE FROM mysteryBox");

		// SET AUTO INCREMENT TO 1
		db.run("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'mysteryBox'");

		for (const mysteryBox of mysteryBoxes) {
			const result = insertMysteryBox.run({
				name: mysteryBox.name,
				tokenCost: mysteryBox.tokenCost
			});
			const newId = result.lastInsertRowid;

			for (const [characterValue, weight] of Object.entries(mysteryBox.characterOdds)) {
				const characterID = getIDfromCharacterValue(characterValue);
				const insertCharacterOdds = () =>
					insertMysteryBoxCharacterOdds.run({
						mysteryBoxID: newId,
						characterID,
						weight
					});

				try {
					insertCharacterOdds();
				}
				catch (error) {
					if (!(error instanceof ForeignKeyConstraintError))
						throw error;

					const character: Character = {
						id: characterID,
						value: characterValue,
						rarity: weight,
					};

					syncCharactersToDB(db, [character]);
					insertCharacterOdds();
				}
			}
		}
	});

	insertMysteryBoxes(mysteryBoxes);
}
