import { sendWinnerMessages } from "../interfaces/winner-messages";
import { closeNamesToVoteOnChannel, openTheWinnerChannel } from "../utilities/discord-action.utility";

/**
 * Ends the voting phase of the game by doing the following:
 * - Closing the "Names to Vote On" channel to everyone
 * - Showing the winner of the voting phase
 */
export async function onVotingEnd() {
	await closeNamesToVoteOnChannel();
	await openTheWinnerChannel();
	await sendWinnerMessages({winningPlayer: null});
}