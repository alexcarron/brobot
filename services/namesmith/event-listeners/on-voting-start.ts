import { closePublishedNamesChannel } from '../utilities/discord-action.utility';
import { getNamesmithServices } from '../services/get-namesmith-services';
import { sendVotingDisplay } from '../interfaces/voting/voting-display';

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
	await sendVotingDisplay();

	voteService.reset();
}