import { makeSure } from "../../../utilities/jest/jest-utils";
import { DBQuest, Quest } from "../types/quest.types";
import { toQuest } from "./quest.utility";

describe('quest.utility.ts', () => {
	describe('toQuest()', () => {
		it('converts a DBQuest into a Quest', () => {
			const dbQuest: DBQuest = {
				id: 1,
				name: 'Test Quest',
				description: 'Test Description',
				tokensReward: 10,
				charactersReward: 'ABC',
				wasShown: 1,
				isShown: 1
			};

			const quest: Quest = toQuest(dbQuest);

			makeSure(quest).is({
				id: 1,
				name: 'Test Quest',
				description: 'Test Description',
				tokensReward: 10,
				charactersReward: 'ABC',
				wasShown: true,
				isShown: true
			});
		});
	});
});