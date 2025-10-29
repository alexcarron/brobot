import { sendWinnerMessages } from "../interfaces/winner-messages";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { closeNamesToVoteOnChannel, openTheWinnerChannel } from "../utilities/discord-action.utility";

/**
 * Ends the voting phase of the game by doing the following:
 * - Closing the "Names to Vote On" channel to everyone
 * - Showing the winner of the voting phase
 */
export async function onVotingEnd() {
	const { playerService, voteService } = getNamesmithServices();

	await closeNamesToVoteOnChannel();
	await openTheWinnerChannel();

	voteService.logVoteCountPerPlayer();
	const winningPlayerID = voteService.getWinningPlayerID();
	let winningPlayer = null;

	if (winningPlayerID !== null) {
		winningPlayer = playerService.resolvePlayer(winningPlayerID);
	}

	await sendWinnerMessages({winningPlayer});
}