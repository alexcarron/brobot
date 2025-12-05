import { sendVotingMessages } from '../interfaces/voting/voting-messages';
import { closePublishedNamesChannel } from '../utilities/discord-action.utility';
import { getNamesmithServices } from '../services/get-namesmith-services';

/**
 * Starts the voting phase of the game by doing the following:
 * - Publishing any names that have not yet been published
 * - Sending the voting display
 * - Resetting the vote service
 */
export async function onVotingStart() {
	const { playerService, voteService } = getNamesmithServices();

	playerService.publishUnpublishedNames();
	playerService.finalizeAllNames();

	await closePublishedNamesChannel();

	await sendVotingMessages();

	voteService.reset();
}