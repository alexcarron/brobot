import { sendResultsDisplay } from "../interfaces/results/results-display";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { clearTheResultsChannel, closeNamesToVoteOnChannel, closePublishedNamesChannel, openTheResultsChannel } from "../utilities/discord-action.utility";

/**
 * Ends the voting phase of the game by doing the following:
 * - Closing the "Names to Vote On" channel to everyone
 * - Showing the winner of the voting phase
 */
export async function onVotingEnd() {
	await clearTheResultsChannel();
	await closeNamesToVoteOnChannel();
	await closePublishedNamesChannel();
	await openTheResultsChannel();

	const { voteService } = getNamesmithServices();
	const placements = voteService.getPlacements();
	await sendResultsDisplay({ placements });
}