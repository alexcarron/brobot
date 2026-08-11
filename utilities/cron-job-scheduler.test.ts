jest.mock('cron', () => ({
	CronJob: jest.fn(() => ({
		start: jest.fn(),
		stop: jest.fn(),
	})),
}));

jest.mock('./logging-utils', () => ({
	logError: jest.fn(),
	logWarning: jest.fn(),
	logInfo: jest.fn(),
}));

import { CronJob } from "cron";
import { addHours } from "./date-time-utils";
import { CronJobScheduler } from "./cron-job-scheduler";

const getCreatedCronJobs = () =>
	(CronJob as unknown as jest.Mock).mock.results.map(result => result.value);

describe('CronJobScheduler', () => {
	let scheduler: CronJobScheduler;

	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2025-07-12T12:00:00.000Z'));
		scheduler = new CronJobScheduler("test scheduler");
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.useRealTimers();
	});

	describe('.scheduleTaskAt()', () => {
		it('should schedule a task at a future date', () => {
			const date = addHours(new Date(), 1);

			scheduler.scheduleTaskAt("a task", date, jest.fn());

			expect(scheduler.isTaskScheduled("a task")).toBe(true);
			expect(scheduler.getTaskScheduledTimes("a task")).toEqual([date]);
		});

		it('should not schedule a task at a date that has passed', () => {
			scheduler.scheduleTaskAt("a task", addHours(new Date(), -1), jest.fn());

			expect(scheduler.isTaskScheduled("a task")).toBe(false);
			expect(CronJob).not.toHaveBeenCalled();
		});

		it('should not schedule a task with no date', () => {
			scheduler.scheduleTaskAt("a task", null, jest.fn());

			expect(scheduler.isTaskScheduled("a task")).toBe(false);
		});

		it('should stop the previous job when scheduling under the same task name', () => {
			scheduler.scheduleTaskAt("a task", addHours(new Date(), 1), jest.fn());
			const [firstCronJob] = getCreatedCronJobs();

			const newDate = addHours(new Date(), 2);
			scheduler.scheduleTaskAt("a task", newDate, jest.fn());

			expect(firstCronJob.stop).toHaveBeenCalledTimes(1);
			expect(scheduler.getTaskScheduledTimes("a task")).toEqual([newDate]);
		});

		it('should stop the previous job even when the new date has already passed', () => {
			scheduler.scheduleTaskAt("a task", addHours(new Date(), 1), jest.fn());
			const [firstCronJob] = getCreatedCronJobs();

			scheduler.scheduleTaskAt("a task", addHours(new Date(), -1), jest.fn());

			expect(firstCronJob.stop).toHaveBeenCalledTimes(1);
			expect(scheduler.isTaskScheduled("a task")).toBe(false);
		});
	});

	describe('.scheduleTaskAtEachDate()', () => {
		it('should schedule only the future dates', () => {
			const pastDate = addHours(new Date(), -1);
			const futureDates = [addHours(new Date(), 1), addHours(new Date(), 2)];

			scheduler.scheduleTaskAtEachDate("a task", [pastDate, ...futureDates], jest.fn());

			expect(scheduler.getTaskScheduledTimes("a task")).toEqual(futureDates);
			expect(CronJob).toHaveBeenCalledTimes(2);
		});

		it('should not record the task when every date has passed', () => {
			scheduler.scheduleTaskAtEachDate("a task", [addHours(new Date(), -1)], jest.fn());

			expect(scheduler.isTaskScheduled("a task")).toBe(false);
		});
	});

	describe('.scheduleRepeatingTask()', () => {
		it('should schedule a repeating task with no fixed times', () => {
			scheduler.scheduleRepeatingTask("a daily task", "0 30 9 * * *", jest.fn());

			expect(scheduler.isTaskScheduled("a daily task")).toBe(true);
			expect(scheduler.getTaskScheduledTimes("a daily task")).toEqual([]);
		});
	});

	describe('.cancelTask()', () => {
		it('should stop every job of the task and forget it', () => {
			scheduler.scheduleTaskAtEachDate("a task", [
				addHours(new Date(), 1),
				addHours(new Date(), 2),
			], jest.fn());

			scheduler.cancelTask("a task");

			for (const cronJob of getCreatedCronJobs()) {
				expect(cronJob.stop).toHaveBeenCalledTimes(1);
			}
			expect(scheduler.isTaskScheduled("a task")).toBe(false);
		});

		it('should do nothing when the task is not scheduled', () => {
			expect(() => scheduler.cancelTask("a task that was never scheduled")).not.toThrow();
		});
	});

	describe('.cancelAll()', () => {
		it('should stop every job the scheduler owns', () => {
			scheduler.scheduleTaskAt("first task", addHours(new Date(), 1), jest.fn());
			scheduler.scheduleTaskAtEachDate("second task", [
				addHours(new Date(), 2),
				addHours(new Date(), 3),
			], jest.fn());

			scheduler.cancelAll();

			for (const cronJob of getCreatedCronJobs()) {
				expect(cronJob.stop).toHaveBeenCalledTimes(1);
			}
			expect(scheduler.getScheduledTaskNames()).toEqual([]);
		});
	});

	describe('.getScheduledTaskNames()', () => {
		it('should return the names of every scheduled task', () => {
			scheduler.scheduleTaskAt("first task", addHours(new Date(), 1), jest.fn());
			scheduler.scheduleTaskAt("second task", addHours(new Date(), 2), jest.fn());
			scheduler.scheduleTaskAt("a task that never scheduled", addHours(new Date(), -1), jest.fn());

			expect(scheduler.getScheduledTaskNames()).toEqual(["first task", "second task"]);
		});
	});
});
