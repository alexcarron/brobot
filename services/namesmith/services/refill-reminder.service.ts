import { CronJobScheduler } from "../../../utilities/cron-job-scheduler";
import { NamesmithEvents } from "../event-listeners/namesmith-events";
import { getNamesmithServices } from "./get-namesmith-services";
import { PlayerID } from "../types/player.types";

/**
 * Schedules the reminder a player receives when their refill cooldown expires.
 */
export class RefillReminderService {
	private scheduler = new CronJobScheduler("Namesmith refill reminders");

	static fromDB() {
		return new RefillReminderService();
	}

	static asMock() {
		return new RefillReminderService();
	}

	private toTaskName(playerID: PlayerID): string {
		return `refill reminder ${playerID}`;
	}

	/**
	 * Schedules a reminder to be sent to the given player when their refill cooldown expires, replacing any reminder already scheduled for them.
	 * @param playerID - The ID of the player to remind.
	 * @param remindAt - The time the player's refill cooldown expires.
	 */
	scheduleReminder(playerID: PlayerID, remindAt: Date): void {
		this.scheduler.scheduleTaskAt(this.toTaskName(playerID), remindAt, () => {
			NamesmithEvents.RefillReminder.triggerEvent({ playerID });
		});
	}

	/**
	 * Cancels the reminder scheduled for the given player, if any.
	 * @param playerID - The ID of the player whose reminder is being cancelled.
	 */
	cancelReminder(playerID: PlayerID): void {
		this.scheduler.cancelTask(this.toTaskName(playerID));
	}

	/**
	 * Re-schedules the reminder for every player who has reminders enabled and is still on cooldown.
	 * Intended to be called on bot startup, since scheduled cron jobs don't survive a restart.
	 */
	rescheduleAllPendingReminders(): void {
		const { playerService } = getNamesmithServices();

		for (const playerID of playerService.getPlayerIDsWithRefillReminderEnabled()) {
			if (!playerService.canRefill(playerID)) {
				this.scheduleReminder(playerID, playerService.getNextAvailableRefillTime(playerID));
			}
		}
	}
}
