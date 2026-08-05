import { CronJob } from "cron";
import { logError, logWarning } from "./logging-utils";

/**
 * A task that a cron job runs when it fires.
 */
export type ScheduledTask = () => void | Promise<void>;

/**
 * Options that can be given when scheduling a cron job.
 */
export type ScheduleOptions = {
	/**
	 * The IANA time zone the cron expression is interpreted in (e.g. "America/Chicago"). Defaults to the system time zone.
	 */
	timeZone?: string;
};

/**
 * Wraps a task so that anything it throws, synchronously or asynchronously, is logged instead of crashing the process or becoming an unhandled promise rejection.
 * @param taskName - The name of the task, used to identify it in logs.
 * @param task - The task to wrap.
 * @returns A task that never throws.
 */
function toErrorLoggingTask(taskName: string, task: ScheduledTask): () => void {
	return () => {
		try {
			const result = task();

			if (result instanceof Promise) {
				result.catch((error: unknown) => {
					logError(`The scheduled task "${taskName}" failed.`, error instanceof Error ? error : undefined);
				});
			}
		}
		catch (error) {
			logError(`The scheduled task "${taskName}" failed.`, error instanceof Error ? error : undefined);
		}
	};
}

/**
 * Creates and starts a cron job that runs the given task once at the given date.
 * Nothing is scheduled if the date is missing or is not in the future, so a task whose time has already passed is skipped instead of firing immediately.
 * @param taskName - The name of the task, used to identify it in logs.
 * @param date - The date to run the task at, or null/undefined if it is not known yet.
 * @param task - The task to run when the date is reached.
 * @returns The started cron job, or null if nothing was scheduled.
 */
export function scheduleTaskAt(
	taskName: string,
	date: Date | null | undefined,
	task: ScheduledTask
): CronJob | null {
	if (date === null || date === undefined) {
		logWarning(`Did not schedule the task "${taskName}" because it has no time set.`);
		return null;
	}

	if (isNaN(date.getTime())) {
		logWarning(`Did not schedule the task "${taskName}" because its time is not a valid date.`);
		return null;
	}

	const now = new Date();
	if (date <= now) {
		logWarning(`Did not schedule the task "${taskName}" because its time, ${date.toISOString()}, has already passed.`);
		return null;
	}

	const cronJob = new CronJob(date, toErrorLoggingTask(taskName, task));
	cronJob.start();
	return cronJob;
}

/**
 * Creates and starts one cron job per given date, each running the given task.
 * Dates that are missing or are not in the future are skipped.
 * @param taskName - The name of the task, used to identify it in logs.
 * @param dates - The dates to run the task at.
 * @param task - The task to run when each date is reached.
 * @returns The cron jobs that were started, which may be fewer than the number of dates given.
 */
export function scheduleTaskAtEachDate(
	taskName: string,
	dates: Date[],
	task: ScheduledTask
): CronJob[] {
	const cronJobs: CronJob[] = [];

	for (const date of dates) {
		const cronJob = scheduleTaskAt(taskName, date, task);

		if (cronJob !== null)
			cronJobs.push(cronJob);
	}

	return cronJobs;
}

/**
 * Creates and starts a cron job that runs the given task every time the given cron expression matches.
 * @param taskName - The name of the task, used to identify it in logs.
 * @param cronExpression - The cron expression describing when to run the task (e.g. "0 30 9 * * *").
 * @param task - The task to run each time the expression matches.
 * @param options - The options to schedule the task with.
 * @param options.timeZone - The IANA time zone the cron expression is interpreted in.
 * @returns The started cron job.
 */
export function scheduleRepeatingTask(
	taskName: string,
	cronExpression: string,
	task: ScheduledTask,
	{ timeZone }: ScheduleOptions = {}
): CronJob {
	const cronJob = new CronJob(
		cronExpression,
		toErrorLoggingTask(taskName, task),
		null,
		false,
		timeZone
	);
	cronJob.start();
	return cronJob;
}
