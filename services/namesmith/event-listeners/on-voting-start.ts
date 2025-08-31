import { sendVotingDisplay } from '../interfaces/voting-display';
import { VoteService } from "../services/vote.service";
import { PlayerService } from "../services/player.service";

/**
 * Starts the voting phase of the game by doing the following:
 * - Publishing any names that have not yet been published
 * - Sending the voting display
 * - Resetting the vote service
 * @param services - The services to use
 * @param services.playerService - The player service
 * @param services.voteService - The vote service
 */
export async function startVoting(
	{ playerService, voteService }: {
		playerService: PlayerService;
		voteService: VoteService;
	}
) {
	await playerService.publishUnpublishedNames();
	await playerService.finalizeAllNames();

	await sendVotingDisplay({playerService});

	voteService.reset();
}