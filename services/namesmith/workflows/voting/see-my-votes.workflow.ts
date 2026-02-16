import { getNamesmithServices } from "../../services/get-namesmith-services";
import { Rank, VoteID } from "../../types/vote.types";
import { getWorkflowResultCreator, provides } from "../workflow-result-creator";

const result = getWorkflowResultCreator({
	success: provides<{
		rankToVotedName: Map<Rank, string>,
	}>(),
})

/**
 * Attempts  to retrieve the current votes of the given user
 * @param parameters - An object containing the following parameters:
 * @param parameters.voterUserID - The ID of the user whose votes are being retrieved
 * @returns The result of the workflow
 */
export function seeMyVotes(
	{voterUserID}: {voterUserID: VoteID},
) {
	const {voteService} = getNamesmithServices();

	const rankToVotedName = voteService.getRanksToVotedName(voterUserID);

	return result.success({rankToVotedName});
}