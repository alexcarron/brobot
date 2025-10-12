import { changeDiscordNameOfPlayer } from "../utilities/discord-action.utility";
import { NamesmithEvents, RelevantDataOf } from "./namesmith-events";
import { withRapidCallDetector } from '../../../utilities/debug/rapid-call-detector';
import { RAPID_CALLS_THRESHOLD } from "../constants/debug.constants";
import { logWarning } from "../../../utilities/logging-utils";

/**
 * Called when a player's name is changed.
 * Changes the player's current name to the new name in Discord.
 * @param data - The data passed to the event listener.
 * @param data.playerID - The ID of the player whose name was changed.
 * @param data.newName - The new name of the player.
 * @returns A promise that resolves once the player's name has been changed in Discord.
 */
export const onNameChange = withRapidCallDetector(
	async function ({playerID, newName}:
		RelevantDataOf<typeof NamesmithEvents.NameChange>
	) {
		await changeDiscordNameOfPlayer(playerID, newName);
	},
	{
		rapidCallsThreshold: RAPID_CALLS_THRESHOLD,
		onRapidCall: ({timeSinceLastCall, numConsecutiveCalls}) =>
			logWarning(
				`The name change event should not be fired in rapid succession. You should refactor your code so the event is fired only after all changes to the current name have been made.\n` +
				`The last call was ${timeSinceLastCall}ms ago, and ${numConsecutiveCalls} calls have been made in rapid succession in total.`
			),

		isSameCall: (currentArgs, lastArgs) => currentArgs[0].playerID === lastArgs[0].playerID
	}
);