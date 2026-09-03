import { getNamesmithServices } from "../../services/get-namesmith-services";
import { PublishedName, PublishedNameResolvable } from "../../types/published-name.types";
import { Rank, Ranks, RANKS, VoteID } from "../../types/vote.types";
import { getWorkflowResultCreator, provides } from "../workflow-result-creator";
import { telemetry } from "../../telemetry/telemetry";
import { EventType } from "../../telemetry/telemetry-event.types";
import { toRankNumber } from "../../utilities/vote.utility";

const result = getWorkflowResultCreator({
	success: provides<{
		missingRanks: Set<Rank>,
		rankToVotedName: Map<Rank, string>,
		otherRankToVotedName: Map<Rank, string>,
		publishedNamePreviouslyInRank: PublishedName | null,
		previousRankOfPublishedName: Rank | null,
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
 * Attempts to have a user vote a published name the given rank
 * @param parameters - An object containing the following parameters:
 * @param parameters.voterUserID - The ID of the user who is voting
 * @param parameters.votedPublishedName - The published name that is being voted on
 * @param parameters.rankVotingFor - The rank of the published name being voted on
 * @returns The result of the workflow
 */
export function voteName(
	{voterUserID, votedPublishedName: votedPublishedNameResolvable, rankVotingFor}: {
		voterUserID: VoteID,
		votedPublishedName: PublishedNameResolvable,
		rankVotingFor: Rank
	}
) {
	const {voteService, gameStateService, publishedNameService} = getNamesmithServices();

	if (!gameStateService.isVotingOpen())
		return result.failure.votingClosed();

	const publishedNamePreviouslyInRank = voteService.getPublishedNameVotedInRank(voterUserID, rankVotingFor);
	const previousRankOfPublishedName = voteService.getRankOfPublishedNameInVote(voterUserID, votedPublishedNameResolvable);
	const previousMissingRanks = voteService.getMissingRanksOfVote(voterUserID);
	const previousRankToVotedName = voteService.getRanksToVotedName(voterUserID);

	if (previousRankOfPublishedName !== null) {
		if (previousRankOfPublishedName === rankVotingFor) {
			telemetry.track({
				eventType: EventType.ACTION_BLOCKED,
				playerID: voterUserID,
				blockedAction: "vote",
				blockReason: "nameVotedTwice",
			});
			return result.failure.repeatedVote({rankToVotedName: previousRankToVotedName});
		}

		switch (previousRankOfPublishedName) {
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
				telemetry.track({ eventType: EventType.ACTION_BLOCKED, playerID: voterUserID, blockedAction: "vote", blockReason: "voteOutOfOrder" });
				return result.failure.outOfOrderVote({
					rankToVotedName: previousRankToVotedName,
					missingRanks: new Set([Ranks.FIRST]),
				});
			}
			break;

		case Ranks.THIRD:
			if (previousMissingRanks.has(Ranks.FIRST)) {
				telemetry.track({ eventType: EventType.ACTION_BLOCKED, playerID: voterUserID, blockedAction: "vote", blockReason: "voteOutOfOrder" });
				return result.failure.outOfOrderVote({
					rankToVotedName: previousRankToVotedName,
					missingRanks: new Set([Ranks.FIRST, Ranks.SECOND])
				});
			}
			else if (previousMissingRanks.has(Ranks.SECOND)) {
				telemetry.track({ eventType: EventType.ACTION_BLOCKED, playerID: voterUserID, blockedAction: "vote", blockReason: "voteOutOfOrder" });
				return result.failure.outOfOrderVote({
					rankToVotedName: previousRankToVotedName,
					missingRanks: new Set([Ranks.SECOND])
				});
			}
			break;
	}
	
	const vote = voteService.votePublishedNameAsRank(voterUserID, votedPublishedNameResolvable, rankVotingFor);
	const missingRanks = voteService.getMissingRanksOfVote(vote);

	const rankToVotedName = voteService.getRanksToVotedName(voterUserID);
	const otherRankToVotedName = voteService.getOtherRanksToVotedName(voterUserID, rankVotingFor);

	telemetry.track({
		eventType: EventType.VOTE_CAST,
		playerID: voterUserID,
		ranksFilled: RANKS.length - missingRanks.size,
		votedPublishedNameID: publishedNameService.resolveID(votedPublishedNameResolvable),
		rank: toRankNumber(rankVotingFor),
	});

	return result.success({missingRanks, rankToVotedName, otherRankToVotedName, publishedNamePreviouslyInRank, previousRankOfPublishedName});
}