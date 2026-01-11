import { toDefinedPropertyValues } from "../../../../utilities/data-structure-utils";
import { DeepReadonly, WithID } from "../../../../utilities/types/generic-types";
import { QuestRepository } from "../../repositories/quest.repository";
import { asDBQuests, QuestDefinition } from "../../types/quest.types";
import { DatabaseQuerier, toPlaceholdersList } from "../database-querier";

/**
 * Synchronizes the database to match a list of data definitions of quests without breaking existing data.
 * @param db - The database querier used to execute queries.
 * @param questDefinitions - An array of quest definition objects to be inserted.
 */
export function syncQuestsToDB(
	db: DatabaseQuerier,
	questDefinitions: DeepReadonly<QuestDefinition[]>
) {
	const questRepository = QuestRepository.fromDB(db);
	const questIDs = toDefinedPropertyValues(
		[...questDefinitions], 'id'
	);
	const questNames = toDefinedPropertyValues(
		[...questDefinitions], 'name'
	);

	db.runTransaction(() => {
		db.run(
			`DELETE FROM quest
			WHERE
				id NOT IN ${toPlaceholdersList(questIDs)}
				AND name NOT IN ${toPlaceholdersList(questNames)}`,
			...questIDs,
			...questNames
		);

		const existingDBQuests = asDBQuests(
			db.getRows(
				`SELECT * FROM quest
				WHERE
					id IN ${toPlaceholdersList(questIDs)}
					OR name IN ${toPlaceholdersList(questNames)}`,
				...questIDs,
				...questNames
			)
		);

		const existingQuestDefinitions: WithID<QuestDefinition>[] = [];
		const newQuestDefinitions: QuestDefinition[] = [];

		for (const questDefinition of questDefinitions) {
			const existingDBQuest = existingDBQuests.find((dbQuest) =>
				dbQuest.name === questDefinition.name ||
				dbQuest.id === questDefinition.id
			);

			if (existingDBQuest !== undefined) {
				existingQuestDefinitions.push({
					...questDefinition,
					id: existingDBQuest.id
				});
			}
			else {
				newQuestDefinitions.push(questDefinition);
			}
		}

		for (const newQuestDefinition of newQuestDefinitions) {
			questRepository.addQuest(newQuestDefinition);
		}

		for (const existingQuestDefinition of existingQuestDefinitions) {
			questRepository.updateQuest(existingQuestDefinition);
		}
	});
}
