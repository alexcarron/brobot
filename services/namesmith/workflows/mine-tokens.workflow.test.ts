jest.mock("../../../utilities/random-utils", () => ({
  ...jest.requireActual("../../../utilities/random-utils"),
  getAnticipatedRandomNum: jest.fn().mockReturnValue(10),
}));

import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { PlayerService } from "../services/player.service";
import { mineTokens } from "./mine-tokens.workflow";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { Perks } from "../constants/perks.constants";
import { returnIfNotFailure } from "./workflow-result-creator";
import { Player } from "../types/player.types";

describe('mine-tokens.workflow', () => {
	let db: DatabaseQuerier;
	let playerService: PlayerService;

	let SOME_PLAYER: Player;

	beforeEach(() => {
		({ db, playerService } = setupMockNamesmith());
		SOME_PLAYER = addMockPlayer(db, {
			tokens: 10
		});
	});

	describe('mineTokens()', () => {
		it('should increase the player\'s token count by 10 when mining', () => {
			const { newTokenCount } =  returnIfNotFailure(
				mineTokens({playerMining: SOME_PLAYER.id})
			);

			const newTokenBalance = playerService.getTokens(SOME_PLAYER.id);
			makeSure(newTokenBalance).is(newTokenCount);
		});

		it('should return the correct newTokenCount, tokensEarned, and hasMineBonusPerk', () => {
			const { newTokenCount, tokensEarned, hasMineBonusPerk } = returnIfNotFailure(
				mineTokens({playerMining: SOME_PLAYER.id})
			)

			makeSure(newTokenCount).is(SOME_PLAYER.tokens + 10);
			makeSure(tokensEarned).is(10);

			makeSure(hasMineBonusPerk).isFalse();
		});

		it('should give an extra token if the player has the mine bonus perk', () => {
			const PLAYER_WITH_PERK = addMockPlayer(db, {
				tokens: 10,
				perks: [Perks.MINE_BONUS.name]
			});

			const { newTokenCount, tokensEarned, hasMineBonusPerk } = returnIfNotFailure(
				mineTokens({playerMining: PLAYER_WITH_PERK.id})
			);

			makeSure(newTokenCount).is(PLAYER_WITH_PERK.tokens + 11);
			makeSure(tokensEarned).is(11);
			makeSure(hasMineBonusPerk).isTrue();
		})

		it('should return a nonPlayerMined failure if the provided player is not a valid player', () => {
			const result = mineTokens({playerMining: INVALID_PLAYER_ID});

			makeSure(result.isFailure()).isTrue();
			makeSure(result.isNonPlayerMined()).isTrue();
		});
	});
});