jest.mock("../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn(),
}));

import { makeSure } from "../../../utilities/jest/jest-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerService } from "../services/player.service";
import { rearrangeName } from './rearrange-name.workflow';
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { returnIfNotFailure } from "../utilities/workflow.utility";
import { getLatestActivityLog } from "../mocks/mock-data/mock-activity-logs";
import { ActivityTypes } from "../types/activity-log.types";

describe('rearrange-name.workflow', () => {
	let playerService: PlayerService;
	let db: DatabaseQuerier;

	beforeEach(() => {
		setupMockNamesmith();
		const services = getNamesmithServices();
		playerService = services.playerService;
		db = playerService.playerRepository.db;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe('rearrangeName()', () => {
		it('returns notAPlayer if the player is not a player.', () => {
			const result = rearrangeName({player: 'not-a-player-id', newName: 'abc'});

			makeSure(result.isNotAPlayer()).isTrue();
		});

		it('returns hasExtraCharacters if the new name contains characters not in the inventory.', () => {
			const player = addMockPlayer(db, {
				inventory: 'abc',
				currentName: 'abc'
			});

			const result = rearrangeName({player, newName: 'abcd'});

			makeSure(result.isHasExtraCharacters()).isTrue();
		});

		it('changes the player\'s current name and returns the new name and unused characters.', () => {
			const player = addMockPlayer(db, {
				inventory: 'abcd',
				currentName: 'abc'
			});

			const {newName, unusedCharacters} = returnIfNotFailure(
				rearrangeName({player, newName: 'cab'})
			);

			makeSure(newName).is('cab');
			makeSure(unusedCharacters).is(['d']);
			makeSure(playerService.getCurrentName(player)).is('cab');
		});

		it('creates an activity log with accurate metadata.', () => {
			const player = addMockPlayer(db, {
				inventory: 'abcd',
				currentName: 'abc'
			});

			rearrangeName({player, newName: 'cab'});

			const activityLog = getLatestActivityLog(db);
			makeSure(activityLog.player.id).is(player.id);
			makeSure(activityLog.type).is(ActivityTypes.REARRANGE_NAME);
			makeSure(activityLog.nameChangedFrom).is('abc');
			makeSure(activityLog.currentName).is('cab');
		});
	});
});
