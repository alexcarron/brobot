import { getNamesmithServices } from "../services/get-namesmith-services";
import { Player, PlayerResolvable } from "../types/player.types";
import { Rank, Ranks, VoteID } from "../types/vote.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";

const result = getWorkflowResultCreator({
	success: provides<{
		missingRanks: Set<Rank>,
		rankToVotedName: Map<Rank, string>,
		otherRankToVotedName: Map<Rank, string>,
		playerPreviouslyInRank: Player | null,
		previousRankOfPlayer: Rank | null,
	}>(),

	repeatedVote: provides<{ rankToVotedName: Map<Rank, string> }>(),
	outOfOrderVote: provides<{ 
		rankToVotedName: Map<Rank, string>, 
		missingRanks: Set<Rank> 
	}>(),
	invalidSwitchedVote: provides<{ 
		rankToVotedName: Map<Rank, string>,
		rankLeftEmpty: Rank, 
	}>(),

	votingClosed: null,
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
	const {voteService, gameStateService} = getNamesmithServices();

	if (!gameStateService.isVotingOpen())
		return result.failure.votingClosed();

	const playerPreviouslyInRank = voteService.getPlayerVotedInRank(voterUserID, rankVotingFor);
	const previousRankOfPlayer = voteService.getRankOfPlayerInVote(voterUserID, votedPlayerResolvable);
	const previousMissingRanks = voteService.getMissingRanksOfVote(voterUserID);
	const previousRankToVotedPlayer = voteService.getRanksToVotedPlayer(voterUserID);
	const previousRankToVotedName = new Map(
		Array.from(previousRankToVotedPlayer).map(([rank, player]) => [rank, player.publishedName!])
	)

	if (previousRankOfPlayer !== null) {
		if (previousRankOfPlayer === rankVotingFor) {
			return result.failure.repeatedVote({rankToVotedName: previousRankToVotedName});
		}
		
		switch (previousRankOfPlayer) {
			case Ranks.FIRST:
				return result.failure.invalidSwitchedVote({
					rankToVotedName: previousRankToVotedName,
					rankLeftEmpty: Ranks.FIRST,
				});

			case Ranks.SECOND:
				if (rankVotingFor === Ranks.THIRD)
					return result.failure.invalidSwitchedVote({
						rankToVotedName: previousRankToVotedName,
						rankLeftEmpty: Ranks.SECOND,
					});

				if (!previousMissingRanks.has(Ranks.THIRD))
					return result.failure.invalidSwitchedVote({
						rankToVotedName: previousRankToVotedName,
						rankLeftEmpty: Ranks.SECOND,
					});
				break;
		}
	} 

	switch (rankVotingFor) {
		case Ranks.SECOND:
			if (previousMissingRanks.has(Ranks.FIRST)) {
				return result.failure.outOfOrderVote({
					rankToVotedName: previousRankToVotedName,
					missingRanks: new Set([Ranks.FIRST]),
				});
			}
			break;

		case Ranks.THIRD:
			if (previousMissingRanks.has(Ranks.FIRST)) {
				return result.failure.outOfOrderVote({
					rankToVotedName: previousRankToVotedName,
					missingRanks: new Set([Ranks.FIRST, Ranks.SECOND])
				});
			}
			else if (previousMissingRanks.has(Ranks.SECOND)) {
				return result.failure.outOfOrderVote({
					rankToVotedName: previousRankToVotedName,
					missingRanks: new Set([Ranks.SECOND])
				});
			}
			break;
	}
	
	const vote = voteService.votePlayerAsRank(voterUserID, votedPlayerResolvable, rankVotingFor);
	const missingRanks = voteService.getMissingRanksOfVote(vote);

	const rankToVotedPlayer = voteService.getRanksToVotedPlayer(voterUserID);
	const rankToVotedName = new Map(
		Array.from(rankToVotedPlayer).map(([rank, player]) => [rank, player.publishedName!])
	)
	const otherRankToVotedPlayer = voteService.getOtherRanksToVotedPlayer(voterUserID, rankVotingFor);
	const otherRankToVotedName = new Map(
		Array.from(otherRankToVotedPlayer).map(([rank, player]) => [rank, player.publishedName!])
	)
	return result.success({missingRanks, rankToVotedName, otherRankToVotedName, playerPreviouslyInRank, previousRankOfPlayer});
}