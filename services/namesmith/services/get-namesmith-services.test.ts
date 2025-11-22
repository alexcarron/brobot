import { InitializationError } from "../../../utilities/error-utils";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { getNamesmithServices } from "./get-namesmith-services";

describe('getNamesmithServices()', () => {
	it('throws an error if Namesmith is not set up yet', () => {
		global.namesmith = {};
		makeSure(() =>
			getNamesmithServices()
		).throws(InitializationError);
	});

	it('does not throw an error if Namesmith is set up', () => {
		setupMockNamesmith();
		makeSure(() =>
			getNamesmithServices()
		).doesNotThrow();
	});

	it('returns all of the Namesmith services', () => {
		setupMockNamesmith();
		const {mysteryBoxService, characterService, playerService, gameStateService, voteService, recipeService, tradeService} = getNamesmithServices();
		expect(mysteryBoxService).not.toBeNull();
		expect(characterService).not.toBeNull();
		expect(playerService).not.toBeNull();
		expect(gameStateService).not.toBeNull();
		expect(voteService).not.toBeNull();
		expect(recipeService).not.toBeNull();
		expect(tradeService).not.toBeNull();
	});
});