import { makeSure } from "../../../utilities/jest/jest-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { Tips, MAX_TIP_VIEW_COUNT } from "../constants/tips.constants";
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
});
