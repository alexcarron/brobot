import { DatabaseQuerier } from "../../database/database-querier";
import { Vote, VoteDefinition } from "../../types/vote.types";
import { VoteRepository } from "../../repositories/vote.repository";
import { getRandomNumericUUID } from "../../../../utilities/random-utils";

/**
 * Adds a vote to the database with the given properties. The voted published names must already exist in the database.
 * @param db - The in-memory database.
 * @param voteDefintion - The vote data to add.
 * @param voteDefintion.voter - The user or player who voted.
 * @param voteDefintion.votedFirstPublishedName - The published name voted as 1st place.
 * @param voteDefintion.votedSecondPublishedName - The published name voted as 2nd place.
 * @param voteDefintion.votedThirdPublishedName - The published name voted as 3rd place.
 * @returns The vote object that was added.
 */
export const addMockVote = (
	db: DatabaseQuerier,
	voteDefintion: Partial<VoteDefinition> = {}
): Vote => {
	const voteRepository = VoteRepository.fromDB(db);

	const {
		voter = getRandomNumericUUID(),
		votedFirstPublishedName = null,
		votedSecondPublishedName = null,
		votedThirdPublishedName = null,
	} = voteDefintion;

	return voteRepository.addVote({
		voter,
		votedFirstPublishedName,
		votedSecondPublishedName,
		votedThirdPublishedName,
	});
};
