import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID, INVALID_TIP_KEY } from "../constants/test.constants";
import { Tips } from "../constants/tips.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { addMockTip } from "../mocks/mock-data/mock-tips";
import { Player } from "../types/player.types";
import { PlayerNotFoundError, TipAlreadyExistsError, TipNotFoundError } from "../utilities/error.utility";
import { TipRepository } from "./tip.repository";

describe('TipRepository', () => {
	let tipRepository: TipRepository;
	let db: DatabaseQuerier;

	beforeEach(() => {
		tipRepository = TipRepository.asMock();
		db = tipRepository.db;
	});

	describe('getTips()', () => {
		it('returns an array of all the synced tips', () => {
			const tips = tipRepository.getTips();

			makeSure(tips).isAnArray();
			makeSure(tips).isNotEmpty();
			makeSure(tips).haveProperties('key', 'message');
		});
	});

	describe('getTip()', () => {
		it('returns the tip with the given key', () => {
			const tip = tipRepository.getTip(Tips.HOW_TO_BUY_MYSTERY_BOX.key);

			makeSure(tip).hasProperty('key', Tips.HOW_TO_BUY_MYSTERY_BOX.key);
			makeSure(tip).hasProperty('message');
		});

		it('throws a TipNotFoundError when the tip does not exist', () => {
			makeSure(() => tipRepository.getTip(INVALID_TIP_KEY)).throws(TipNotFoundError);
		});
	});

	describe('doesTipExist()', () => {
		it('returns true for a synced tip', () => {
			makeSure(tipRepository.doesTipExist(Tips.HOW_TO_PUBLISH_NAME.key)).isTrue();
		});

		it('returns false for a tip that does not exist', () => {
			makeSure(tipRepository.doesTipExist(INVALID_TIP_KEY)).isFalse();
		});
	});

	describe('resolveKey()', () => {
		it('resolves a key string to itself', () => {
			makeSure(tipRepository.resolveKey(Tips.HOW_TO_TRADE.key)).is(Tips.HOW_TO_TRADE.key);
		});

		it('resolves an object with a key to the key', () => {
			makeSure(tipRepository.resolveKey({ key: Tips.HOW_TO_TRADE.key })).is(Tips.HOW_TO_TRADE.key);
		});

		it('resolves a full tip object to its key', () => {
			const tip = tipRepository.getTip(Tips.HOW_TO_TRADE.key);
			makeSure(tipRepository.resolveKey(tip)).is(Tips.HOW_TO_TRADE.key);
		});
	});

	describe('resolveTip()', () => {
		it('resolves a key to the full tip object', () => {
			const tip = tipRepository.resolveTip(Tips.HOW_TO_SEE_PERKS.key);
			makeSure(tip).hasProperty('key', Tips.HOW_TO_SEE_PERKS.key);
			makeSure(tip).hasProperty('message');
		});
	});

	describe('addTip()', () => {
		it('adds a new tip to the database', () => {
			const tip = tipRepository.addTip({ key: 'someNewTip', message: 'Some new tip message.' });

			makeSure(tip).hasProperty('key', 'someNewTip');
			makeSure(tip).hasProperty('message', 'Some new tip message.');

			const retrievedTip = tipRepository.getTip('someNewTip');
			makeSure(retrievedTip).hasProperty('key', 'someNewTip');
			makeSure(retrievedTip).hasProperty('message', 'Some new tip message.');
		});

		it('throws a TipAlreadyExistsError when a tip with the given key already exists', () => {
			addMockTip(db, { key: 'duplicateTip' });
			makeSure(() => tipRepository.addTip({ key: 'duplicateTip', message: 'x' })).throws(TipAlreadyExistsError);
		});
	});

	describe('updateTip()', () => {
		it('updates the message of an existing tip', () => {
			addMockTip(db, { key: 'updatableTip', message: 'Old message.' });

			const updatedTip = tipRepository.updateTip({ key: 'updatableTip', message: 'New message.' });

			makeSure(updatedTip).hasProperty('key', 'updatableTip');
			makeSure(updatedTip).hasProperty('message', 'New message.');

			const retrievedTip = tipRepository.getTip('updatableTip');
			makeSure(retrievedTip).hasProperty('message', 'New message.');
		});

		it('throws a TipNotFoundError when the tip does not exist', () => {
			makeSure(() => tipRepository.updateTip({ key: INVALID_TIP_KEY, message: 'x' })).throws(TipNotFoundError);
		});
	});

	describe('removeTip()', () => {
		it('removes an existing tip', () => {
			addMockTip(db, { key: 'removableTip' });

			tipRepository.removeTip('removableTip');

			makeSure(tipRepository.doesTipExist('removableTip')).isFalse();
		});

		it('throws a TipNotFoundError when the tip does not exist', () => {
			makeSure(() => tipRepository.removeTip(INVALID_TIP_KEY)).throws(TipNotFoundError);
		});
	});

	describe('getViewCount()', () => {
		let SOME_PLAYER: Player;

		beforeEach(() => {
			SOME_PLAYER = addMockPlayer(db);
		});

		it('returns 0 for a tip the player has never been shown', () => {
			makeSure(tipRepository.getViewCount(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key)).is(0);
		});

		it('returns the number of times the tip has been shown', () => {
			tipRepository.incrementViewCount(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key);
			tipRepository.incrementViewCount(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key);

			makeSure(tipRepository.getViewCount(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key)).is(2);
		});
	});

	describe('incrementViewCount()', () => {
		it('throws a PlayerNotFoundError when the player does not exist', () => {
			makeSure(() =>
				tipRepository.incrementViewCount(INVALID_PLAYER_ID, Tips.HOW_TO_BUY_MYSTERY_BOX.key)
			).throws(PlayerNotFoundError);
		});
	});
});
