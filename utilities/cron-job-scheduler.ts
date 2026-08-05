import { CronJob } from "cron";
import {
	ScheduleOptions,
	ScheduledTask,
	scheduleRepeatingTask,
	scheduleTaskAt
} from "./cron-job-utils";

/**
 * A cron job owned by a scheduler, paired with the date it is scheduled to run at if it runs at a fixed date.
 */
type OwnedCronJob = {
	cronJob: CronJob;
	scheduledTime: Date | null;
};

/**
 * Owns a named group of cron jobs so they can be scheduled, looked up, cancelled, and re-scheduled as a unit.
 * Scheduling under a task name that already has jobs cancels those jobs first, so re-running a scheduling routine reschedules instead of duplicating.
 * @example
 * const scheduler = new CronJobScheduler("Namesmith game events");
 * scheduler.scheduleTaskAt("start voting", timeVotingStarts, () => startVoting());
 * scheduler.cancelAll();
 */
export class CronJobScheduler {
	private cronJobsByTaskName = new Map<string, OwnedCronJob[]>();

	/**
	 * Constructs a new CronJobScheduler.
	 * @param schedulerName - The name of this group of jobs, used to identify its tasks in logs.
	 */
	constructor(
		private readonly schedulerName: string
	) {}

	/**
	 * Builds the name used to identify a task in logs, which includes the name of the scheduler that owns it.
	 * @param taskName - The name of the task.
	 * @returns The name of the task, prefixed with the name of this scheduler.
	 */
	private toLoggedTaskName(taskName: string): string {
		return `${this.schedulerName}: ${taskName}`;
	}

	/**
	 * Schedules the given task to run once at the given date, replacing any tasks already scheduled under the same name.
	 * Nothing is scheduled if the date is missing or has already passed.
	 * @param taskName - The name to schedule the task under.
	 * @param date - The date to run the task at, or null/undefined if it is not known yet.
	 * @param task - The task to run when the date is reached.
	 */
	scheduleTaskAt(
		taskName: string,
		date: Date | null | undefined,
		task: ScheduledTask
	): void {
		this.cancelTask(taskName);

		const cronJob = scheduleTaskAt(this.toLoggedTaskName(taskName), date, task);
		if (cronJob === null) return;

		this.cronJobsByTaskName.set(taskName, [
			{ cronJob, scheduledTime: date ?? null }
		]);
	}

	/**
	 * Schedules the given task to run once at each of the given dates, replacing any tasks already scheduled under the same name.
	 * Dates that have already passed are skipped.
	 * @param taskName - The name to schedule the tasks under.
	 * @param dates - The dates to run the task at.
	 * @param task - The task to run when each date is reached.
	 */
	scheduleTaskAtEachDate(
		taskName: string,
		dates: Date[],
		task: ScheduledTask
	): void {
		this.cancelTask(taskName);

		const ownedCronJobs: OwnedCronJob[] = [];
		for (const date of dates) {
			const cronJob = scheduleTaskAt(this.toLoggedTaskName(taskName), date, task);

			if (cronJob !== null)
				ownedCronJobs.push({ cronJob, scheduledTime: date });
		}

		if (ownedCronJobs.length === 0) return;

		this.cronJobsByTaskName.set(taskName, ownedCronJobs);
	}

	/**
	 * Schedules the given task to run every time the given cron expression matches, replacing any tasks already scheduled under the same name.
	 * @param taskName - The name to schedule the task under.
	 * @param cronExpression - The cron expression describing when to run the task (e.g. "0 30 9 * * *").
	 * @param task - The task to run each time the expression matches.
	 * @param options - The options to schedule the task with.
	 * @param options.timeZone - The IANA time zone the cron expression is interpreted in.
	 */
	scheduleRepeatingTask(
		taskName: string,
		cronExpression: string,
		task: ScheduledTask,
		options: ScheduleOptions = {}
	): void {
		this.cancelTask(taskName);

		const cronJob = scheduleRepeatingTask(
			this.toLoggedTaskName(taskName),
			cronExpression,
			task,
			options
		);

		this.cronJobsByTaskName.set(taskName, [
			{ cronJob, scheduledTime: null }
		]);
	}

	/**
	 * Stops and forgets every job scheduled under the given task name.
	 * @param taskName - The name of the task to cancel.
	 */
	cancelTask(taskName: string): void {
		const ownedCronJobs = this.cronJobsByTaskName.get(taskName);
		if (ownedCronJobs === undefined) return;

		for (const { cronJob } of ownedCronJobs) {
			cronJob.stop();
		}

		this.cronJobsByTaskName.delete(taskName);
	}

	/**
	 * Stops and forgets every job this scheduler owns.
	 */
	cancelAll(): void {
		for (const taskName of this.getScheduledTaskNames()) {
			this.cancelTask(taskName);
		}
	}

	/**
	 * Determines whether any job is currently scheduled under the given task name.
	 * @param taskName - The name of the task to check.
	 * @returns Whether the task is currently scheduled.
	 */
	isTaskScheduled(taskName: string): boolean {
		return this.cronJobsByTaskName.has(taskName);
	}

	/**
	 * Returns the dates the given task is scheduled to run at.
	 * Repeating tasks have no fixed dates, so they return an empty array even while scheduled.
	 * @param taskName - The name of the task to get the scheduled times of.
	 * @returns The dates the task is scheduled to run at.
	 */
	getTaskScheduledTimes(taskName: string): Date[] {
		const ownedCronJobs = this.cronJobsByTaskName.get(taskName) ?? [];

		return ownedCronJobs
			.map(({ scheduledTime }) => scheduledTime)
			.filter((scheduledTime): scheduledTime is Date => scheduledTime !== null);
	}

	/**
	 * Returns the names of every task this scheduler currently has scheduled.
	 * @returns The names of every currently scheduled task.
	 */
	getScheduledTaskNames(): string[] {
		return [...this.cronJobsByTaskName.keys()];
	}
}
