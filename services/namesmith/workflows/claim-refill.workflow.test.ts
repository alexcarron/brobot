jest.mock("../../../utilities/random-utils", () => ({
  ...jest.requireActual("../../../utilities/random-utils"),
  getAnticipatedRandomNum: jest.fn(({expectedValue}) => expectedValue),
}));

import { addHours } from "../../../utilities/date-time-utils";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { AVERAGE_TOKENS_FROM_REFILLING, REFILL_COOLDOWN_HOURS } from "../constants/namesmith.constants";
import { Perks } from "../constants/perks.constants";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerService } from "../services/player.service";
import { returnIfNotFailure } from "../utilities/workflow.utility";
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
		it('should return the correct newTokenCount, tokensEarned, hasRefillBonusPerk, and nextRefillTime', () => {
			const mockPlayer = addMockPlayer(db, {
				tokens: 10
			});

			const { newTokenCount, baseTokensEarned, nextRefillTime, tokensFromRefillBonus } =
				returnIfNotFailure(claimRefill({
					...getNamesmithServices(),
					playerRefilling: mockPlayer.id
				}));

			makeSure(newTokenCount).is(mockPlayer.tokens + AVERAGE_TOKENS_FROM_REFILLING);
			makeSure(baseTokensEarned).is(AVERAGE_TOKENS_FROM_REFILLING);

			const expectedDate = addHours(new Date(), REFILL_COOLDOWN_HOURS);
			makeSure(nextRefillTime).isCloseToDate(expectedDate);
			makeSure(tokensFromRefillBonus).is(0);
		});

		it('should give the player tokens for refilling', () => {
			const mockPlayer = addMockPlayer(db, {
				tokens: 10
			});

			claimRefill({
				...getNamesmithServices(),
				playerRefilling: mockPlayer.id
			});

			const { playerService } = services;
			const player = playerService.resolvePlayer(mockPlayer.id);

			makeSure(player.tokens).is(mockPlayer.tokens + AVERAGE_TOKENS_FROM_REFILLING);
		});

		it('should give +25% tokens if the player has the refill bonus perk', () => {
			const mockPlayer = addMockPlayer(db, {
				tokens: 10,
				perks: [Perks.REFILL_BONUS.name]
			});

			const result = returnIfNotFailure(
				claimRefill({
					...getNamesmithServices(),
					playerRefilling: mockPlayer.id
				})
		);

			const { playerService } = services;
			const player = playerService.resolvePlayer(mockPlayer.id);

			makeSure(player.tokens).is(mockPlayer.tokens +
				Math.floor(AVERAGE_TOKENS_FROM_REFILLING * 1.25)
			);
			makeSure(result.baseTokensEarned).is(AVERAGE_TOKENS_FROM_REFILLING);
			makeSure(result.tokensFromRefillBonus).is(
				Math.floor(AVERAGE_TOKENS_FROM_REFILLING * 0.25)
			);
		});

		it('should reduce refill cooldown by 1 hour if the player has the faster refill perk', () => {
			const mockPlayer = addMockPlayer(db, {
				tokens: 10,
				perks: [Perks.FASTER_REFILL.name]
			});

			const result = returnIfNotFailure(
				claimRefill({
					...getNamesmithServices(),
					playerRefilling: mockPlayer.id
				})
			);

			const { playerService } = services;
			const player = playerService.resolvePlayer(mockPlayer.id);

			const oneHourBeforeNow = addHours(new Date(), -1);
			makeSure(player.lastClaimedRefillTime).isCloseToDate(oneHourBeforeNow);

			const oneHourAfterNow = addHours(new Date(), 1);
			makeSure(result.nextRefillTime).isCloseToDate(oneHourAfterNow);
		});

		it('should give player around 10% of their current token count if the player has the refill interest perk', () => {
			const mockPlayer = addMockPlayer(db, {
				tokens: 10,
				perks: [Perks.REFILL_INTEREST.name]
			});

			const result = returnIfNotFailure(
				claimRefill({
					...getNamesmithServices(),
					playerRefilling: mockPlayer.id
				})
			);

			const { playerService } = services;
			const player = playerService.resolvePlayer(mockPlayer.id);

			makeSure(player.tokens).is(mockPlayer.tokens + 1);
			makeSure(result.baseTokensEarned).is(1);
		});

		it('should give player number of tokens equal to size of inventory if the player has the refill inventory override perk', () => {
			const mockPlayer = addMockPlayer(db, {
				tokens: 10,
				perks: [Perks.REFILL_INVENTORY_OVERRIDE.name],
				inventory: "abcdefghij",
			});

			const result = returnIfNotFailure(
				claimRefill({
					...getNamesmithServices(),
					playerRefilling: mockPlayer.id
				})
			);

			const { playerService } = services;
			const player = playerService.resolvePlayer(mockPlayer.id);

			makeSure(player.tokens).is(20);
			makeSure(result.baseTokensEarned).is(10);
		});

		it('should throw RefillAlreadyClaimedError if the player has already claimed a refill', () => {
			const mockPlayer = addMockPlayer(db, {
				lastClaimedRefillTime: new Date()
			});

			const result = claimRefill({
				...getNamesmithServices(),
				playerRefilling: mockPlayer.id
			})

			makeSure(result.isRefillAlreadyClaimed()).isTrue();
		})

		it('override the number of tokens given based on the given tokenOverride value', () => {
			const mockPlayer = addMockPlayer(db, {
				tokens: 10
			});

			const result = returnIfNotFailure(
				claimRefill({
					...getNamesmithServices(),
					playerRefilling: mockPlayer.id,
					tokenOverride: 200
				})
			);

			makeSure(result.baseTokensEarned).is(200);
			makeSure(result.tokensFromRefillBonus).is(0);
			makeSure(result.newTokenCount).is(mockPlayer.tokens + 200);
		});

		it('should throw NonPlayerRefilledError if the provided player is not a valid player', () => {
			const result = claimRefill({
				...getNamesmithServices(),
				playerRefilling: INVALID_PLAYER_ID
			});

			makeSure(result.isNotAPlayer()).isTrue();
		});
	});
});