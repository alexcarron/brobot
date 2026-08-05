jest.mock('cron', () => ({
	CronJob: jest.fn(() => ({
		start: jest.fn(),
		stop: jest.fn(),
	})),
}));

import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerService } from "../services/player.service";
import { RefillReminderService } from "../services/refill-reminder.service";
import { returnIfNotFailure } from "../utilities/workflow.utility";
import { toggleRefillReminders } from "./toggle-refill-reminders.workflow";

describe('toggleRefillReminders()', () => {
	let playerService: PlayerService;
	let refillReminderService: RefillReminderService;
	let db: DatabaseQuerier;

	beforeEach(() => {
		setupMockNamesmith();
		({ playerService, refillReminderService } = getNamesmithServices());
		db = playerService.playerRepository.db;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should enable reminders for a player who has them off', () => {
		const mockPlayer = addMockPlayer(db);

		const result = returnIfNotFailure(toggleRefillReminders({ playerID: mockPlayer.id }));

		expect(result.enabled).toBe(true);
		expect(playerService.hasRefillReminderEnabled(mockPlayer.id)).toBe(true);
	});

	it('should disable reminders for a player who has them on', () => {
		const mockPlayer = addMockPlayer(db);
		playerService.setRefillReminderEnabled(mockPlayer.id, true);

		const result = returnIfNotFailure(toggleRefillReminders({ playerID: mockPlayer.id }));

		expect(result.enabled).toBe(false);
		expect(playerService.hasRefillReminderEnabled(mockPlayer.id)).toBe(false);
	});

	it('should schedule a reminder when enabling for a player still on cooldown', () => {
		const mockPlayer = addMockPlayer(db, { lastClaimedRefillTime: new Date() });
		const scheduleReminder = jest.spyOn(refillReminderService, 'scheduleReminder');

		toggleRefillReminders({ playerID: mockPlayer.id });

		expect(scheduleReminder).toHaveBeenCalledWith(
			mockPlayer.id,
			playerService.getNextAvailableRefillTime(mockPlayer.id)
		);
	});

	it('should not schedule a reminder when enabling for a player who is not on cooldown', () => {
		const mockPlayer = addMockPlayer(db, { lastClaimedRefillTime: null });
		const scheduleReminder = jest.spyOn(refillReminderService, 'scheduleReminder');

		toggleRefillReminders({ playerID: mockPlayer.id });

		expect(scheduleReminder).not.toHaveBeenCalled();
	});

	it('should cancel any scheduled reminder when disabling', () => {
		const mockPlayer = addMockPlayer(db);
		playerService.setRefillReminderEnabled(mockPlayer.id, true);
		const cancelReminder = jest.spyOn(refillReminderService, 'cancelReminder');

		toggleRefillReminders({ playerID: mockPlayer.id });

		expect(cancelReminder).toHaveBeenCalledWith(mockPlayer.id);
	});

	it('should return notAPlayer if the given player is not a valid player', () => {
		const result = toggleRefillReminders({ playerID: INVALID_PLAYER_ID });

		expect(result.isNotAPlayer()).toBe(true);
	});
});
