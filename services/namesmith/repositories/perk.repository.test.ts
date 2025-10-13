import { getRandomElement } from "../../../utilities/data-structure-utils";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_PERK_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { createMockPerkRepo } from "../mocks/mock-repositories";
import { PerkNotFoundError } from "../utilities/error.utility";
import { PerkRepository } from "./perk.repository";

describe('PerkRepository', () => {
	let perkRepository: PerkRepository;
	let db: DatabaseQuerier;

	const MINE_BONUS_PERK_ID = 1;
	const MINE_BONUS_ROLE_ID = 1;

	beforeEach(() => {
		perkRepository = createMockPerkRepo();
		db = perkRepository.db;
	});

	describe('getPerks()', () => {
		it('returns an array of all perk objects', () => {
			const perks = perkRepository.getPerks();

			makeSure(perks).isAnArray();
			makeSure(perks).isNotEmpty();
			makeSure(perks).haveProperties('id', 'name', 'description');
		});
	});

	describe('getPerkByID()', () => {
		it('returns the correct perk object when given a valid ID', () => {
			const ALL_PERKS = perkRepository.getPerks();
			const RANDOM_PERK = getRandomElement(ALL_PERKS);

			const perk = perkRepository.getPerkByID(RANDOM_PERK.id);

			makeSure(perk).isNotNull();
			makeSure(perk).hasProperties('id', 'name', 'description');
			makeSure(perk?.id).is(RANDOM_PERK.id);
		});

		it('returns null when given an invalid ID', () => {
			const perk = perkRepository.getPerkByID(INVALID_PERK_ID);
			makeSure(perk).isNull();
		});
	});

	describe('getPerkOrThrow()', () => {
		it('returns the correct perk object when given a valid ID', () => {
			const ALL_PERKS = perkRepository.getPerks();
			const RANDOM_PERK = getRandomElement(ALL_PERKS);

			const perk = perkRepository.getPerkOrThrow(RANDOM_PERK.id);

			makeSure(perk).isNotNull();
			makeSure(perk).hasProperties('id', 'name', 'description');
			makeSure(perk.id).is(RANDOM_PERK.id);
		});

		it('throws an error when given an invalid ID', () => {
			makeSure(() => perkRepository.getPerkOrThrow(INVALID_PERK_ID)).throws(PerkNotFoundError);
		});
	});

	describe('getIDsofPlayersWithPerkID()', () => {
		it('returns an array of the only player ID that has the perk with the given ID', () => {
			const player = addMockPlayer(db, {
				perks: [MINE_BONUS_PERK_ID]
			});
			const playerIDs = perkRepository.getIDsofPlayersWithPerkID(MINE_BONUS_PERK_ID);

			makeSure(playerIDs).isAnArray();
			makeSure(playerIDs).contains(player.id);
		});

		it('returns an empty array when no players have the perk with the given ID', () => {
			const playerIDs = perkRepository.getIDsofPlayersWithPerkID(MINE_BONUS_PERK_ID);

			makeSure(playerIDs).isAnArray();
			makeSure(playerIDs).isEmpty();
		});

		it('returns an array of multiple player IDs that have the perk with the given ID', () => {
			const player1 = addMockPlayer(db, {
				perks: [MINE_BONUS_PERK_ID]
			});
			const player2 = addMockPlayer(db, {
				perks: [MINE_BONUS_PERK_ID]
			});
			const player3 = addMockPlayer(db, {
				perks: [MINE_BONUS_PERK_ID]
			});
			const playerIDs = perkRepository.getIDsofPlayersWithPerkID(MINE_BONUS_PERK_ID);

			makeSure(playerIDs).isAnArray();
			makeSure(playerIDs).contains(player1.id, player2.id, player3.id);
		});

		it('return empty array when given an invalid perk ID', () => {
			const playerIDs = perkRepository.getIDsofPlayersWithPerkID(INVALID_PERK_ID);

			makeSure(playerIDs).isAnArray();
			makeSure(playerIDs).isEmpty();
		});
	});

	describe('getPerkIDsOfPlayerID()', () => {
		it('returns an array of the only perk ID that the player has', () => {
			const player = addMockPlayer(db, {
				perks: [MINE_BONUS_PERK_ID]
			});
			const perkIDs = perkRepository.getPerkIDsOfPlayerID(player.id);

			makeSure(perkIDs).isAnArray();
			makeSure(perkIDs).contains(MINE_BONUS_PERK_ID);
		});

		it('returns an empty array when the player has no perks', () => {
			const player = addMockPlayer(db, {
				perks: []
			});
			const perkIDs = perkRepository.getPerkIDsOfPlayerID(player.id);

			makeSure(perkIDs).isAnArray();
			makeSure(perkIDs).isEmpty();
		});
	});

	describe('getPerkIDsOfRoleID()', () => {
		it('returns an array of perk IDs that the role has', () => {
			const perkIDs = perkRepository.getPerkIDsOfRoleID(MINE_BONUS_ROLE_ID);

			makeSure(perkIDs).isAnArray();
			makeSure(perkIDs).isNotEmpty();
			makeSure(perkIDs).contains(MINE_BONUS_PERK_ID);
		});

		it('returns an empty array when the role has no perks', () => {
			const perkIDs = perkRepository.getPerkIDsOfRoleID(INVALID_PERK_ID);

			makeSure(perkIDs).isAnArray();
			makeSure(perkIDs).isEmpty();
		});
	});
});