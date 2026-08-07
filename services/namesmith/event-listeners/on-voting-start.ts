import { clearNamesToVoteOnChannel, closePublishedNamesChannel, closeTheResultsChannel, openNamesToVoteOnChannel } from '../utilities/discord-action.utility';
import { getNamesmithServices } from '../services/get-namesmith-services';
import { sendVotingDisplay } from '../interfaces/voting/voting-display';

/**
 * Starts the voting phase of the game by doing the following:
 * - Auto-publishing the current name of any player with no published names
 * - Sending the voting display
 * - Resetting the vote service
 */
export async function onVotingStart() {
	const { publishedNameService, voteService } = getNamesmithServices();

	publishedNameService.autoPublishCurrentNames();

	await clearNamesToVoteOnChannel();
	await closeTheResultsChannel();
	await closePublishedNamesChannel();
	await openNamesToVoteOnChannel();
	await sendVotingDisplay();

	voteService.reset();
}