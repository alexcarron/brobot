import { makeSure } from "../../../../utilities/jest/jest-utils";
import { Tips } from "../../constants/tips.constants";
import { DatabaseQuerier } from "../../database/database-querier";
import { Player } from "../../types/player.types";
import { setupMockNamesmith } from "../mock-setup";
import { addMockPlayer } from "./mock-players";
import { addMockTip, forcePlayerToSeeTip } from "./mock-tips";

describe('mock-tips', () => {
	let db: DatabaseQuerier;

	let SOME_PLAYER: Player;

	beforeEach(() => {
		({ db } = setupMockNamesmith());
		SOME_PLAYER = addMockPlayer(db);
	});

	describe('addMockTip', () => {
		it('works with no tip definition', () => {
			const tip = addMockTip(db);

			makeSure(tip).hasProperty('key');
			makeSure(tip).hasProperty('message', '');
		});

		it('works with all tip definition properties', () => {
			const tip = addMockTip(db, {
				key: 'someTip',
				message: 'Some tip message.',
			});

			makeSure(tip).hasProperty('key', 'someTip');
			makeSure(tip).hasProperty('message', 'Some tip message.');
		});
	});

	describe('forcePlayerToSeeTip', () => {
		it('records a tip as seen once by default and returns the view count', () => {
			const viewCount = forcePlayerToSeeTip(SOME_PLAYER, Tips.HOW_TO_BUY_MYSTERY_BOX.key);

			makeSure(viewCount).is(1);
		});

		it('records a tip as seen the given number of times', () => {
			const viewCount = forcePlayerToSeeTip(SOME_PLAYER, Tips.HOW_TO_PUBLISH_NAME.key, 3);

			makeSure(viewCount).is(3);
		});

		it('accepts a full tip object as the resolvable', () => {
			const viewCount = forcePlayerToSeeTip(SOME_PLAYER, Tips.HOW_TO_TRADE, 2);

			makeSure(viewCount).is(2);
		});
	});
});
