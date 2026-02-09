import { getNamesmithServices } from "../services/get-namesmith-services";
import { Player, PlayerResolvable } from "../types/player.types";
import { Rank, VoteID } from "../types/vote.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";

const result = getWorkflowResultCreator({
	success: provides<{
		missingRanks: Set<Rank>,
		otherRankToVotedName: Map<Rank, string>,
		playerPreviouslyInRank: Player | null
	}>(),
})

/**
 * Attempts to have a user vote a player's name the given rank
 * @param parameters - An object containing the following parameters:
 * @param parameters.voterUserID - The ID of the user who is voting
 * @param parameters.votedPlayer - The player who is being voted on
 * @param parameters.rankVotingFor - The rank of the player being voted on
 * @returns The result of the workflow
 */
export function voteName(
	{voterUserID, votedPlayer: votedPlayerResolvable, rankVotingFor}: {
		voterUserID: VoteID,
		votedPlayer: PlayerResolvable,
		rankVotingFor: Rank
	}
) {
	const {voteService} = getNamesmithServices();

	const playerPreviouslyInRank = voteService.getPlayerUserVotedInRank(voterUserID, rankVotingFor);
	const vote = voteService.votePlayerAsRank(voterUserID, votedPlayerResolvable, rankVotingFor);
	const missingRanks = voteService.getMissingRanksOfVote(vote);

	const otherRankToVotedPlayer = voteService.getOtherRanksToVotedPlayer(voterUserID, rankVotingFor);
	const otherRankToVotedName = new Map(
		Array.from(otherRankToVotedPlayer).map(([rank, player]) => [rank, player.publishedName!])
	)
	return result.success({missingRanks, otherRankToVotedName, playerPreviouslyInRank});
}