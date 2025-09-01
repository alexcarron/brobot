jest.mock("../../../utilities/random-utils", () => ({
  ...jest.requireActual("../../../utilities/random-utils"),
  getAnticipatedRandomNum: jest.fn().mockReturnValue(10),
}));

import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../database/mock-database";
import { setupMockNamesmith } from "../event-listeners/mock-setup";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerService } from "../services/player.service";
import { NonPlayerMinedError } from "../utilities/error.utility";
import { mineTokens } from "./mine-tokens.workflow";

describe('mine-tokens.workflow', () => {
	let services: {
		playerService: PlayerService
	};

	let db: DatabaseQuerier;

	beforeEach(() => {
		setupMockNamesmith();
		const { playerService } = getNamesmithServices();
		services = {
			playerService
		};
		db = playerService.playerRepository.db;
	});

	describe('mineTokens()', () => {
		it('should give the player tokens for mining', () => {
			const mockPlayer = addMockPlayer(db, {
				tokens: 10
			});

			const { newTokenCount, tokensEarned } = mineTokens({
				...services,
				playerMining: mockPlayer.id
			});

			makeSure(newTokenCount).is(mockPlayer.tokens + 10);
			makeSure(tokensEarned).is(10);

			const newTokenBalance = services.playerService.getTokens(mockPlayer.id);
			makeSure(newTokenBalance).is(newTokenCount);
		});

		it('should throw NonPlayerMinedError if the provided player is not a valid player', () => {
			makeSure(() => mineTokens({
				...services,
				playerMining: INVALID_PLAYER_ID
			})).throws(NonPlayerMinedError);
		});
	});
});