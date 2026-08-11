import { sendVotingStartReminderMessage } from '../interfaces/voting/voting-start-reminder-message';
import { NamesmithEvents, RelevantDataOf } from './namesmith-events';

/**
 * Reminds players to finalize and publish their name before voting starts.
 * @param relevantData - The data of the triggered event.
 * @param relevantData.durationUntilVotingStarts - How long before voting starts this reminder is sent.
 */
export async function onVotingStartReminder(
	{ durationUntilVotingStarts }: RelevantDataOf<typeof NamesmithEvents.VotingStartReminder>
) {
	await sendVotingStartReminderMessage({ durationUntilVotingStarts });
}
