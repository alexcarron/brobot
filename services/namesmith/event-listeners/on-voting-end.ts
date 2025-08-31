import { PlayerService } from "../services/player.service";
import { VoteService } from "../services/vote.service";
import { closeNamesToVoteOnChannel, openTheWinnerChannel, sendToTheWinnerChannel } from "../utilities/discord-action.utility";

/**
 * Ends the voting phase of the game by doing the following:
 * - Closing the "Names to Vote On" channel to everyone
 * - Showing the winner of the voting phase
 * @param services - The services to use
 * @param services.playerService - The player service
 * @param services.voteService - The vote service
 */
export async function endVoting(
	{voteService, playerService}: {
		voteService: VoteService;
		playerService: PlayerService;
	}
) {
	await closeNamesToVoteOnChannel();
	await openTheWinnerChannel();

	voteService.logVoteCountPerPlayer();
	const winningPlayerID = voteService.getWinningPlayerID();

	if (winningPlayerID === null) {
		await sendToTheWinnerChannel(`The voting phase has ended and there was a tie!`);
		return;
	}

	const name = playerService.getPublishedName(winningPlayerID);

	await sendToTheWinnerChannel(`<@${winningPlayerID}>!\nThe voting phase has ended and the winner is **${name}**!`);
}