import { makeSure } from "../../../utilities/jest/jest-utils";
import { MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER, PUBLISHED_NAME_SLOT_COSTS } from "../constants/publish-name.constants";
import { MAX_NAME_LENGTH } from "../constants/naming.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { NamesmithEvents } from "../event-listeners/namesmith-events";
import { addMockPlayer, forcePlayerToHaveInventory } from "../mocks/mock-data/mock-players";
import { addMockPublishedName } from "../mocks/mock-data/mock-published-names";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { Player } from "../types/player.types";
import { AllPublishedNameSlotsUsedError, NameTooLongError, NotEnoughTokensError } from "../utilities/error.utility";
import { PublishedNameService } from "./published-name.service";
import { PlayerService } from "./player.service";

describe('PublishedNameService', () => {
	let db: DatabaseQuerier;
	let publishedNameService: PublishedNameService;
	let playerService: PlayerService;

	let NAMED_PLAYER: Player;
	let OTHER_NAMED_PLAYER: Player;

	beforeEach(() => {
		({ db, publishedNameService, playerService } = setupMockNamesmith());

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
			forcePlayerToHaveInventory(NAMED_PLAYER.id, 'First');
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'First');

			forcePlayerToHaveInventory(NAMED_PLAYER.id, 'Second');
			const second = publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'Second');
			makeSure(second!.slotNumber).is(2);
			makeSure(publishedNameService.getNumPublishedNamesOfPlayer(NAMED_PLAYER.id)).is(2);
		});

		it('reuses the lowest free slot after an entry is unpublished', () => {
			forcePlayerToHaveInventory(NAMED_PLAYER.id, 'First');
			const first = publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'First');

			forcePlayerToHaveInventory(NAMED_PLAYER.id, 'Second');
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'Second');
			publishedNameService.unpublishName(first!.id);

			forcePlayerToHaveInventory(NAMED_PLAYER.id, 'Third');
			const republished = publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'Third');
			makeSure(republished!.slotNumber).is(1);
		});

		it('throws AllPublishedNameSlotsUsedError once all slots are filled', () => {
			for (let slot = 1; slot <= MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER; slot++) {
				forcePlayerToHaveInventory(NAMED_PLAYER.id, `Name ${slot}`);
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
			forcePlayerToHaveInventory(NAMED_PLAYER.id, 'Eventful');
			const triggerEvent = jest.spyOn(NamesmithEvents.PublishName, 'triggerEvent');
			const publishedName = publishedNameService.publishNameForPlayer(NAMED_PLAYER.id, 'Eventful');

			expect(triggerEvent).toHaveBeenCalledTimes(1);
			expect(triggerEvent.mock.calls[0][0].publishedName).toEqual(publishedName);
		});

		it('removes the published name\'s characters from inventory and empties the current name', () => {
			publishedNameService.publishNameForPlayer(NAMED_PLAYER.id);

			makeSure(playerService.getInventory(NAMED_PLAYER.id)).is('');
			makeSure(playerService.getCurrentName(NAMED_PLAYER.id)).is('');
		});

		it('only removes the published name\'s characters from inventory, keeping unrelated characters', () => {
			const player = addMockPlayer(db, { currentName: 'ab', inventory: 'aaab' });

			publishedNameService.publishNameForPlayer(player.id);

			makeSure(playerService.getInventory(player.id)).is('aa');
			makeSure(playerService.getCurrentName(player.id)).is('');
		});
	});

	describe('forceSetPublishedNameInSlot()', () => {
		it('inserts into an empty slot without disturbing other slots', () => {
			addMockPublishedName(db, { player: NAMED_PLAYER, name: 'First', slotNumber: 1 });

			const forced = publishedNameService.forceSetPublishedNameInSlot(NAMED_PLAYER.id, 'Forced', 3);

			makeSure(forced.slotNumber).is(3);
			makeSure(publishedNameService.getNumPublishedNamesOfPlayer(NAMED_PLAYER.id)).is(2);
			makeSure(publishedNameService.getPublishedNamesOfPlayer(NAMED_PLAYER.id)[0].name).is('First');
		});

		it('overwrites whatever previously occupied the target slot', () => {
			addMockPublishedName(db, { player: NAMED_PLAYER, name: 'First', slotNumber: 1 });
			addMockPublishedName(db, { player: NAMED_PLAYER, name: 'Second', slotNumber: 2 });

			publishedNameService.forceSetPublishedNameInSlot(NAMED_PLAYER.id, 'Overwritten', 2);

			makeSure(publishedNameService.getNumPublishedNamesOfPlayer(NAMED_PLAYER.id)).is(2);
			const names = publishedNameService.getPublishedNamesOfPlayer(NAMED_PLAYER.id);
			makeSure(names.find(publishedName => publishedName.slotNumber === 2)!.name).is('Overwritten');
		});

		it('triggers the PublishName event with no tokens spent', () => {
			const triggerEvent = jest.spyOn(NamesmithEvents.PublishName, 'triggerEvent');
			publishedNameService.forceSetPublishedNameInSlot(NAMED_PLAYER.id, 'Forced', 1);

			expect(triggerEvent).toHaveBeenCalledTimes(1);
			expect(triggerEvent.mock.calls[0][0].tokensSpent).toBe(0);
		});

		it('does not touch the player\'s inventory or current name', () => {
			const inventoryBefore = playerService.getInventory(NAMED_PLAYER.id);
			const currentNameBefore = playerService.getCurrentName(NAMED_PLAYER.id);

			publishedNameService.forceSetPublishedNameInSlot(NAMED_PLAYER.id, 'Forced', 1);

			makeSure(playerService.getInventory(NAMED_PLAYER.id)).is(inventoryBefore);
			makeSure(playerService.getCurrentName(NAMED_PLAYER.id)).is(currentNameBefore);
		});
	});

	describe('getLowestAvailableSlotNumberOfPlayer()', () => {
		it('returns 1 for a player with no entries', () => {
			makeSure(publishedNameService.getLowestAvailableSlotNumberOfPlayer(NAMED_PLAYER.id)).is(1);
		});

		it('returns null when all slots are filled', () => {
			for (let slot = 1; slot <= MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER; slot++) {
				addMockPublishedName(db, { player: NAMED_PLAYER, name: `Name ${slot}`, slotNumber: slot });
			}
			makeSure(publishedNameService.getLowestAvailableSlotNumberOfPlayer(NAMED_PLAYER.id)).isNull();
		});
	});

	describe('getAllPublishedNameStrings()', () => {
		it('returns the names of every entry across all players', () => {
			addMockPublishedName(db, { player: NAMED_PLAYER, name: 'One', slotNumber: 1 });
			addMockPublishedName(db, { player: OTHER_NAMED_PLAYER, name: 'Two', slotNumber: 1 });

			const names = publishedNameService.getAllPublishedNameStrings();
			makeSure(names).contains('One');
			makeSure(names).contains('Two');
		});
	});

	describe('autoPublishCurrentNames()', () => {
		it('publishes the current name of players who have not published', () => {
			publishedNameService.autoPublishCurrentNames();

			makeSure(publishedNameService.getPublishedNamesOfPlayer(NAMED_PLAYER.id)[0].name).is('Namey');
			makeSure(publishedNameService.getPublishedNamesOfPlayer(OTHER_NAMED_PLAYER.id)[0].name).is('Othery');
		});

		it('does not overwrite players who already published', () => {
			addMockPublishedName(db, { player: NAMED_PLAYER, name: 'Chosen', slotNumber: 1 });
			publishedNameService.autoPublishCurrentNames();
			makeSure(publishedNameService.getPublishedNamesOfPlayer(NAMED_PLAYER.id)[0].name).is('Chosen');
		});
	});

	describe('getCostOfNextPublishedNameForPlayer()', () => {
		it('is free for the first published name', () => {
			makeSure(publishedNameService.getCostOfNextPublishedNameForPlayer(NAMED_PLAYER.id)).is(0);
		});

		it('costs the slot price when extending to a new published name slot', () => {
			addMockPublishedName(db, { player: NAMED_PLAYER, name: 'First', slotNumber: 1 });
			makeSure(publishedNameService.getCostOfNextPublishedNameForPlayer(NAMED_PLAYER.id)).is(PUBLISHED_NAME_SLOT_COSTS[1]);
		});

		it('is free when re-filling a gap in slots the player has already paid for', () => {
			addMockPublishedName(db, { player: NAMED_PLAYER, name: 'First', slotNumber: 1 });
			const second = addMockPublishedName(db, { player: NAMED_PLAYER, name: 'Second', slotNumber: 2 });
			addMockPublishedName(db, { player: NAMED_PLAYER, name: 'Third', slotNumber: 3 });
			publishedNameService.unpublishName(second.id);

			makeSure(publishedNameService.getCostOfNextPublishedNameForPlayer(NAMED_PLAYER.id)).is(0);
		});

		it('is null when the player is at the published name limit', () => {
			for (let slotNumber = 1; slotNumber <= MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER; slotNumber++) {
				addMockPublishedName(db, { player: NAMED_PLAYER, name: `Name ${slotNumber}`, slotNumber });
			}
			makeSure(publishedNameService.getCostOfNextPublishedNameForPlayer(NAMED_PLAYER.id)).isNull();
		});
	});

	describe('publishPaidPublishedNameForPlayer()', () => {
		it('deducts exactly the slot cost and reports the tokens spent', () => {
			const richPlayer = addMockPlayer(db, { currentName: 'Rich', tokens: 1000 });
			forcePlayerToHaveInventory(richPlayer.id, 'First');

			const first = publishedNameService.publishPaidPublishedNameForPlayer({ player: richPlayer.id, name: 'First' });
			makeSure(first.tokensSpent).is(0);

			forcePlayerToHaveInventory(richPlayer.id, 'Second');
			const second = publishedNameService.publishPaidPublishedNameForPlayer({ player: richPlayer.id, name: 'Second' });
			makeSure(second.tokensSpent).is(PUBLISHED_NAME_SLOT_COSTS[1]);
			makeSure(publishedNameService.playerRepository.getTokens(richPlayer.id)).is(1000 - PUBLISHED_NAME_SLOT_COSTS[1]);
		});

		it('does not charge again when re-filling an already-paid slot', () => {
			const richPlayer = addMockPlayer(db, { currentName: 'Rich', tokens: 1000 });
			forcePlayerToHaveInventory(richPlayer.id, 'First');
			publishedNameService.publishPaidPublishedNameForPlayer({ player: richPlayer.id, name: 'First' });

			forcePlayerToHaveInventory(richPlayer.id, 'Second');
			const second = publishedNameService.publishPaidPublishedNameForPlayer({ player: richPlayer.id, name: 'Second' });

			forcePlayerToHaveInventory(richPlayer.id, 'Third');
			publishedNameService.publishPaidPublishedNameForPlayer({ player: richPlayer.id, name: 'Third' });
			const tokensAfterSetup = publishedNameService.playerRepository.getTokens(richPlayer.id);

			publishedNameService.unpublishName(second.publishedName.id);
			forcePlayerToHaveInventory(richPlayer.id, 'Second Again');
			const refill = publishedNameService.publishPaidPublishedNameForPlayer({ player: richPlayer.id, name: 'Second Again' });

			makeSure(refill.tokensSpent).is(0);
			makeSure(publishedNameService.playerRepository.getTokens(richPlayer.id)).is(tokensAfterSetup);
		});

		it('throws NotEnoughTokensError and leaves tokens and published names unchanged when the player cannot afford it', () => {
			const poorPlayer = addMockPlayer(db, { currentName: 'Poor', tokens: PUBLISHED_NAME_SLOT_COSTS[1] - 1 });
			forcePlayerToHaveInventory(poorPlayer.id, 'First');

			publishedNameService.publishPaidPublishedNameForPlayer({ player: poorPlayer.id, name: 'First' });

			makeSure(() =>
				publishedNameService.publishPaidPublishedNameForPlayer({ player: poorPlayer.id, name: 'Second' })
			).throws(NotEnoughTokensError);

			makeSure(publishedNameService.playerRepository.getTokens(poorPlayer.id)).is(PUBLISHED_NAME_SLOT_COSTS[1] - 1);
			makeSure(publishedNameService.getNumPublishedNamesOfPlayer(poorPlayer.id)).is(1);
		});

		it('removes the published name\'s characters from inventory and empties the current name', () => {
			const richPlayer = addMockPlayer(db, { currentName: 'Rich', tokens: 1000 });

			publishedNameService.publishPaidPublishedNameForPlayer({ player: richPlayer.id, name: richPlayer.currentName });

			makeSure(playerService.getInventory(richPlayer.id)).is('');
			makeSure(playerService.getCurrentName(richPlayer.id)).is('');
		});
	});

	describe('reset()', () => {
		it('clears every published name entry', () => {
			addMockPublishedName(db, { player: NAMED_PLAYER, name: 'One', slotNumber: 1 });
			publishedNameService.reset();
			makeSure(publishedNameService.getPublishedNames()).is([]);
		});
	});
});
