import { failTest, makeSure } from "../../../utilities/jest/jest-utils";
import { Perks } from "../constants/perks.constants";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { PerkService } from "../services/perk.service";
import { PlayerService } from "../services/player.service";
import { Perk } from "../types/perk.types";
import { Player } from "../types/player.types";
import { returnIfNotFailure } from "../utilities/workflow.utility";
import { pickPerk } from "./pick-perk.workflow";

describe('pick-perk.workflow', () => {
	let playerService: PlayerService;
	let perkService: PerkService;
	let db: DatabaseQuerier;

	let NO_PERKS_PLAYER: Player;
	let PERKS_PICKING_FROM: Perk[];

	beforeEach(() => {
		const dependencies = setupMockNamesmith();
		playerService = dependencies.playerService;
		perkService = dependencies.perkService;
		db = dependencies.db;

		NO_PERKS_PLAYER = addMockPlayer(db, {
			perks: [],
		});

		PERKS_PICKING_FROM = perkService.perkRepository.getPerks();
	});

	describe('pickPerk()', () => {
		it('should give player the given perk', () => {
			pickPerk({
				player: NO_PERKS_PLAYER,
				pickedPerk: Perks.MINE_BONUS,
				perksPickingFrom: PERKS_PICKING_FROM,
			});

			const player = playerService.resolvePlayer(NO_PERKS_PLAYER.id);
			const hasPerk = perkService.doesPlayerHave(Perks.MINE_BONUS.id, player.id);

			makeSure(player.perks).hasAnItemWhere(perk =>
				perk.id === Perks.MINE_BONUS.id
			);
			makeSure(hasPerk).is(true);
		});

		it('should return perkAlreadyChosen failure if the player already has one of the perks', () => {
			const player = addMockPlayer(db, {
				perks: [Perks.REFILL_BONUS.id]
			});

			const result = pickPerk({
				player: player,
				pickedPerk: Perks.MINE_BONUS,
				perksPickingFrom: PERKS_PICKING_FROM,
			});

			makeSure(result.isFailure()).isTrue();
			if (!result.isPerkAlreadyChosen())
				failTest('Returned result is not a perkAlreadyChosen failure');

			makeSure(result.chosenPerk.id).is(Perks.REFILL_BONUS.id);
		});

		it('should return any free tokens earned', () => {
			const result = returnIfNotFailure(
				pickPerk({
					player: NO_PERKS_PLAYER,
					pickedPerk: Perks.MINE_BONUS,
					perksPickingFrom: PERKS_PICKING_FROM,
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
					perksPickingFrom: PERKS_PICKING_FROM,
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
				perksPickingFrom: PERKS_PICKING_FROM,
			});

			let player = playerService.resolvePlayer(NO_PERKS_PLAYER.id);
			makeSure(player.tokens).is(500);

			const result =
				pickPerk({
					player: NO_PERKS_PLAYER,
					pickedPerk: Perks.MINE_BONUS,
					perksPickingFrom: PERKS_PICKING_FROM,
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
					perksPickingFrom: PERKS_PICKING_FROM,
				});

			makeSure(result.isFailure()).isTrue();
			makeSure(result.isNotAPlayer()).isTrue();
		});

		it('should return perkDoesNotExist failure if the perk does not exist', () => {
			const result =
				pickPerk({
					player: NO_PERKS_PLAYER,
					pickedPerk: INVALID_PLAYER_ID,
					perksPickingFrom: PERKS_PICKING_FROM,
				});

			makeSure(result.isFailure()).isTrue();
			makeSure(result.isPerkDoesNotExist()).isTrue();
		});
	});
})