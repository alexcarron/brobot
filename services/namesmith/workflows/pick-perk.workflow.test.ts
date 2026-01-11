import { failTest, makeSure } from "../../../utilities/jest/jest-utils";
import { Perks } from "../constants/perks.constants";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { PerkService } from "../services/perk.service";
import { PlayerService } from "../services/player.service";
import { Player } from "../types/player.types";
import { returnIfNotFailure } from "../utilities/workflow.utility";
import { pickPerk } from "./pick-perk.workflow";

describe('pick-perk.workflow', () => {
	let playerService: PlayerService;
	let perkService: PerkService;
	let db: DatabaseQuerier;

	let NO_PERKS_PLAYER: Player;

	beforeEach(() => {
		const dependencies = setupMockNamesmith();
		playerService = dependencies.playerService;
		perkService = dependencies.perkService;
		db = dependencies.db;

		NO_PERKS_PLAYER = addMockPlayer(db, {
			perks: [],
		});
	});

	describe('pickPerk()', () => {
		it('should give player the given perk', () => {
			pickPerk({
				player: NO_PERKS_PLAYER,
				pickedPerk: Perks.MINE_BONUS,
			});

			const player = playerService.resolvePlayer(NO_PERKS_PLAYER.id);
			const hasPerk = perkService.doesPlayerHave(Perks.MINE_BONUS.id, player.id);

			makeSure(player.perks).hasAnItemWhere(perk =>
				perk.id === Perks.MINE_BONUS.id
			);
			makeSure(hasPerk).is(true);
		});

		it('should return playerAlreadyHasPerk failure if the player already has the perk', () => {
			perkService.giveToPlayer(Perks.MINE_BONUS, NO_PERKS_PLAYER);

			const result = pickPerk({
				player: NO_PERKS_PLAYER,
				pickedPerk: Perks.MINE_BONUS,
			});

			makeSure(result.isFailure()).isTrue();
			if (!result.isPlayerAlreadyHasPerk())
				failTest('Returned result is not a playerAlreadyHasPerk failure');
		});

		it('should return perkAlreadyChosen failure if the player already has one of the perks', () => {
			pickPerk({
				player: NO_PERKS_PLAYER,
				pickedPerk: Perks.REFILL_BONUS,
			});

			const result = pickPerk({
				player: NO_PERKS_PLAYER,
				pickedPerk: Perks.MINE_BONUS,
			});

			makeSure(result.isFailure()).isTrue();
			if (!result.isPerkAlreadyChosen())
				failTest('Returned result is not a perkAlreadyChosen failure');
		});

		it('should return any free tokens earned', () => {
			const result = returnIfNotFailure(
				pickPerk({
					player: NO_PERKS_PLAYER,
					pickedPerk: Perks.MINE_BONUS,
				})
			);

			makeSure(result.isFailure()).isFalse();
			makeSure(result.freeTokensEarned).is(0);
		});

		it('should give free token if player choose the free tokens perk', () => {
			const result = returnIfNotFailure(
				pickPerk({
					player: NO_PERKS_PLAYER,
					pickedPerk: Perks.FREE_TOKENS,
				})
			);

			const player = playerService.resolvePlayer(NO_PERKS_PLAYER.id);

			makeSure(result.isFailure()).isFalse();
			makeSure(result.freeTokensEarned).is(500);
			makeSure(player.tokens).is(500);
		});

		it('should remove free tokens if player is replacing the free tokens perk', () => {
			pickPerk({
				player: NO_PERKS_PLAYER,
				pickedPerk: Perks.FREE_TOKENS,
			});

			let player = playerService.resolvePlayer(NO_PERKS_PLAYER.id);
			makeSure(player.tokens).is(500);

			const result =
				pickPerk({
					player: NO_PERKS_PLAYER,
					pickedPerk: Perks.MINE_BONUS,
				});

			player = playerService.resolvePlayer(NO_PERKS_PLAYER.id);

			makeSure(result.isFailure()).isTrue();
			makeSure(result.isPerkAlreadyChosen()).isTrue();
		})

		it('should return nonPlayer failure if the player does not exist', () => {
			const result =
				pickPerk({
					player: INVALID_PLAYER_ID,
					pickedPerk: Perks.MINE_BONUS,
				});

			makeSure(result.isFailure()).isTrue();
			makeSure(result.isNotAPlayer()).isTrue();
		});

		it('should return perkDoesNotExist failure if the perk does not exist', () => {
			const result =
				pickPerk({
					player: NO_PERKS_PLAYER,
					pickedPerk: INVALID_PLAYER_ID,
				});

			makeSure(result.isFailure()).isTrue();
			makeSure(result.isPerkDoesNotExist()).isTrue();
		});
	});
})