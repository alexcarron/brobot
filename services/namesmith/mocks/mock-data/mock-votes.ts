import { DatabaseQuerier } from "../../database/database-querier";
import { Vote, VoteDefinition } from "../../types/vote.types";
import { addMockPlayer, mockPlayers } from "./mock-players";
import { VoteRepository } from "../../repositories/vote.repository";
import { getRandomNumericUUID } from "../../../../utilities/random-utils";
import { PlayerRepository } from "../../repositories/player.repository";

/**
 * An array of mock votes for testing purposes.
 */
export const mockVotes: VoteDefinition[] = [
	{
		voter: mockPlayers[0].id,
		playerVotedFor: mockPlayers[1].id,
	},
	{
		voter: mockPlayers[1].id,
		playerVotedFor: mockPlayers[2].id,
	},
	{
		voter: mockPlayers[2].id,
		playerVotedFor: mockPlayers[1].id,
	},
];

/**
 * Adds a vote to the database with the given properties.
 * @param db - The in-memory database.
 * @param voteDefintion - The vote data to add.
 * @param voteDefintion.voter - The user or player who voted.
 * @param voteDefintion.playerVotedFor - The player voted for.
 * @returns The vote object that was added.
 */
export const addMockVote = (
	db: DatabaseQuerier,
	voteDefintion: Partial<VoteDefinition> = {}
): Vote => {
	const {
		voter = getRandomNumericUUID(),
	} = voteDefintion;
	
	let {
		playerVotedFor = mockPlayers[0].id,
	} = voteDefintion;

	const playerRepository = PlayerRepository.fromDB(db);
	const playerVotedForID = playerRepository.resolveID(playerVotedFor);
	if (!playerRepository.doesPlayerExist(playerVotedForID)) {
		playerVotedFor = addMockPlayer(db, { id: playerVotedForID });
	}

	const voteRepository = VoteRepository.fromDB(db);
	return voteRepository.addVote({
		voter,
		playerVotedFor,
	});
};