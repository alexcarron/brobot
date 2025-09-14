jest.mock("../../../utilities/random-utils", () => ({
  ...jest.requireActual("../../../utilities/random-utils"),
  getAnticipatedRandomNum: jest.fn().mockReturnValue(50),
}));

import { returnIfNotError } from "../../../utilities/error-utils";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { REFILL_COOLDOWN_HOURS } from "../constants/namesmith.constants";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-database";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerService } from "../services/player.service";
import { NonPlayerRefilledError, RefillAlreadyClaimedError } from "../utilities/error.utility";
import { claimRefill } from "./claim-refill.workflow";

describe('claim-tokens.workflow', () => {
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
		it('should return the correct newTokenCount, tokensEarned, and nextRefillTime', () => {
			const mockPlayer = addMockPlayer(db, {
				tokens: 10
			});

			const { newTokenCount, tokensEarned, nextRefillTime } =
				returnIfNotError(claimRefill({
					...services,
					playerRefilling: mockPlayer.id
				}));

			makeSure(newTokenCount).is(mockPlayer.tokens + 50);
			makeSure(tokensEarned).is(50);

			const expectedDate = new Date(new Date().getTime() + REFILL_COOLDOWN_HOURS * 60 * 60 * 1000);
			makeSure(nextRefillTime).isCloseToDate(expectedDate);
		});

		it('should give the player tokens for refilling', () => {
			const mockPlayer = addMockPlayer(db, {
				tokens: 10
			});

			claimRefill({
				...services,
				playerRefilling: mockPlayer.id
			});

			const { playerService } = services;
			const player = playerService.resolvePlayer(mockPlayer.id);

			makeSure(player.tokens).is(mockPlayer.tokens + 50);
		});

		it('should throw RefillAlreadyClaimedError if the player has already claimed a refill', () => {
			const mockPlayer = addMockPlayer(db, {
				lastClaimedRefillTime: new Date()
			});

			makeSure(claimRefill({
				...services,
				playerRefilling: mockPlayer.id
			})).isAnInstanceOf(RefillAlreadyClaimedError);
		})

		it('should throw NonPlayerRefilledError if the provided player is not a valid player', () => {
			makeSure(claimRefill({
				...services,
				playerRefilling: INVALID_PLAYER_ID
			})).isAnInstanceOf(NonPlayerRefilledError);
		});
	});
});