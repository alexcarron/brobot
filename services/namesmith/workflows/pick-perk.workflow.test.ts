import { makeSure } from "../../../utilities/jest/jest-utils";
import { Perks } from "../constants/perks.constants";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PerkService } from "../services/perk.service";
import { PlayerService } from "../services/player.service";
import { Perk } from "../types/perk.types";
import { Player } from "../types/player.types";
import { pickPerk } from "./pick-perk.workflow";
import { returnIfNotFailure } from "./workflow-result-creator";

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
				...getNamesmithServices(),
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

		it('should remove previously picked perks', () => {
			let player = addMockPlayer(db, {
				perks: [Perks.REFILL_BONUS.id]
			});

			pickPerk({
				...getNamesmithServices(),
				player: NO_PERKS_PLAYER,
				pickedPerk: Perks.MINE_BONUS,
				perksPickingFrom: PERKS_PICKING_FROM,
			});

			player = playerService.resolvePlayer(NO_PERKS_PLAYER.id);
			const hasMineBonus = perkService.doesPlayerHave(Perks.MINE_BONUS.id, player.id);
			const hasRefillBonus = perkService.doesPlayerHave(Perks.REFILL_BONUS.id, player.id);

			makeSure(player.perks).hasAnItemWhere(perk =>
				perk.id === Perks.MINE_BONUS.id
			);
			makeSure(player.perks).hasNoItemsWhere(perk =>
				perk.id === Perks.REFILL_BONUS.id
			);
			makeSure(hasMineBonus).is(true);
			makeSure(hasRefillBonus).is(false);
		});

		it('should return any previously picked perks and any free tokens earned', () => {
			const result = returnIfNotFailure(
				pickPerk({
					...getNamesmithServices(),
					player: NO_PERKS_PLAYER,
					pickedPerk: Perks.MINE_BONUS,
				perksPickingFrom: PERKS_PICKING_FROM,
				})
			);

			makeSure(result.isFailure()).isFalse();
			makeSure(result.perkBeingReplaced).isNull();
			makeSure(result.freeTokensEarned).is(0);

			const result2 = returnIfNotFailure(
				pickPerk({
					...getNamesmithServices(),
					player: NO_PERKS_PLAYER,
					pickedPerk: Perks.REFILL_BONUS,
					perksPickingFrom: PERKS_PICKING_FROM,
				})
			);

			const mineBonusPerk = perkService.resolvePerk(Perks.MINE_BONUS.id);

			makeSure(result2.isFailure()).isFalse();
			makeSure(result2.perkBeingReplaced).is(mineBonusPerk);
		});

		it('should give free token if player choose the free tokens perk', () => {
			const result = returnIfNotFailure(
				pickPerk({
					...getNamesmithServices(),
					player: NO_PERKS_PLAYER,
					pickedPerk: Perks.FREE_TOKENS,
					perksPickingFrom: PERKS_PICKING_FROM,
				})
			);

			const player = playerService.resolvePlayer(NO_PERKS_PLAYER.id);

			makeSure(result.isFailure()).isFalse();
			makeSure(result.perkBeingReplaced).isNull();
			makeSure(result.freeTokensEarned).is(500);
			makeSure(player.tokens).is(500);
		});

		it('should remove free tokens if player is replacing the free tokens perk', () => {
			pickPerk({
				...getNamesmithServices(),
				player: NO_PERKS_PLAYER,
				pickedPerk: Perks.FREE_TOKENS,
				perksPickingFrom: PERKS_PICKING_FROM,
			});

			let player = playerService.resolvePlayer(NO_PERKS_PLAYER.id);
			makeSure(player.tokens).is(500);

			const result = returnIfNotFailure(
				pickPerk({
					...getNamesmithServices(),
					player: NO_PERKS_PLAYER,
					pickedPerk: Perks.MINE_BONUS,
					perksPickingFrom: PERKS_PICKING_FROM,
				})
			);

			player = playerService.resolvePlayer(NO_PERKS_PLAYER.id);

			makeSure(result.isFailure()).isFalse();
			makeSure(result.perkBeingReplaced).isNotNull();
			makeSure(result.perkBeingReplaced!.id).is(Perks.FREE_TOKENS.id);
			makeSure(result.freeTokensEarned).is(-500);
			makeSure(player.tokens).is(0);
		})

		it('should return nonPlayer failure if the player does not exist', () => {
			const result =
				pickPerk({
					...getNamesmithServices(),
					player: INVALID_PLAYER_ID,
					pickedPerk: Perks.MINE_BONUS,
				perksPickingFrom: PERKS_PICKING_FROM,
				});

			makeSure(result.isFailure()).isTrue();
			makeSure(result.isNonPlayer()).isTrue();
		});

		it('should return perkDoesNotExist failure if the perk does not exist', () => {
			const result =
				pickPerk({
					...getNamesmithServices(),
					player: NO_PERKS_PLAYER,
					pickedPerk: INVALID_PLAYER_ID,
				perksPickingFrom: PERKS_PICKING_FROM,
				});

			makeSure(result.isFailure()).isTrue();
			makeSure(result.isPerkDoesNotExist()).isTrue();
		});

		it('should return playerAlreadyHasThatPerk failure if the player already has that perk', () => {
			const playerWithAllPerks = addMockPlayer(db, {
				perks: PERKS_PICKING_FROM.map(perk => perk.id)
			})

			const result =
				pickPerk({
					...getNamesmithServices(),
					player: playerWithAllPerks,
					pickedPerk: Perks.MINE_BONUS,
				perksPickingFrom: PERKS_PICKING_FROM,
				});

			makeSure(result.isFailure()).isTrue();
			makeSure(result.isPlayerAlreadyHasThatPerk()).isTrue();
		});
	});
})