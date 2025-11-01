import { toDefinedPropertyValues } from "../../../../utilities/data-structure-utils";
import { WithOptional, WithRequired } from "../../../../utilities/types/generic-types";
import { MysteryBoxRepository } from "../../repositories/mystery-box.repository";
import { DBMysteryBox, MysteryBoxDefinition } from "../../types/mystery-box.types";
import { DatabaseQuerier, toListPlaceholder } from "../database-querier";

/**
 * Syncronizes the database to match a list of data defintions of mystery boxes without breaking existing data.
 * @param db - The database querier instance used for executing SQL statements.
 * @param mysteryBoxDefinitions - An array of mystery box objects to be inserted.
 */
export const syncMysteryBoxesToDB = (
	db: DatabaseQuerier,
	mysteryBoxDefinitions: Readonly<
		WithOptional<MysteryBoxDefinition, "id">[]
	>
) => {
	const mysteryBoxRepository = new MysteryBoxRepository(db);

	const mysertyBoxIDs = toDefinedPropertyValues([...mysteryBoxDefinitions], "id");

	db.runTransaction(() => {
		db.run(
			`DELETE FROM mysteryBox
			WHERE id NOT IN ${toListPlaceholder(mysertyBoxIDs)}`,
			...mysertyBoxIDs
		);

		const existingDBMysteryBoxes = db.getRows(
			`SELECT id FROM mysteryBox
			WHERE id IN ${toListPlaceholder(mysertyBoxIDs)}`,
			...mysertyBoxIDs
		) as DBMysteryBox[];

		const existingMysteryBoxDefinitions: WithRequired<MysteryBoxDefinition, 'id'>[] = [];
		const newMysteryBoxDefinitions: MysteryBoxDefinition[] = [];

		for (const mysteryBoxDefinition of mysteryBoxDefinitions) {
			const existingDBMysteryBox = existingDBMysteryBoxes
				.find(({id}) => id === mysteryBoxDefinition.id);

			if (existingDBMysteryBox) {
				existingMysteryBoxDefinitions.push({
					...mysteryBoxDefinition,
					id: existingDBMysteryBox.id,
				});
			}
			else {
				newMysteryBoxDefinitions.push(mysteryBoxDefinition);
			}
		}

		for (const mysteryBoxDefinition of existingMysteryBoxDefinitions) {
			mysteryBoxRepository.updateMysteryBox(mysteryBoxDefinition);
		}

		for (const mysteryBoxDefinition of newMysteryBoxDefinitions) {
			mysteryBoxRepository.addMysteryBox(mysteryBoxDefinition);
		}
	});
}
