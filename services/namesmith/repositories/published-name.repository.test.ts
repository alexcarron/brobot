import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_PUBLISHED_NAME_ID } from "../constants/testing.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { addMockPublishedName } from "../mocks/mock-data/mock-published-names";
import { addMockVote } from "../mocks/mock-data/mock-votes";
import { Player } from "../types/player.types";
import { PublishedName } from "../types/published-name.types";
import { PublishedNameNotFoundError } from "../utilities/error.utility";
import { PublishedNameRepository } from "./published-name.repository";

describe('PublishedNameRepository', () => {
	let db: DatabaseQuerier;
	let publishedNameRepository: PublishedNameRepository;

	let SOME_PLAYER: Player;
	let SOME_NAME: PublishedName;

	beforeEach(() => {
		publishedNameRepository = PublishedNameRepository.asMock();
		db = publishedNameRepository.db;

		SOME_PLAYER = addMockPlayer(db);
		SOME_NAME = addMockPublishedName(db, { player: SOME_PLAYER, name: 'Some Name' });
	});

	describe('getPublishedNames()', () => {
		it('returns every published name entry', () => {
			const publishedNames = publishedNameRepository.getPublishedNames();
			makeSure(publishedNames).contains(SOME_NAME);
			makeSure(publishedNames).haveOnlyProperties('id', 'playerID', 'name', 'slotNumber');
		});
	});

	describe('getPublishedNameByID()', () => {
		it('returns a published name by its ID', () => {
			const publishedName = publishedNameRepository.getPublishedNameByID(SOME_NAME.id);
			makeSure(publishedName).is(SOME_NAME);
		});

		it('returns null if not found', () => {
			const publishedName = publishedNameRepository.getPublishedNameByID(INVALID_PUBLISHED_NAME_ID);
			makeSure(publishedName).isNull();
		});
	});

	describe('getPublishedNameOrThrow()', () => {
		it('throws if the published name does not exist', () => {
			makeSure(() =>
				publishedNameRepository.getPublishedNameOrThrow(INVALID_PUBLISHED_NAME_ID)
			).throws(PublishedNameNotFoundError);
		});
	});

	describe('resolveID()', () => {
		it('resolves an ID to itself', () => {
			makeSure(publishedNameRepository.resolveID(SOME_NAME.id)).is(SOME_NAME.id);
		});

		it('resolves an entry to its ID', () => {
			makeSure(publishedNameRepository.resolveID(SOME_NAME)).is(SOME_NAME.id);
		});
	});

	describe('resolvePublishedName()', () => {
		it('resolves an ID to the entry', () => {
			makeSure(publishedNameRepository.resolvePublishedName(SOME_NAME.id)).is(SOME_NAME);
		});
	});

	describe('doesPublishedNameExist()', () => {
		it('returns true for an existing entry', () => {
			makeSure(publishedNameRepository.doesPublishedNameExist(SOME_NAME.id)).isTrue();
		});

		it('returns false for a missing entry', () => {
			makeSure(publishedNameRepository.doesPublishedNameExist(INVALID_PUBLISHED_NAME_ID)).isFalse();
		});
	});

	describe('getPublishedNamesByPlayer()', () => {
		it('returns the entries owned by a player ordered by slot', () => {
			const secondName = addMockPublishedName(db, { player: SOME_PLAYER, name: 'Second', slotNumber: 2 });
			const publishedNames = publishedNameRepository.getPublishedNamesByPlayer(SOME_PLAYER.id);
			makeSure(publishedNames).is([SOME_NAME, secondName]);
		});

		it('returns an empty array for a player with no entries', () => {
			const otherPlayer = addMockPlayer(db);
			makeSure(publishedNameRepository.getPublishedNamesByPlayer(otherPlayer.id)).is([]);
		});
	});

	describe('getNumPublishedNamesByPlayer()', () => {
		it('counts a player\'s entries', () => {
			addMockPublishedName(db, { player: SOME_PLAYER, name: 'Second', slotNumber: 2 });
			makeSure(publishedNameRepository.getNumPublishedNamesByPlayer(SOME_PLAYER.id)).is(2);
		});

		it('returns 0 for a player with no entries', () => {
			const otherPlayer = addMockPlayer(db);
			makeSure(publishedNameRepository.getNumPublishedNamesByPlayer(otherPlayer.id)).is(0);
		});
	});

	describe('addPublishedName()', () => {
		it('inserts a published name into the given published name slot', () => {
			const player = addMockPlayer(db);
			const publishedName = publishedNameRepository.addPublishedName({
				playerID: player.id,
				name: 'A New Name',
				slotNumber: 1,
			});

			makeSure(publishedName.playerID).is(player.id);
			makeSure(publishedName.name).is('A New Name');
			makeSure(publishedName.slotNumber).is(1);
			makeSure(publishedNameRepository.getPublishedNameByID(publishedName.id)).is(publishedName);
		});
	});

	describe('removePublishedName()', () => {
		it('removes an entry by ID', () => {
			publishedNameRepository.removePublishedName(SOME_NAME.id);
			makeSure(publishedNameRepository.getPublishedNameByID(SOME_NAME.id)).isNull();
		});

		it('throws if the entry does not exist', () => {
			makeSure(() =>
				publishedNameRepository.removePublishedName(INVALID_PUBLISHED_NAME_ID)
			).throws(PublishedNameNotFoundError);
		});

		it('cascade-deletes any vote that referenced the removed entry', () => {
			addMockVote(db, {
				voter: 'some-voter-id',
				votedFirstPublishedName: SOME_NAME.id,
			});

			publishedNameRepository.removePublishedName(SOME_NAME.id);

			const remainingVote = db.getRow('SELECT * FROM vote WHERE voterID = ?', 'some-voter-id');
			makeSure(remainingVote).is(undefined);
		});
	});

	describe('removePublishedNamesByPlayer()', () => {
		it('removes all entries owned by a player', () => {
			addMockPublishedName(db, { player: SOME_PLAYER, name: 'Second', slotNumber: 2 });
			publishedNameRepository.removePublishedNamesByPlayer(SOME_PLAYER.id);
			makeSure(publishedNameRepository.getPublishedNamesByPlayer(SOME_PLAYER.id)).is([]);
		});
	});

	describe('removePublishedNames()', () => {
		it('clears every entry', () => {
			publishedNameRepository.removePublishedNames();
			makeSure(publishedNameRepository.getPublishedNames()).is([]);
		});
	});
});
