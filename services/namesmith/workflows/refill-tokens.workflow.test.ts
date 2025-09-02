jest.mock("../../../utilities/random-utils", () => ({
  ...jest.requireActual("../../../utilities/random-utils"),
  getAnticipatedRandomNum: jest.fn().mockReturnValue(50),
}));

import { makeSure } from "../../../utilities/jest/jest-utils";
import { REFILL_COOLDOWN_HOURS } from "../constants/namesmith.constants";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../database/mock-database";
import { setupMockNamesmith } from "../event-listeners/mock-setup";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerService } from "../services/player.service";
import { NonPlayerRefilledError, RefillAlreadyClaimedError } from "../utilities/error.utility";
import { refillTokens } from "./refill-tokens.workflow";

describe('refill-tokens.workflow', () => {
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

	describe('refillTokens()', () => {
		it('should give the player tokens for refilling', () => {
			const mockPlayer = addMockPlayer(db, {
				tokens: 10
			});

			const { newTokenCount, tokensEarned, nextRefillTime } = refillTokens({
				...services,
				playerRefilling: mockPlayer.id
			});

			makeSure(newTokenCount).is(mockPlayer.tokens + 50);
			makeSure(tokensEarned).is(50);

			const expectedDate = new Date(new Date().getTime() + REFILL_COOLDOWN_HOURS * 60 * 60 * 1000);
			makeSure(nextRefillTime).isCloseToDate(expectedDate);
		});

		it('should throw RefillAlreadyClaimedError if the player has already claimed a refill', () => {
			const mockPlayer = addMockPlayer(db, {
				lastClaimedRefillTime: new Date()
			});

			makeSure(() => refillTokens({
				...services,
				playerRefilling: mockPlayer.id
			})).throws(RefillAlreadyClaimedError);
		})

		it('should throw NonPlayerRefilledError if the provided player is not a valid player', () => {
			makeSure(() => refillTokens({
				...services,
				playerRefilling: INVALID_PLAYER_ID
			})).throws(NonPlayerRefilledError);
		});
	});
});