import { DBQuest, Quest } from "../types/quest.types";

/**
 * Converts a DBQuest object to a Quest object.
 * @param dbQuest The DBQuest object to convert.
 * @returns The converted Quest object.
 */
export function toQuest(dbQuest: DBQuest): Quest {
	return {
		...dbQuest,
		wasShown: dbQuest.wasShown === 1,
		isShown: dbQuest.isShown === 1
	};
}