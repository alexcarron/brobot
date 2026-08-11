import { Duration, getMillisecondsOfDuration, toUnixTimestamp } from "../../../../utilities/date-time-utils";
import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { TIME_BEFORE_VOTING_TO_SEND_REMINDER } from "../../constants/game-state.constants";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { sendToPublishedNamesChannel } from "../../utilities/discord-action.utility";
import { getPingForAllPlayers } from "../../utilities/player-message.utility";

/**
 * Builds the message reminding players to finalize and publish their name before voting starts.
 * @param parameters - An object containing the following parameters:
 * @param parameters.durationUntilVotingStarts - How long before voting starts this reminder is sent.
 * @returns The contents of the reminder message.
 */
export function getVotingStartReminderMessage(
	{ durationUntilVotingStarts }: { durationUntilVotingStarts: Duration }
): string {
	const { gameStateService } = getNamesmithServices();
	const timeVotingStarts = gameStateService.getTimeVotingStarts();
	const votingStartsTimestamp = `<t:${toUnixTimestamp(timeVotingStarts)}:R>`;

	if (isFinalReminder(durationUntilVotingStarts)) {
		return joinLines(
			getPingForAllPlayers(),
			`Last chance. Voting starts ${votingStartsTimestamp}.`,
			`Publish your final name now with \`/publish-name\`.`,
			``,
			`-# Your current name will be published for you when voting starts if you haven't published one.`,
		);
	}

	return joinLines(
		getPingForAllPlayers(),
		`Voting starts ${votingStartsTimestamp}.`,
		`Publish your name with \`/publish-name\` before then.`,
		``,
		`-# Your current name will be published for you when voting starts if you haven't published one.`,
	);
}

/**
 * Determines whether a reminder is the last one players receive before voting starts.
 * @param durationUntilVotingStarts - How long before voting starts the reminder is sent.
 * @returns Whether this is the final reminder.
 */
function isFinalReminder(durationUntilVotingStarts: Duration): boolean {
	const shortestDuration = Math.min(
		...TIME_BEFORE_VOTING_TO_SEND_REMINDER().map(getMillisecondsOfDuration)
	);

	return getMillisecondsOfDuration(durationUntilVotingStarts) === shortestDuration;
}

/**
 * Sends the reminder to finalize and publish a name to the published names channel.
 * @param parameters - An object containing the following parameters:
 * @param parameters.durationUntilVotingStarts - How long before voting starts this reminder is sent.
 * @returns A promise that resolves once the reminder has been sent.
 */
export async function sendVotingStartReminderMessage(
	{ durationUntilVotingStarts }: { durationUntilVotingStarts: Duration }
): Promise<void> {
	await sendToPublishedNamesChannel(
		getVotingStartReminderMessage({ durationUntilVotingStarts })
	);
}
