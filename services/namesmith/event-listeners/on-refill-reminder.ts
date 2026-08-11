import { sendRefillReminderDM } from '../interfaces/refill-reminders/refill-reminder-message';
import { telemetry } from '../telemetry/telemetry';
import { EventType } from '../telemetry/telemetry-event.types';
import { NamesmithEvents, RelevantDataOf } from './namesmith-events';

/**
 * Sends a player their refill reminder DM once their refill cooldown expires.
 * @param relevantData - The data of the triggered event.
 * @param relevantData.playerID - The Discord ID of the player to remind.
 */
export async function onRefillReminder(
	{ playerID }: RelevantDataOf<typeof NamesmithEvents.RefillReminder>
) {
	await sendRefillReminderDM(playerID);
	telemetry.track({ eventType: EventType.REMINDER_SENT, playerID, reminderKind: "refillReady" });
}
