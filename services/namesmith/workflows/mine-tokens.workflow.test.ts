jest.mock("../../../utilities/random-utils", () => ({
  ...jest.requireActual("../../../utilities/random-utils"),
  getAnticipatedRandomNum: jest.fn().mockReturnValue(10),
}));

import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerService } from "../services/player.service";
import { mineTokens } from "./mine-tokens.workflow";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { PerkService } from "../services/perk.service";
import { Perks } from "../constants/perks.constants";

describe('mine-tokens.workflow', () => {
	let services: {
		playerService: PlayerService,
		perkService: PerkService,
	};

	let db: DatabaseQuerier;

	beforeEach(() => {
		setupMockNamesmith();
		const { playerService, perkService } = getNamesmithServices();
		services = {
			playerService,
			perkService
		};
		db = playerService.playerRepository.db;
	});

	describe('mineTokens()', () => {
		it('should return the correct newTokenCount and tokensEarned', () => {
			const mockPlayer = addMockPlayer(db, {
				tokens: 10
			});

			const { newTokenCount, tokensEarned, hasMineBonusPerk } = mineTokens({
				...services,
				playerMining: mockPlayer.id
			}) as any;

			makeSure(newTokenCount).is(mockPlayer.tokens + 10);
			makeSure(tokensEarned).is(10);

			const newTokenBalance = services.playerService.getTokens(mockPlayer.id);
			makeSure(newTokenBalance).is(newTokenCount);
			makeSure(hasMineBonusPerk).isFalse();
		});

		it('should give an extra token if the player has the mine bonus perk', () => {
			const mockPlayer = addMockPlayer(db, {
				tokens: 10,
				perks: [Perks.MINE_BONUS.name]
			});

			const { newTokenCount, tokensEarned, hasMineBonusPerk } = mineTokens({
				...services,
				playerMining: mockPlayer.id
			}) as any;

			makeSure(newTokenCount).is(mockPlayer.tokens + 11);
			makeSure(tokensEarned).is(11);
			makeSure(hasMineBonusPerk).isTrue();
		})

		it('should give the player tokens for mining', () => {
			const mockPlayer = addMockPlayer(db, {
				tokens: 10
			});

			mineTokens({
				...services,
				playerMining: mockPlayer.id
			});

			const updatedPlayer = services.playerService.getPlayer(mockPlayer.id);

			makeSure(updatedPlayer).is({
				...mockPlayer,
				tokens: mockPlayer.tokens + 10
			});
		});

		it('should throw NonPlayerMinedError if the provided player is not a valid player', () => {
			const result = mineTokens({
				...services,
				playerMining: INVALID_PLAYER_ID
			});
			makeSure(result.isNonPlayerMined()).isTrue();
		});
	});
});