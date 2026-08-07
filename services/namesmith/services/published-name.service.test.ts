import { makeSure } from "../../../utilities/jest/jest-utils";
import { MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER, PUBLISHED_NAME_SLOT_COSTS } from "../constants/name-publishing.constants";
import { MAX_NAME_LENGTH } from "../constants/player.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { NamesmithEvents } from "../event-listeners/namesmith-events";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { Player } from "../types/player.types";
import { AllPublishedNameSlotsUsedError, NameTooLongError, NotEnoughTokensError } from "../utilities/error.utility";
import { PublishedNameService } from "./published-name.service";

describe('PublishedNameService', () => {
	let db: DatabaseQuerier;
	let publishedNameService: PublishedNameService;

	let NAMED_PLAYER: Player;
	let OTHER_NAMED_PLAYER: Player;

	beforeEach(() => {
		publishedNameService = PublishedNameService.asMock();
		db = publishedNameService.publishedNameRepository.db;

		NAMED_PLAYER = addMockPlayer(db, { currentName: 'Namey' });
		OTHER_NAMED_PLAYER = addMockPlayer(db, { currentName: 'Othery' });
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('publishName()', () => {
		it('publishes the current name into slot 1 for the first publish', () => {
			const publishedName = publishedNameService.publishNameForPlayer(NAMED_PLAYER.id);
			makeSure(publishedName!.name).is('Namey');
			makeSure(publishedName!.slotNumber).is(1);
		});

		it('publishes a second name into slot 2', () => {
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'First');
			const second = publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'Second');
			makeSure(second!.slotNumber).is(2);
			makeSure(publishedNameService.getNumPublishedNamesOfPlayer(NAMED_PLAYER.id)).is(2);
		});

		it('reuses the lowest free slot after an entry is unpublished', () => {
			const first = publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'First');
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'Second');
			publishedNameService.unpublishName(first!.id);

			const republished = publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'Third');
			makeSure(republished!.slotNumber).is(1);
		});

		it('throws AllPublishedNameSlotsUsedError once all slots are filled', () => {
			for (let slot = 1; slot <= MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER; slot++) {
				publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, `Name ${slot}`);
			}

			makeSure(() =>
				publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'One Too Many')
			).throws(AllPublishedNameSlotsUsedError);
		});

		it('throws NameTooLongError if the name exceeds the maximum length', () => {
			makeSure(() =>
				publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'a'.repeat(MAX_NAME_LENGTH + 1))
			).throws(NameTooLongError);
		});

		it('does nothing and returns null when there is no name to publish', () => {
			const emptyPlayer = addMockPlayer(db, { currentName: '' });
			const result = publishedNameService.publishNameForPlayer(emptyPlayer.id);
			makeSure(result).isNull();
			makeSure(publishedNameService.doesPlayerHaveAPublishedName(emptyPlayer.id)).isFalse();
		});

		it('triggers the PublishName event with the created entry', () => {
			const triggerEvent = jest.spyOn(NamesmithEvents.PublishName, 'triggerEvent');
			const publishedName = publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'Eventful');

			expect(triggerEvent).toHaveBeenCalledTimes(1);
			expect(triggerEvent.mock.calls[0][0].publishedName).toEqual(publishedName);
		});
	});

	describe('replaceSolePublishedName()', () => {
		it('replaces all existing entries with a single slot 1 entry', () => {
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'First');
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'Second');

			const replacement = publishedNameService.replaceSolePublishedNameOfPlayer(NAMED_PLAYER.id, 'Only');

			makeSure(replacement!.slotNumber).is(1);
			makeSure(publishedNameService.getNumPublishedNamesOfPlayer(NAMED_PLAYER.id)).is(1);
			makeSure(publishedNameService.getSolePublishedNameStringOfPlayer(NAMED_PLAYER.id)).is('Only');
		});
	});

	describe('getSolePublishedNameStringOfPlayer()', () => {
		it('returns the first entry name', () => {
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'First');
			makeSure(publishedNameService.getSolePublishedNameStringOfPlayer(NAMED_PLAYER.id)).is('First');
		});

		it('returns null when the player has no entries', () => {
			makeSure(publishedNameService.getSolePublishedNameStringOfPlayer(NAMED_PLAYER.id)).isNull();
		});
	});

	describe('doesSolePublishedNameOfPlayerContain()', () => {
		it('returns true when the first entry contains the substring, ignoring case', () => {
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'Joseph');
			makeSure(publishedNameService.doesSolePublishedNameOfPlayerContain(NAMED_PLAYER.id, 'sep')).isTrue();
		});

		it('returns false when the player has no entries', () => {
			makeSure(publishedNameService.doesSolePublishedNameOfPlayerContain(NAMED_PLAYER.id, 'x')).isFalse();
		});
	});

	describe('getLowestAvailableSlotNumberOfPlayer()', () => {
		it('returns 1 for a player with no entries', () => {
			makeSure(publishedNameService.getLowestAvailableSlotNumberOfPlayer(NAMED_PLAYER.id)).is(1);
		});

		it('returns null when all slots are filled', () => {
			for (let slot = 1; slot <= MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER; slot++) {
				publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, `Name ${slot}`);
			}
			makeSure(publishedNameService.getLowestAvailableSlotNumberOfPlayer(NAMED_PLAYER.id)).isNull();
		});
	});

	describe('getAllPublishedNameStrings()', () => {
		it('returns the names of every entry across all players', () => {
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'One');
			publishedNameService.publishNameForPlayer(OTHER_NAMED_PLAYER.id, 'Two');

			const names = publishedNameService.getAllPublishedNameStrings();
			makeSure(names).contains('One');
			makeSure(names).contains('Two');
		});
	});

	describe('autoPublishCurrentNames()', () => {
		it('publishes the current name of players who have not published', () => {
			publishedNameService.autoPublishCurrentNames();

			makeSure(publishedNameService.getSolePublishedNameStringOfPlayer(NAMED_PLAYER.id)).is('Namey');
			makeSure(publishedNameService.getSolePublishedNameStringOfPlayer(OTHER_NAMED_PLAYER.id)).is('Othery');
		});

		it('does not overwrite players who already published', () => {
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'Chosen');
			publishedNameService.autoPublishCurrentNames();
			makeSure(publishedNameService.getSolePublishedNameStringOfPlayer(NAMED_PLAYER.id)).is('Chosen');
		});
	});

	describe('getCostOfNextPublishedNameForPlayer()', () => {
		it('is free for the first published name', () => {
			makeSure(publishedNameService.getCostOfNextPublishedNameForPlayer(NAMED_PLAYER.id)).is(0);
		});

		it('costs the slot price when extending to a new published name slot', () => {
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'First');
			makeSure(publishedNameService.getCostOfNextPublishedNameForPlayer(NAMED_PLAYER.id)).is(PUBLISHED_NAME_SLOT_COSTS[1]);
		});

		it('is free when re-filling a gap in slots the player has already paid for', () => {
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'First');
			const second = publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'Second');
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'Third');
			publishedNameService.unpublishName(second!.id);

			makeSure(publishedNameService.getCostOfNextPublishedNameForPlayer(NAMED_PLAYER.id)).is(0);
		});

		it('is null when the player is at the published name limit', () => {
			for (let slotNumber = 1; slotNumber <= MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER; slotNumber++) {
				publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, `Name ${slotNumber}`);
			}
			makeSure(publishedNameService.getCostOfNextPublishedNameForPlayer(NAMED_PLAYER.id)).isNull();
		});
	});

	describe('publishPaidPublishedNameForPlayer()', () => {
		it('deducts exactly the slot cost and reports the tokens spent', () => {
			const richPlayer = addMockPlayer(db, { currentName: 'Rich', tokens: 1000 });

			const first = publishedNameService.publishPaidPublishedNameForPlayer({ player: richPlayer.id, name: 'First' });
			makeSure(first.tokensSpent).is(0);

			const second = publishedNameService.publishPaidPublishedNameForPlayer({ player: richPlayer.id, name: 'Second' });
			makeSure(second.tokensSpent).is(PUBLISHED_NAME_SLOT_COSTS[1]);
			makeSure(publishedNameService.playerRepository.getTokens(richPlayer.id)).is(1000 - PUBLISHED_NAME_SLOT_COSTS[1]);
		});

		it('does not charge again when re-filling an already-paid slot', () => {
			const richPlayer = addMockPlayer(db, { currentName: 'Rich', tokens: 1000 });

			publishedNameService.publishPaidPublishedNameForPlayer({ player: richPlayer.id, name: 'First' });
			const second = publishedNameService.publishPaidPublishedNameForPlayer({ player: richPlayer.id, name: 'Second' });
			publishedNameService.publishPaidPublishedNameForPlayer({ player: richPlayer.id, name: 'Third' });
			const tokensAfterSetup = publishedNameService.playerRepository.getTokens(richPlayer.id);

			publishedNameService.unpublishName(second.publishedName.id);
			const refill = publishedNameService.publishPaidPublishedNameForPlayer({ player: richPlayer.id, name: 'Second Again' });

			makeSure(refill.tokensSpent).is(0);
			makeSure(publishedNameService.playerRepository.getTokens(richPlayer.id)).is(tokensAfterSetup);
		});

		it('throws NotEnoughTokensError and leaves tokens and published names unchanged when the player cannot afford it', () => {
			const poorPlayer = addMockPlayer(db, { currentName: 'Poor', tokens: PUBLISHED_NAME_SLOT_COSTS[1] - 1 });

			publishedNameService.publishPaidPublishedNameForPlayer({ player: poorPlayer.id, name: 'First' });

			makeSure(() =>
				publishedNameService.publishPaidPublishedNameForPlayer({ player: poorPlayer.id, name: 'Second' })
			).throws(NotEnoughTokensError);

			makeSure(publishedNameService.playerRepository.getTokens(poorPlayer.id)).is(PUBLISHED_NAME_SLOT_COSTS[1] - 1);
			makeSure(publishedNameService.getNumPublishedNamesOfPlayer(poorPlayer.id)).is(1);
		});
	});

	describe('finalizeName()', () => {
		it('sets the current name to the first published name', () => {
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'Final');
			publishedNameService.finalizeNameOfPlayer(NAMED_PLAYER.id);
			makeSure(publishedNameService.playerRepository.getCurrentName(NAMED_PLAYER.id)).is('Final');
		});

		it('does nothing when the player has no published name', () => {
			publishedNameService.finalizeNameOfPlayer(NAMED_PLAYER.id);
			makeSure(publishedNameService.playerRepository.getCurrentName(NAMED_PLAYER.id)).is('Namey');
		});
	});

	describe('reset()', () => {
		it('clears every published name entry', () => {
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'One');
			publishedNameService.reset();
			makeSure(publishedNameService.getPublishedNames()).is([]);
		});
	});
});
