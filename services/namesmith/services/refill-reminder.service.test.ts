jest.mock('cron', () => ({
	CronJob: jest.fn(() => ({
		start: jest.fn(),
		stop: jest.fn(),
	})),
}));

import { CronJob } from "cron";
import { addHours } from "../../../utilities/date-time-utils";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { getNamesmithServices } from "./get-namesmith-services";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { RefillReminderService } from "./refill-reminder.service";
import { NamesmithEvents } from "../event-listeners/namesmith-events";

describe('RefillReminderService', () => {
	let refillReminderService: RefillReminderService;

	beforeEach(() => {
		setupMockNamesmith();
		refillReminderService = getNamesmithServices().refillReminderService;

		jest.useFakeTimers();
		jest.setSystemTime(new Date('2025-07-12T12:00:00.000Z'));
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.useRealTimers();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should create a new RefillReminderService instance', () => {
			expect(refillReminderService).toBeInstanceOf(RefillReminderService);
		});
	});

	describe('scheduleReminder()', () => {
		it('should schedule a cron job at the given time', () => {
			const { playerService } = getNamesmithServices();
			const mockPlayer = addMockPlayer(playerService.playerRepository.db);
			const remindAt = addHours(new Date(), 2);

			refillReminderService.scheduleReminder(mockPlayer.id, remindAt);

			expect(CronJob).toHaveBeenCalledWith(remindAt, expect.any(Function));
		});

		it('should trigger the RefillReminderDue event for the player when the scheduled task runs', () => {
			const { playerService } = getNamesmithServices();
			const mockPlayer = addMockPlayer(playerService.playerRepository.db);
			const remindAt = addHours(new Date(), 2);

			refillReminderService.scheduleReminder(mockPlayer.id, remindAt);

			const [, scheduledTask] = (CronJob as unknown as jest.Mock).mock.calls[0];
			const triggerEvent = jest.spyOn(NamesmithEvents.RefillReminder, 'triggerEvent');

			scheduledTask();

			expect(triggerEvent).toHaveBeenCalledWith({ playerID: mockPlayer.id });
		});

		it('should replace any reminder already scheduled for the same player', () => {
			const { playerService } = getNamesmithServices();
			const mockPlayer = addMockPlayer(playerService.playerRepository.db);

			refillReminderService.scheduleReminder(mockPlayer.id, addHours(new Date(), 2));
			refillReminderService.scheduleReminder(mockPlayer.id, addHours(new Date(), 3));

			expect(CronJob).toHaveBeenCalledTimes(2);
		});
	});

	describe('cancelReminder()', () => {
		it('should stop the scheduled cron job for the player', () => {
			const { playerService } = getNamesmithServices();
			const mockPlayer = addMockPlayer(playerService.playerRepository.db);

			refillReminderService.scheduleReminder(mockPlayer.id, addHours(new Date(), 2));
			const cronJobInstance = (CronJob as unknown as jest.Mock).mock.results[0].value;

			refillReminderService.cancelReminder(mockPlayer.id);

			expect(cronJobInstance.stop).toHaveBeenCalled();
		});

		it('should not throw if the player has no reminder scheduled', () => {
			const { playerService } = getNamesmithServices();
			const mockPlayer = addMockPlayer(playerService.playerRepository.db);

			expect(() => refillReminderService.cancelReminder(mockPlayer.id)).not.toThrow();
		});
	});

	describe('rescheduleAllPendingReminders()', () => {
		it('should schedule a reminder for a player with reminders enabled who is still on cooldown', () => {
			const { playerService } = getNamesmithServices();
			const mockPlayer = addMockPlayer(playerService.playerRepository.db, {
				lastClaimedRefillTime: new Date(),
			});
			playerService.setRefillReminderEnabled(mockPlayer.id, true);

			refillReminderService.rescheduleAllPendingReminders();

			expect(CronJob).toHaveBeenCalledWith(
				playerService.getNextAvailableRefillTime(mockPlayer.id),
				expect.any(Function)
			);
		});

		it('should not schedule a reminder for a player who is not on cooldown', () => {
			const { playerService } = getNamesmithServices();
			const mockPlayer = addMockPlayer(playerService.playerRepository.db, {
				lastClaimedRefillTime: null,
			});
			playerService.setRefillReminderEnabled(mockPlayer.id, true);

			refillReminderService.rescheduleAllPendingReminders();

			expect(CronJob).not.toHaveBeenCalled();
		});

		it('should not schedule a reminder for a player who does not have reminders enabled', () => {
			const { playerService } = getNamesmithServices();
			addMockPlayer(playerService.playerRepository.db, {
				lastClaimedRefillTime: new Date(),
			});

			refillReminderService.rescheduleAllPendingReminders();

			expect(CronJob).not.toHaveBeenCalled();
		});
	});
});
