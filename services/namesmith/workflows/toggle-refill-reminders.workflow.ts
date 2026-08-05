import { PlayerResolvable } from "../types/player.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";
import { getNamesmithServices } from "../services/get-namesmith-services";

const result = getWorkflowResultCreator({
	success: provides<{
		enabled: boolean,
	}>(),

	notAPlayer: null,
});

/**
 * Flips whether a player receives a DM reminder when their refill cooldown expires.
 * @param params - The parameters for the function.
 * @param params.playerID - The player toggling their refill reminders.
 * @returns The new state of the player's refill reminder setting.
 * - NotAPlayer if the provided player is not a valid player.
 */
export const toggleRefillReminders = (
	{ playerID }: { playerID: PlayerResolvable }
) => {
	const { playerService, refillReminderService } = getNamesmithServices();

	if (!playerService.isPlayer(playerID)) {
		return result.failure.notAPlayer();
	}

	const enabled = !playerService.hasRefillReminderEnabled(playerID);
	playerService.setRefillReminderEnabled(playerID, enabled);

	if (enabled) {
		if (!playerService.canRefill(playerID)) {
			refillReminderService.scheduleReminder(
				playerService.resolveID(playerID),
				playerService.getNextAvailableRefillTime(playerID)
			);
		}
	}
	else {
		refillReminderService.cancelReminder(playerService.resolveID(playerID));
	}

	return result.success({ enabled });
}
