jest.mock("../utilities/mine-tokens.utility", () => ({
	...jest.requireActual("../utilities/mine-tokens.utility"),
	getRandomTokensGivenForMine: jest.fn().mockReturnValue(10),
	doesMineCollapseAtLayer: jest.fn().mockReturnValue(false),
	isCharacterDiscoveredAtLayer: jest.fn().mockReturnValue(false),
}));

import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID } from "../constants/testing.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { PlayerService } from "../services/player.service";
import { mineOneLayer } from "./mine-tokens.workflow";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { Perks } from "../constants/perk.constants";
import { Player } from "../types/player.types";
import { returnIfNotFailure } from "../utilities/workflow.utility";
import {
	doesMineCollapseAtLayer,
	getRandomTokensGivenForMine,
	isCharacterDiscoveredAtLayer,
} from "../utilities/mine-tokens.utility";

const mockedDoesMineCollapseAtLayer = doesMineCollapseAtLayer as jest.Mock;
const mockedGetRandomTokensGivenForMine = getRandomTokensGivenForMine as jest.Mock;
const mockedIsCharacterDiscoveredAtLayer = isCharacterDiscoveredAtLayer as jest.Mock;

describe('mine-tokens.workflow', () => {
	let db: DatabaseQuerier;
	let playerService: PlayerService;

	let SOME_PLAYER: Player;

	beforeEach(() => {
		({ db, playerService } = setupMockNamesmith());
		SOME_PLAYER = addMockPlayer(db, {
			tokens: 10
		});

		mockedDoesMineCollapseAtLayer.mockReturnValue(false);
		mockedGetRandomTokensGivenForMine.mockReturnValue(10);
		mockedIsCharacterDiscoveredAtLayer.mockReturnValue(false);
	});

	describe('mineOneLayer()', () => {
		it('should increase the player\'s token count by the tokens gained', () => {
			const { newTokenCount, tokensGained } = returnIfNotFailure(
				mineOneLayer({ player: SOME_PLAYER.id, currentLayerNumber: 1, tokensMinedThisSession: 0 })
			);

			makeSure(tokensGained).is(10);
			makeSure(playerService.getTokens(SOME_PLAYER.id)).is(newTokenCount);
			makeSure(newTokenCount).is(SOME_PLAYER.tokens + 10);
		});

		it('should give an extra token if the player has the mine bonus perk', () => {
			const PLAYER_WITH_PERK = addMockPlayer(db, {
				tokens: 10,
				perks: [Perks.MINE_BONUS.name]
			});

			const { newTokenCount, tokensGained, hasMineBonusPerk } = returnIfNotFailure(
				mineOneLayer({ player: PLAYER_WITH_PERK.id, currentLayerNumber: 1, tokensMinedThisSession: 0 })
			);

			makeSure(tokensGained).is(11);
			makeSure(newTokenCount).is(PLAYER_WITH_PERK.tokens + 11);
			makeSure(hasMineBonusPerk).isTrue();
		});

		it('should not have the mine bonus perk by default', () => {
			const { hasMineBonusPerk } = returnIfNotFailure(
				mineOneLayer({ player: SOME_PLAYER.id, currentLayerNumber: 1, tokensMinedThisSession: 0 })
			);

			makeSure(hasMineBonusPerk).isFalse();
		});

		it('should give the given tokenGainedOverride if it is passed', () => {
			const { newTokenCount, tokensGained } = returnIfNotFailure(
				mineOneLayer({
					player: SOME_PLAYER.id,
					currentLayerNumber: 1,
					tokensMinedThisSession: 0,
					tokenGainedOverride: 20
				})
			);

			makeSure(newTokenCount).is(SOME_PLAYER.tokens + 20);
			makeSure(tokensGained).is(20);
		});

		it('should return a notAPlayer failure if the provided player is not a valid player', () => {
			const result = mineOneLayer({
				player: INVALID_PLAYER_ID,
				currentLayerNumber: 1,
				tokensMinedThisSession: 0
			});

			makeSure(result.isFailure()).isTrue();
			makeSure(result.isNotAPlayer()).isTrue();
		});

		it('should never collapse on the first layer, even if a collapse would otherwise be rolled', () => {
			mockedDoesMineCollapseAtLayer.mockReturnValue(true);

			const { didCollapse } = returnIfNotFailure(
				mineOneLayer({ player: SOME_PLAYER.id, currentLayerNumber: 1, tokensMinedThisSession: 0 })
			);

			makeSure(didCollapse).isFalse();
		});

		it('should collapse on a deeper layer when a collapse is rolled, keeping exactly floor(25%) of the tokens mined this session', () => {
			mockedDoesMineCollapseAtLayer.mockReturnValue(true);

			const { didCollapse, tokensGained, tokensKeptAfterCollapse, newTokenCount } = returnIfNotFailure(
				mineOneLayer({ player: SOME_PLAYER.id, currentLayerNumber: 3, tokensMinedThisSession: 11 })
			);

			makeSure(didCollapse).isTrue();
			makeSure(tokensGained).is(0);
			makeSure(tokensKeptAfterCollapse).is(2);
			makeSure(newTokenCount).is(SOME_PLAYER.tokens - (11 - 2));
		});

		it('should not discover a character on a collapse', () => {
			mockedDoesMineCollapseAtLayer.mockReturnValue(true);
			mockedIsCharacterDiscoveredAtLayer.mockReturnValue(true);

			const { characterDiscovered } = returnIfNotFailure(
				mineOneLayer({ player: SOME_PLAYER.id, currentLayerNumber: 3, tokensMinedThisSession: 11 })
			);

			makeSure(characterDiscovered).is(null);
		});

		it('should discover and give a character when the discovery roll succeeds', () => {
			mockedIsCharacterDiscoveredAtLayer.mockReturnValue(true);

			const { characterDiscovered } = returnIfNotFailure(
				mineOneLayer({ player: SOME_PLAYER.id, currentLayerNumber: 2, tokensMinedThisSession: 0 })
			);

			makeSure(characterDiscovered).isNotNull();
			makeSure(playerService.getInventory(SOME_PLAYER.id).includes(characterDiscovered as string)).isTrue();
		});

		it('should apply the mining for refills perk by moving the last claimed refill time earlier', () => {
			const PLAYER_WITH_PERK = addMockPlayer(db, {
				tokens: 10,
				perks: [Perks.MINING_FOR_REFILLS.name]
			});
			const someRefillTime = new Date();
			playerService.setLastClaimedRefillTime(PLAYER_WITH_PERK.id, someRefillTime);

			returnIfNotFailure(
				mineOneLayer({ player: PLAYER_WITH_PERK.id, currentLayerNumber: 1, tokensMinedThisSession: 0 })
			);

			const newRefillTime = playerService.getLastClaimedRefillTime(PLAYER_WITH_PERK.id);
			makeSure(newRefillTime!.getTime()).isLessThan(someRefillTime.getTime());
		});
	});
});
