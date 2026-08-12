import { makeSure } from "../../../utilities/jest/jest-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { Tips, MAX_TIP_VIEW_COUNT } from "../constants/tip.constants";
import { Player } from "../types/player.types";
import { TipService } from "./tip.service";

describe('TipService', () => {
	let db: DatabaseQuerier;
	let tipService: TipService;

	let SOME_PLAYER: Player;

	beforeEach(() => {
		tipService = TipService.asMock();
		db = tipService.tipRepository.db;

		SOME_PLAYER = addMockPlayer(db);
	});

	describe('shouldPlayerSeeTip()', () => {
		it('returns true for a tip the player has never been shown', () => {
			makeSure(tipService.shouldPlayerSeeTip(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key)).is(true);
		});

		it('returns true while the tip has been shown fewer than the maximum allowed times', () => {
			for (let i = 0; i < MAX_TIP_VIEW_COUNT - 1; i++) {
				tipService.incrementTipViewCountForPlayer(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key);
			}

			makeSure(tipService.shouldPlayerSeeTip(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key)).is(true);
		});

		it('returns false once the tip has been shown the maximum allowed number of times', () => {
			for (let i = 0; i < MAX_TIP_VIEW_COUNT; i++) {
				tipService.incrementTipViewCountForPlayer(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key);
			}

			makeSure(tipService.shouldPlayerSeeTip(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key)).is(false);
		});

		it('tracks each tip independently for the same player', () => {
			for (let i = 0; i < MAX_TIP_VIEW_COUNT; i++) {
				tipService.incrementTipViewCountForPlayer(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key);
			}

			makeSure(tipService.shouldPlayerSeeTip(SOME_PLAYER.id, Tips.HOW_TO_PUBLISH_NAME.key)).is(true);
		});
	});

	describe('incrementTipViewCountForPlayer()', () => {
		it('increments the view count for a player and tip', () => {
			tipService.incrementTipViewCountForPlayer(SOME_PLAYER.id, Tips.HOW_TO_PUBLISH_NAME.key);

			makeSure(tipService.tipRepository.getViewCount(SOME_PLAYER.id, Tips.HOW_TO_PUBLISH_NAME.key)).is(1);
		});

		it('accumulates across multiple calls', () => {
			tipService.incrementTipViewCountForPlayer(SOME_PLAYER.id, Tips.HOW_TO_PUBLISH_NAME.key);
			tipService.incrementTipViewCountForPlayer(SOME_PLAYER.id, Tips.HOW_TO_PUBLISH_NAME.key);

			makeSure(tipService.tipRepository.getViewCount(SOME_PLAYER.id, Tips.HOW_TO_PUBLISH_NAME.key)).is(2);
		});
	});

	describe('resolvable support', () => {
		it('accepts an object-form player resolvable and tip resolvable', () => {
			tipService.incrementTipViewCountForPlayer({ id: SOME_PLAYER.id }, { key: Tips.HOW_TO_PUBLISH_NAME.key });

			makeSure(tipService.shouldPlayerSeeTip({ id: SOME_PLAYER.id }, { key: Tips.HOW_TO_PUBLISH_NAME.key })).is(true);
			makeSure(tipService.tipRepository.getViewCount(SOME_PLAYER.id, Tips.HOW_TO_PUBLISH_NAME.key)).is(1);
		});
	});

	describe('getAndViewTipIfPlayerShouldSeeIt()', () => {
		it('returns the tip message and increments the view count when the player should see it', () => {
			const message = tipService.getAndViewTipIfPlayerShouldSeeIt(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key);

			makeSure(message).is(Tips.HOW_TO_BUY_MYSTERY_BOX.message);
			makeSure(tipService.tipRepository.getViewCount(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key)).is(1);
		});

		it('returns null and does not increment the view count once the tip is exhausted', () => {
			for (let i = 0; i < MAX_TIP_VIEW_COUNT; i++) {
				tipService.incrementTipViewCountForPlayer(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key);
			}

			const message = tipService.getAndViewTipIfPlayerShouldSeeIt(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key);

			makeSure(message).is(null);
			makeSure(tipService.tipRepository.getViewCount(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key)).is(MAX_TIP_VIEW_COUNT);
		});
	});

	describe('getAndViewFirstTipPlayerShouldSee()', () => {
		it('returns the first candidate tip\'s message when it should be shown', () => {
			const message = tipService.getAndViewFirstTipPlayerShouldSee(SOME_PLAYER.id, [
				Tips.HOW_TO_BUY_MYSTERY_BOX.key,
				Tips.HOW_TO_PUBLISH_NAME.key,
			]);

			makeSure(message).is(Tips.HOW_TO_BUY_MYSTERY_BOX.message);
			makeSure(tipService.tipRepository.getViewCount(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key)).is(1);
			makeSure(tipService.tipRepository.getViewCount(SOME_PLAYER.id, Tips.HOW_TO_PUBLISH_NAME.key)).is(0);
		});

		it('falls through to the next candidate once the first is exhausted', () => {
			for (let i = 0; i < MAX_TIP_VIEW_COUNT; i++) {
				tipService.incrementTipViewCountForPlayer(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key);
			}

			const message = tipService.getAndViewFirstTipPlayerShouldSee(SOME_PLAYER.id, [
				Tips.HOW_TO_BUY_MYSTERY_BOX.key,
				Tips.HOW_TO_PUBLISH_NAME.key,
			]);

			makeSure(message).is(Tips.HOW_TO_PUBLISH_NAME.message);
			makeSure(tipService.tipRepository.getViewCount(SOME_PLAYER.id, Tips.HOW_TO_PUBLISH_NAME.key)).is(1);
		});

		it('returns null when every candidate is exhausted', () => {
			for (let i = 0; i < MAX_TIP_VIEW_COUNT; i++) {
				tipService.incrementTipViewCountForPlayer(SOME_PLAYER.id, Tips.HOW_TO_BUY_MYSTERY_BOX.key);
				tipService.incrementTipViewCountForPlayer(SOME_PLAYER.id, Tips.HOW_TO_PUBLISH_NAME.key);
			}

			const message = tipService.getAndViewFirstTipPlayerShouldSee(SOME_PLAYER.id, [
				Tips.HOW_TO_BUY_MYSTERY_BOX.key,
				Tips.HOW_TO_PUBLISH_NAME.key,
			]);

			makeSure(message).is(null);
		});
	});
});
