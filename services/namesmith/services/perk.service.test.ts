import { makeSure } from "../../../utilities/jest/jest-utils";
import { Perks } from "../constants/perks.constants";
import { INVALID_PERK_ID, INVALID_PERK_NAME } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPerk } from "../mocks/mock-data/mock-perks";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { addMockRole } from "../mocks/mock-data/mock-roles";
import { Perk } from "../types/perk.types";
import { Role } from "../types/role.types";
import { PerkNotFoundError, PlayerAlreadyHasPerkError } from "../utilities/error.utility";
import { PerkService } from "./perk.service";

describe('PerkService', () => {
	let perkService: PerkService;
	let db: DatabaseQuerier;

	let MINE_BONUS_ROLE: Role;

	beforeEach(() => {
		perkService = PerkService.asMock();
		db = perkService.perkRepository.db;
		MINE_BONUS_ROLE = addMockRole(db, {
			perks: [Perks.MINE_BONUS]
		})
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

	describe('isPerk()', () => {
		it('should return true if the given value is an existing perk object', () => {
			const perk = perkService.resolvePerk(Perks.MINE_BONUS.id);
			const isPerk = perkService.isPerk(perk);
			makeSure(isPerk).is(true);
		});

		it('should return true if the given value is an existing perk definition', () => {
			const isPerk = perkService.isPerk(Perks.MINE_BONUS.id);
			makeSure(isPerk).is(true);
		});

		it('should return true if the given value is an existing perk name', () => {
			const isPerk = perkService.isPerk(Perks.MINE_BONUS.name);
			makeSure(isPerk).is(true);
		});

		it('should return true if the given value is an existing perk id', () => {
			const isPerk = perkService.isPerk(Perks.MINE_BONUS.id);
			makeSure(isPerk).is(true);
		});

		it('should return false if the given value is not a perk', () => {
			const isPerk = perkService.isPerk(INVALID_PERK_ID);
			makeSure(isPerk).is(false);
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
				role: MINE_BONUS_ROLE
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

		it('should throw a PlayerAlreadyHasPerkError if the player already has the perk', () => {
			const player = addMockPlayer(db, {
				perks: [Perks.MINE_BONUS.name]
			});

			makeSure(() => {
				perkService.giveToPlayer(Perks.MINE_BONUS.id, player.id);
			}).throws(PlayerAlreadyHasPerkError);
		});
	});

	describe('removeIfPlayerHas()', () => {
		it('should remove the given perk from the player if the player has it', () => {
			const player = addMockPlayer(db, {
				perks: [Perks.MINE_BONUS.name]
			});

			const result = perkService.removeIfPlayerHas(Perks.MINE_BONUS.id, player.id);
			const hasPerk = perkService.doesPlayerHave(Perks.MINE_BONUS, player);

			makeSure(result).isTrue();
			makeSure(hasPerk).isFalse();
		});

		it('should not remove the given perk from the player if the player does not have it', () => {
			const player = addMockPlayer(db, {
				perks: []
			});

			const result = perkService.removeIfPlayerHas(Perks.MINE_BONUS.id, player.id);
			const hasPerk = perkService.doesPlayerHave(Perks.MINE_BONUS, player);

			makeSure(result).isFalse();
			makeSure(hasPerk).isFalse();
		});
	});

	describe('offerThreeRandomNewPerks()', () => {
		let PERKS: Perk[];
		let OFFERED_PERK: Perk;

		beforeEach(() => {
			PERKS = perkService.perkRepository.getPerks();

			db.exec("DELETE FROM perk");

			OFFERED_PERK = addMockPerk(db, {
				name: "Perk 1",
				wasOffered: true,
			});
			PERKS.push(OFFERED_PERK);
			PERKS.push(addMockPerk(db, {
				name: "Perk 2",
				wasOffered: false,
			}));
			PERKS.push(addMockPerk(db, {
				name: "Perk 3",
				wasOffered: false,
			}));
			PERKS.push(addMockPerk(db, {
				name: "Perk 4",
				wasOffered: false,
			}));
			PERKS.push(addMockPerk(db, {
				name: "Perk 5",
				wasOffered: false,
			}));
			PERKS.push(addMockPerk(db, {
				name: "Perk 6",
				wasOffered: false,
			}));
		})

		it('should return three different perks', () => {
			const perks = perkService.offerThreeRandomNewPerks();

			makeSure(perks).hasLengthOf(3);
			makeSure(perks).areAllDifferent();

			const perkIDs = perks.map(perk => perk.id);
			const perkIDsSet = new Set(perkIDs);

			makeSure(perkIDsSet.size).is(3);
		});

		it('should return perks that have not been offered', () => {
			const perks = perkService.offerThreeRandomNewPerks();

			makeSure(perks).doesNotContain(OFFERED_PERK);
		});

		it('should mark perks as offered', () => {
			const perks = perkService.offerThreeRandomNewPerks();

			makeSure(perks).haveProperty('wasOffered', true);

			for (const perk of perks) {
				const wasOffered = perkService.perkRepository.getWasOffered(perk.id);
				makeSure(wasOffered).is(true);
			}
		});

		it('should mark perks as currently offered', () => {
			const perks = perkService.offerThreeRandomNewPerks();

			for (const perk of perks) {
				const isCurrentlyOffered = perkService.perkRepository.isCurrentlyOfferedPerk(perk.id);
				makeSure(isCurrentlyOffered).is(true);
			}

			const otherPerks = perkService.offerThreeRandomNewPerks();

			for (const perk of perks) {
				if (otherPerks.some(otherPerk => otherPerk.id === perk.id))
					continue;

				const isCurrentlyOffered = perkService.perkRepository.isCurrentlyOfferedPerk(perk.id);
				makeSure(isCurrentlyOffered).is(false);
			}
			for (const perk of otherPerks) {
				const isCurrentlyOffered = perkService.perkRepository.isCurrentlyOfferedPerk(perk.id);
				makeSure(isCurrentlyOffered).is(true);
			}
		});

		it('should refresh the wasOffered flag for all perks after offerring every perk', () => {
			perkService.offerThreeRandomNewPerks();
			perkService.offerThreeRandomNewPerks();
			perkService.offerThreeRandomNewPerks();
			perkService.offerThreeRandomNewPerks();
			perkService.offerThreeRandomNewPerks();
			perkService.offerThreeRandomNewPerks();
			perkService.offerThreeRandomNewPerks();
			perkService.offerThreeRandomNewPerks();
			perkService.offerThreeRandomNewPerks();
			perkService.offerThreeRandomNewPerks();
			perkService.offerThreeRandomNewPerks();
			perkService.offerThreeRandomNewPerks();

			const perksNotOfferedYet = perkService.perkRepository.getPerksNotYetOffered();

			makeSure(perksNotOfferedYet).hasLengthOf(5);
		})
	});

	describe('getPerksOfPlayer()', () => {
		it('should return an empty array when the player has no perks', () => {
			const player = addMockPlayer(db, {
				perks: []
			});

			const perks = perkService.getPerksOfPlayer(player);
			makeSure(perks).isEmpty();
		});

		it('should return an array of all the perks the player has', () => {
			const perk1 = addMockPerk(db, {name: "Perk 1"});
			const perk2 = addMockPerk(db, {name: "Perk 2"});
			const player = addMockPlayer(db, {
				perks: [perk1.name, perk2.name]
			});

			const perks = perkService.getPerksOfPlayer(player);
			makeSure(perks).hasLengthOf(2);
			makeSure(perks).containsOnly(perk1, perk2);
		});
	});
});