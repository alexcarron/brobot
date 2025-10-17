import { makeSure } from "../../../utilities/jest/jest-utils";
import { Perks } from "../constants/perks.constants";
import { Roles } from "../constants/roles.constants";
import { INVALID_PERK_ID, INVALID_PERK_NAME } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { createMockPerkService } from "../mocks/mock-services";
import { PerkNotFoundError } from "../utilities/error.utility";
import { PerkService } from "./perk.service";

describe('PerkService', () => {
	let perkService: PerkService;
	let db: DatabaseQuerier;

	beforeEach(() => {
		perkService = createMockPerkService();
		db = perkService.perkRepository.db;
	});

	describe('resolvePerk()', () => {
		it('should resolve a perk ID to a perk object', () => {
			const perk = perkService.resolvePerk(Perks.MINE_BONUS.id);
			makeSure(perk).isAnObject();
			makeSure(perk.id).is(Perks.MINE_BONUS.id);
		});

		it('should throw an error if the perk with the given ID is not found', () => {
			expect(() => perkService.resolvePerk(INVALID_PERK_ID)).toThrow(PerkNotFoundError);
		});

		it('should resolve a perk object to itself', () => {
			const mineBonusPerk = perkService.resolvePerk(Perks.MINE_BONUS.id);

			const perk = perkService.resolvePerk(mineBonusPerk);
			makeSure(perk).isAnObject();
			makeSure(perk.id).is(Perks.MINE_BONUS.id);
		});

		it('should resolve a perk name to a perk object', () => {
			const perk = perkService.resolvePerk(Perks.MINE_BONUS.name);
			makeSure(perk).isAnObject();
			makeSure(perk.id).is(Perks.MINE_BONUS.id);
		});

		it('should throw an error if the perk with the given name is not found', () => {
			expect(() => perkService.resolvePerk(INVALID_PERK_NAME)).toThrow(PerkNotFoundError);
		});
	});

	describe('resolveID()', () => {
		it('should resolve a perk ID to itself', () => {
			const perkID = perkService.resolveID(Perks.MINE_BONUS.id);
			makeSure(perkID).is(Perks.MINE_BONUS.id);
		});

		it('should resolve a perk object to its ID', () => {
			const mineBonusPerk = perkService.resolvePerk(Perks.MINE_BONUS.id);
			const perkID = perkService.resolveID(mineBonusPerk);
			makeSure(perkID).is(Perks.MINE_BONUS.id);
		});

		it('should resolve a perk name to its ID', () => {
			const perkID = perkService.resolveID(Perks.MINE_BONUS.name);
			makeSure(perkID).is(Perks.MINE_BONUS.id);
		});
	});

	describe('doesPlayerHave()', () => {
		it('should return true if the player has the given perk', () => {
			const player = addMockPlayer(db, {
				perks: [Perks.MINE_BONUS.name]
			});

			const hasPerk = perkService.doesPlayerHave(Perks.MINE_BONUS.id, player.id);
			makeSure(hasPerk).is(true);
		});

		it('should return false if the player does not have the given perk', () => {
			const player = addMockPlayer(db, {
				perks: []
			});

			const hasPerk = perkService.doesPlayerHave(Perks.MINE_BONUS.id, player.id);
			makeSure(hasPerk).is(false);
		});

		it('should work with clean syntax', () => {
			const perklessPlayer = addMockPlayer(db, {
				perks: []
			});

			const playerWithPerk = addMockPlayer(db, {
				perks: [Perks.MINE_BONUS.name]
			});

			const hasPerk = perkService.doesPlayerHave(Perks.MINE_BONUS, playerWithPerk);
			makeSure(hasPerk).is(true);

			const doesNotHavePerk = perkService.doesPlayerHave(Perks.MINE_BONUS, perklessPlayer);
			makeSure(doesNotHavePerk).is(false);

		});

		it('should return true if perk is in role', () => {
			const player = addMockPlayer(db, {
				role: Roles.MINE_BONUS_ROLE
			});

			const hasPerk = perkService.doesPlayerHave(Perks.MINE_BONUS, player);
			makeSure(hasPerk).is(true);
		});
	});

	describe('doIfPlayerHas()', () => {
		it('should execute the callback if the player has the given perk', () => {
			let callbackExecuted = false;

			const player = addMockPlayer(db, {
				perks: [Perks.MINE_BONUS.name]
			});

			perkService.doIfPlayerHas(Perks.MINE_BONUS.id, player.id, () => {
				callbackExecuted = true;
			});

			makeSure(callbackExecuted).is(true);
		});

		it('should not execute the callback if the player does not have the given perk', () => {
			let callbackExecuted = false

			const player = addMockPlayer(db, {
				perks: []
			});

			perkService.doIfPlayerHas(Perks.MINE_BONUS.id, player.id, () => {
				callbackExecuted = true;
			});

			makeSure(callbackExecuted).is(false);
		});

		it('should work with clean syntax', () => {
			const player = addMockPlayer(db, {
				perks: [Perks.MINE_BONUS.name]
			});

			let tokensEarned = 1;
			perkService.doIfPlayerHas(Perks.MINE_BONUS, player, () => {
				tokensEarned += 1;
			});

			makeSure(tokensEarned).is(2);
		})
	});

	describe('giveToPlayer()', () => {
		it('should add the given perk to the player', () => {
			const player = addMockPlayer(db, {
				perks: []
			});

			perkService.giveToPlayer(Perks.MINE_BONUS.id, player.id);
			const hasPerk = perkService.doesPlayerHave(Perks.MINE_BONUS, player);
			makeSure(hasPerk).is(true);
		});
	});
});