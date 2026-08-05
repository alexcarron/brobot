jest.mock('cron', () => ({
	CronJob: jest.fn(() => ({
		start: jest.fn(),
		stop: jest.fn(),
	})),
}));

jest.mock('./logging-utils', () => ({
	logError: jest.fn(),
	logWarning: jest.fn(),
}));

import { CronJob } from "cron";
import { logError, logWarning } from "./logging-utils";
import { addHours, addMinutes } from "./date-time-utils";
import { scheduleRepeatingTask, scheduleTaskAt, scheduleTaskAtEachDate } from "./cron-job-utils";

const getStartedCronJobs = () =>
	(CronJob as unknown as jest.Mock).mock.results.map(result => result.value);

describe('cron-job-utils', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2025-07-12T12:00:00.000Z'));
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.useRealTimers();
	});

	describe('scheduleTaskAt()', () => {
		it('should create and start a cron job when the date is in the future', () => {
			const date = addHours(new Date(), 1);
			const task = jest.fn();

			const cronJob = scheduleTaskAt("a future task", date, task);

			expect(CronJob).toHaveBeenCalledTimes(1);
			expect(CronJob).toHaveBeenCalledWith(date, expect.any(Function));
			expect(cronJob).not.toBeNull();
			expect(cronJob?.start).toHaveBeenCalledTimes(1);
		});

		it('should not create a cron job when the date has already passed', () => {
			const date = addHours(new Date(), -1);

			const cronJob = scheduleTaskAt("a past task", date, jest.fn());

			expect(cronJob).toBeNull();
			expect(CronJob).not.toHaveBeenCalled();
			expect(logWarning).toHaveBeenCalledTimes(1);
		});

		it('should not create a cron job when the date is the current time', () => {
			const cronJob = scheduleTaskAt("a task happening now", new Date(), jest.fn());

			expect(cronJob).toBeNull();
			expect(CronJob).not.toHaveBeenCalled();
		});

		it('should not create a cron job when the date is null', () => {
			const cronJob = scheduleTaskAt("a task with no time", null, jest.fn());

			expect(cronJob).toBeNull();
			expect(CronJob).not.toHaveBeenCalled();
			expect(logWarning).toHaveBeenCalledTimes(1);
		});

		it('should not create a cron job when the date is undefined', () => {
			const cronJob = scheduleTaskAt("a task with no time", undefined, jest.fn());

			expect(cronJob).toBeNull();
			expect(CronJob).not.toHaveBeenCalled();
			expect(logWarning).toHaveBeenCalledTimes(1);
		});

		it('should not create a cron job when the date is invalid', () => {
			const cronJob = scheduleTaskAt("a task with an invalid time", new Date('not a date'), jest.fn());

			expect(cronJob).toBeNull();
			expect(CronJob).not.toHaveBeenCalled();
			expect(logWarning).toHaveBeenCalledTimes(1);
		});

		it('should run the given task when the cron job fires', () => {
			const task = jest.fn();
			scheduleTaskAt("a future task", addHours(new Date(), 1), task);

			const [, onTick] = (CronJob as unknown as jest.Mock).mock.calls[0];
			onTick();

			expect(task).toHaveBeenCalledTimes(1);
		});

		it('should log instead of throwing when the task throws synchronously', () => {
			const task = jest.fn(() => { throw new Error("task failed"); });
			scheduleTaskAt("a failing task", addHours(new Date(), 1), task);

			const [, onTick] = (CronJob as unknown as jest.Mock).mock.calls[0];

			expect(() => onTick()).not.toThrow();
			expect(logError).toHaveBeenCalledTimes(1);
		});

		it('should log instead of rejecting when the task rejects', async () => {
			const task = jest.fn(() => Promise.reject(new Error("task failed")));
			scheduleTaskAt("a failing async task", addHours(new Date(), 1), task);

			const [, onTick] = (CronJob as unknown as jest.Mock).mock.calls[0];
			onTick();
			await Promise.resolve();

			expect(logError).toHaveBeenCalledTimes(1);
		});
	});

	describe('scheduleTaskAtEachDate()', () => {
		it('should create and start a cron job for each future date', () => {
			const dates = [
				addHours(new Date(), 1),
				addHours(new Date(), 2),
				addHours(new Date(), 3),
			];

			const cronJobs = scheduleTaskAtEachDate("a repeated task", dates, jest.fn());

			expect(cronJobs).toHaveLength(3);
			expect(CronJob).toHaveBeenCalledTimes(3);
			for (const cronJob of getStartedCronJobs()) {
				expect(cronJob.start).toHaveBeenCalledTimes(1);
			}
		});

		it('should skip dates that have already passed', () => {
			const dates = [
				addHours(new Date(), -1),
				addMinutes(new Date(), -1),
				addHours(new Date(), 1),
			];

			const cronJobs = scheduleTaskAtEachDate("a repeated task", dates, jest.fn());

			expect(cronJobs).toHaveLength(1);
			expect(CronJob).toHaveBeenCalledTimes(1);
			expect(CronJob).toHaveBeenCalledWith(dates[2], expect.any(Function));
		});

		it('should create no cron jobs when given no dates', () => {
			const cronJobs = scheduleTaskAtEachDate("a task with no times", [], jest.fn());

			expect(cronJobs).toHaveLength(0);
			expect(CronJob).not.toHaveBeenCalled();
		});
	});

	describe('scheduleRepeatingTask()', () => {
		it('should create and start a cron job from the given expression', () => {
			const cronJob = scheduleRepeatingTask("a daily task", "0 30 9 * * *", jest.fn());

			expect(CronJob).toHaveBeenCalledWith(
				"0 30 9 * * *",
				expect.any(Function),
				null,
				false,
				undefined
			);
			expect(cronJob.start).toHaveBeenCalledTimes(1);
		});

		it('should pass the given time zone to the cron job', () => {
			scheduleRepeatingTask("a daily task", "0 30 9 * * *", jest.fn(), { timeZone: "America/Chicago" });

			expect(CronJob).toHaveBeenCalledWith(
				"0 30 9 * * *",
				expect.any(Function),
				null,
				false,
				"America/Chicago"
			);
		});
	});
});
