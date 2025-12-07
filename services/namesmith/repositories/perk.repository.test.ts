import { getRandomElement } from "../../../utilities/data-structure-utils";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { Perks } from "../constants/perks.constants";
import { INVALID_PERK_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { addMockRole } from "../mocks/mock-data/mock-roles";
import { PerkNotFoundError } from "../utilities/error.utility";
import { PerkRepository } from "./perk.repository";

describe('PerkRepository', () => {
	let perkRepository: PerkRepository;
	let db: DatabaseQuerier;

	const MINE_BONUS_ROLE_ID = 1;

	beforeEach(() => {
		perkRepository = PerkRepository.asMock();
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
				perks: [Perks.MINE_BONUS.id]
			});
			const playerIDs = perkRepository.getIDsofPlayersWithPerkID(Perks.MINE_BONUS.id);

			makeSure(playerIDs).isAnArray();
			makeSure(playerIDs).contains(player.id);
		});

		it('returns an empty array when no players have the perk with the given ID', () => {
			const playerIDs = perkRepository.getIDsofPlayersWithPerkID(Perks.MINE_BONUS.id);

			makeSure(playerIDs).isAnArray();
			makeSure(playerIDs).isEmpty();
		});

		it('returns an array of multiple player IDs that have the perk with the given ID', () => {
			const player1 = addMockPlayer(db, {
				perks: [Perks.MINE_BONUS.id]
			});
			const player2 = addMockPlayer(db, {
				perks: [Perks.MINE_BONUS.id]
			});
			const player3 = addMockPlayer(db, {
				perks: [Perks.MINE_BONUS.id]
			});
			const playerIDs = perkRepository.getIDsofPlayersWithPerkID(Perks.MINE_BONUS.id);

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
				perks: [Perks.MINE_BONUS.id]
			});
			const perkIDs = perkRepository.getPerkIDsOfPlayerID(player.id);

			makeSure(perkIDs).isAnArray();
			makeSure(perkIDs).contains(Perks.MINE_BONUS.id);
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

	describe('getPerksOfPlayerID()', () => {
		it('returns an array of the only perk that the player has', () => {
			const player = addMockPlayer(db, {
				perks: [Perks.MINE_BONUS.id]
			});
			const perks = perkRepository.getPerksOfPlayerID(player.id);

			makeSure(perks).isAnArray();
			makeSure(perks).hasLengthOf(1);
			makeSure(perks[0].id).is(Perks.MINE_BONUS.id);
			makeSure(perks[0]).hasProperties('id', 'name', 'description');
		});

		it('returns an empty array when the player has no perks', () => {
			const player = addMockPlayer(db, {
				perks: []
			});

			const perks = perkRepository.getPerksOfPlayerID(player.id);

			makeSure(perks).isAnArray();
			makeSure(perks).isEmpty();
		});
	});

	describe('doesPlayerIDHavePerkID()', () => {
		it('returns true when the player has the perk with the given ID', () => {
			const player = addMockPlayer(db, {
				perks: [Perks.MINE_BONUS.id]
			});
			const hasPerk = perkRepository.doesPlayerIDHavePerkID(player.id, Perks.MINE_BONUS.id);
			makeSure(hasPerk).isTrue();
		});

		it('returns false when the player does not have the perk with the given ID', () => {
			const player = addMockPlayer(db, {
				perks: []
			});
			const hasPerk = perkRepository.doesPlayerIDHavePerkID(player.id, Perks.MINE_BONUS.id);
			makeSure(hasPerk).isFalse();
		});
	})

	describe('addPerkIDToPlayer()', () => {
		it('adds the given perk ID to the player', () => {
			const player = addMockPlayer(db, {
				perks: []
			});
			perkRepository.addPerkIDToPlayer(Perks.MINE_BONUS.id, player.id);

			const perkIDs = perkRepository.getPerkIDsOfPlayerID(player.id);
			makeSure(perkIDs).isAnArray();
			makeSure(perkIDs).contains(Perks.MINE_BONUS.id);
		});
	});

	describe('removePerksFromPlayerID()', () => {
		it('removes all perks from the player', () => {
			const player = addMockPlayer(db, {
				perks: [Perks.MINE_BONUS.id]
			});
			perkRepository.removePerksFromPlayerID(player.id);

			const perkIDs = perkRepository.getPerkIDsOfPlayerID(player.id);
			makeSure(perkIDs).isAnArray();
			makeSure(perkIDs).isEmpty();
		});
	})

	describe('removePerkIDFromPlayer()', () => {
		it('removes the given perk ID from the player', () => {
			const player = addMockPlayer(db, {
				perks: [Perks.MINE_BONUS.id]
			});
			perkRepository.removePerkIDFromPlayer(Perks.MINE_BONUS.id, player.id);

			const perkIDs = perkRepository.getPerkIDsOfPlayerID(player.id);
			makeSure(perkIDs).isAnArray();
			makeSure(perkIDs).isEmpty();
		});
	})

	describe('getPerkIDsOfRoleID()', () => {
		it('returns an array of perk IDs that the role has', () => {
			const perkIDs = perkRepository.getPerkIDsOfRoleID(MINE_BONUS_ROLE_ID);

			makeSure(perkIDs).isAnArray();
			makeSure(perkIDs).isNotEmpty();
			makeSure(perkIDs).contains(Perks.MINE_BONUS.id);
		});

		it('returns an empty array when the role has no perks', () => {
			const perkIDs = perkRepository.getPerkIDsOfRoleID(INVALID_PERK_ID);

			makeSure(perkIDs).isAnArray();
			makeSure(perkIDs).isEmpty();
		});
	});

	describe('getPerksOfRoleID()', () => {
		it('returns an array of the only perk that the role has', () => {
			const role = addMockRole(db, {
				perks: [Perks.MINE_BONUS.id]
			});

			const perks = perkRepository.getPerksOfRoleID(role.id);

			makeSure(perks).isAnArray();
			makeSure(perks).hasLengthOf(1);
			makeSure(perks[0].id).is(Perks.MINE_BONUS.id);
			makeSure(perks[0]).hasProperties('id', 'name', 'description');
		});

		it('returns an empty array when the player has no perks', () => {
			const player = addMockRole(db, {
				perks: []
			});

			const perks = perkRepository.getPerksOfRoleID(player.id);

			makeSure(perks).isAnArray();
			makeSure(perks).isEmpty();
		});
	});

	describe('addPerkIDToRole()', () => {
		it('adds the given perk ID to the role', () => {
			const role = addMockRole(db, {
				perks: []
			});
			perkRepository.addPerkIDToRole(Perks.MINE_BONUS.id, role.id);

			const perkIDs = perkRepository.getPerkIDsOfRoleID(role.id);
			makeSure(perkIDs).isAnArray();
			makeSure(perkIDs).contains(Perks.MINE_BONUS.id);
		});
	});

	describe('removePerksFromRoleID()', () => {
		it('removes all perks from the role', () => {
			const role = addMockRole(db, {
				perks: [Perks.MINE_BONUS.id]
			});
			perkRepository.removePerksFromRoleID(role.id);

			const perkIDs = perkRepository.getPerkIDsOfRoleID(role.id);
			makeSure(perkIDs).isAnArray();
			makeSure(perkIDs).isEmpty();
		});
	});

	describe('setWasOffered()', () => {
		it('sets the wasOffered field of a perk to true', () => {
			perkRepository.setWasOffered(Perks.MINE_BONUS.id, true);

			const wasOffered = perkRepository.getWasOffered(Perks.MINE_BONUS.id);

			makeSure(wasOffered).isTrue();
		});

		it('sets the wasOffered field of a perk to false', () => {
			perkRepository.setWasOffered(Perks.MINE_BONUS.id, true);
			perkRepository.setWasOffered(Perks.MINE_BONUS.id, false);

			const wasOffered = perkRepository.getWasOffered(Perks.MINE_BONUS.id);

			makeSure(wasOffered).isFalse();
		});
	})

	describe('getWasOffered()', () => {
		it('returns false when the perk was not offered yet', () => {
			const wasOffered = perkRepository.getWasOffered(Perks.MINE_BONUS.id);
			makeSure(wasOffered).isFalse();
		});

		it('returns true when the perk was offered', () => {
			perkRepository.setWasOffered(Perks.MINE_BONUS.id, true);

			const wasOffered = perkRepository.getWasOffered(Perks.MINE_BONUS.id);

			makeSure(wasOffered).isTrue();
		});
	});

	describe('getPerksNotYetOffered()', () => {
		it('returns an array of perks that have not been offered yet', () => {
			const perks = perkRepository.getPerksNotYetOffered();

			makeSure(perks).isAnArray();
			makeSure(perks).isNotEmpty();
			makeSure(perks).haveProperty('wasOffered', false);
		});
	});

	describe('setWasOfferedForAllPerks()', () => {
		it('sets the wasOffered field of all perks to true', () => {
			perkRepository.setWasOfferedForAllPerks(true);

			const wasOffered = perkRepository.getWasOffered(Perks.MINE_BONUS.id);

			makeSure(wasOffered).isTrue();

			const perks = perkRepository.getPerks();
			makeSure(perks).haveProperty('wasOffered', true);
		});

		it('sets the wasOffered field of all perks to false', () => {
			perkRepository.setWasOfferedForAllPerks(true);
			perkRepository.setWasOfferedForAllPerks(false);

			const wasOffered = perkRepository.getWasOffered(Perks.MINE_BONUS.id);

			makeSure(wasOffered).isFalse();

			const perks = perkRepository.getPerks();
			makeSure(perks).haveProperty('wasOffered', false);
		});
	});

	describe('addPerk()', () => {
		it('adds a new perk to the database with an ID', () => {
			const perk = perkRepository.addPerk({
				id: 1001,
				name: 'Perk Name',
				description: 'Perk Description',
				wasOffered: false
			});

			makeSure(perk).hasProperty('id', 1001);
			makeSure(perk).hasProperty('name', 'Perk Name');
			makeSure(perk).hasProperty('description', 'Perk Description');
			makeSure(perk).hasProperty('wasOffered', false);

			const retrievedPerk = perkRepository.getPerkOrThrow(1001);
			makeSure(retrievedPerk).hasProperty('id', 1001);
			makeSure(retrievedPerk).hasProperty('name', 'Perk Name');
			makeSure(retrievedPerk).hasProperty('description', 'Perk Description');
			makeSure(retrievedPerk).hasProperty('wasOffered', false);
		});

		it('adds a new perk to the database without giving an ID', () => {
			const perk = perkRepository.addPerk({
				name: 'Perk Name',
				description: 'Perk Description',
				wasOffered: false
			});

			makeSure(perk).hasProperty('id');
			makeSure(perk).hasProperty('name', 'Perk Name');
			makeSure(perk).hasProperty('description', 'Perk Description');
			makeSure(perk).hasProperty('wasOffered', false);

			const retrievedPerk = perkRepository.getPerkOrThrow(perk.id);
			makeSure(retrievedPerk).hasProperty('id');
			makeSure(retrievedPerk).hasProperty('name', 'Perk Name');
			makeSure(retrievedPerk).hasProperty('description', 'Perk Description');
			makeSure(retrievedPerk).hasProperty('wasOffered', false);
		});
	});

	describe('updatePerk()', () => {
		it('updates a perk by ID with all new information', () => {
			const perk = perkRepository.addPerk({
				name: 'Perk Name',
				description: 'Perk Description',
				wasOffered: false
			});

			const updatedPerk = perkRepository.updatePerk({
				id: perk.id,
				name: 'New Perk Name',
				description: 'New Perk Description',
				wasOffered: true
			});

			makeSure(updatedPerk).hasProperty('id', perk.id);
			makeSure(updatedPerk).hasProperty('name', 'New Perk Name');
			makeSure(updatedPerk).hasProperty('description', 'New Perk Description');
			makeSure(updatedPerk).hasProperty('wasOffered', true);

			const retrievedPerk = perkRepository.getPerkOrThrow(perk.id);
			makeSure(retrievedPerk).hasProperty('id', perk.id);
			makeSure(retrievedPerk).hasProperty('name', 'New Perk Name');
			makeSure(retrievedPerk).hasProperty('description', 'New Perk Description');
			makeSure(retrievedPerk).hasProperty('wasOffered', true);
		});

		it('updates only a perk\'s name', () => {
			const perk = perkRepository.addPerk({
				name: 'Perk Name',
				description: 'Perk Description',
				wasOffered: false
			});

			const updatedPerk = perkRepository.updatePerk({
				id: perk.id,
				name: 'New Perk Name'
			});

			makeSure(updatedPerk).hasProperty('id', perk.id);
			makeSure(updatedPerk).hasProperty('name', 'New Perk Name');
			makeSure(updatedPerk).hasProperty('description', 'Perk Description');
			makeSure(updatedPerk).hasProperty('wasOffered', false);

			const retrievedPerk = perkRepository.getPerkOrThrow(perk.id);
			makeSure(retrievedPerk).hasProperty('id', perk.id);
			makeSure(retrievedPerk).hasProperty('name', 'New Perk Name');
			makeSure(retrievedPerk).hasProperty('description', 'Perk Description');
			makeSure(retrievedPerk).hasProperty('wasOffered', false);
		});

		it('updates a perk by name with all new information', () => {
			const perk = perkRepository.addPerk({
				name: 'Perk Name',
				description: 'Perk Description',
				wasOffered: false
			});

			const updatedPerk = perkRepository.updatePerk({
				name: 'Perk Name',
				description: 'New Perk Description',
				wasOffered: true
			});

			makeSure(updatedPerk).hasProperty('id', perk.id);
			makeSure(updatedPerk).hasProperty('name', 'Perk Name');
			makeSure(updatedPerk).hasProperty('description', 'New Perk Description');
			makeSure(updatedPerk).hasProperty('wasOffered', true);

			const retrievedPerk = perkRepository.getPerkOrThrow(perk.id);
			makeSure(retrievedPerk).hasProperty('id', perk.id);
			makeSure(retrievedPerk).hasProperty('name', 'Perk Name');
			makeSure(retrievedPerk).hasProperty('description', 'New Perk Description');
			makeSure(retrievedPerk).hasProperty('wasOffered', true);
		});
	});

	describe('removePerk()', () => {
		it('removes a perk by ID', () => {
			const perk = perkRepository.addPerk({
				name: 'Perk Name',
				description: 'Perk Description',
				wasOffered: false
			});

			perkRepository.removePerk(perk.id);
			const retrievedPerk = perkRepository.getPerkByID(perk.id);
			makeSure(retrievedPerk).isNull();
		});

		it('throws a PerkNotFoundError if the perk does not exist', () => {
			makeSure(() => perkRepository.removePerk(INVALID_PERK_ID)).throws(PerkNotFoundError);
		});
	});

	describe('setPerkAsCurrentlyOffered()', () => {
		it('marks a perk as currently offered', () => {
			const perk = perkRepository.addPerk({
				name: 'Perk Name',
				description: 'Perk Description',
				wasOffered: false
			});

			perkRepository.setPerkAsCurrentlyOffered(perk.id);

			const isCurrentlyOffered = perkRepository.isCurrentlyOfferedPerk(perk.id);

			makeSure(isCurrentlyOffered).is(true);
		});
	});

	describe('unsetAllPerksAsCurrentlyOffered()', () => {
		it('marks a perk as not currently offered', () => {
			const perk = perkRepository.addPerk({
				name: 'Perk Name',
				description: 'Perk Description',
				wasOffered: false
			});

			perkRepository.setPerkAsCurrentlyOffered(perk.id);
			perkRepository.unsetAllPerksAsCurrentlyOffered();

			const isCurrentlyOffered = perkRepository.isCurrentlyOfferedPerk(perk.id);

			makeSure(isCurrentlyOffered).is(false);
		});
	});

	describe('isCurrentlyOfferedPerk()', () => {
		it('returns false when the perk is not currently offered', () => {
			const perk = perkRepository.addPerk({
				name: 'Perk Name',
				description: 'Perk Description',
				wasOffered: false
			});

			const isCurrentlyOffered = perkRepository.isCurrentlyOfferedPerk(perk.id);

			makeSure(isCurrentlyOffered).is(false);
		});

		it('returns true when the perk is currently offered', () => {
			const perk = perkRepository.addPerk({
				name: 'Perk Name',
				description: 'Perk Description',
				wasOffered: false
			});

			perkRepository.setPerkAsCurrentlyOffered(perk.id);
			const isCurrentlyOffered = perkRepository.isCurrentlyOfferedPerk(perk.id);

			makeSure(isCurrentlyOffered).is(true);
		});
	});

	describe('getCurrentlyOfferedPerks()', () => {
		it('returns an empty array when no perks are currently offered', () => {
			const perks = perkRepository.getCurrentlyOfferedPerks();

			makeSure(perks).isEmpty();
		});

		it('returns an array of perks that are currently offered', () => {
			const perk = perkRepository.addPerk({
				name: 'Perk Name',
				description: 'Perk Description',
				wasOffered: false
			});

			perkRepository.setPerkAsCurrentlyOffered(perk.id);
			const perks = perkRepository.getCurrentlyOfferedPerks();

			makeSure(perks).hasLengthOf(1);
			makeSure(perks[0]).hasProperty('id', perk.id);
			makeSure(perks[0]).hasProperty('name', 'Perk Name');
			makeSure(perks[0]).hasProperty('description', 'Perk Description');
			makeSure(perks[0]).hasProperty('wasOffered', false);
		});
	});
});