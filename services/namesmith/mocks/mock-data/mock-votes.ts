import { RunResult } from "better-sqlite3";
import { DatabaseQuerier } from "../../database/database-querier";
import { Vote } from "../../types/vote.types";
import { mockPlayers } from "./mock-players";
import { InvalidArgumentError } from "../../../../utilities/error-utils";

/**
 * An array of mock votes for testing purposes.
 */
export const mockVotes: Vote[] = [
	{
		voterID: mockPlayers[0].id,
		playerVotedForID: mockPlayers[1].id,
	},
	{
		voterID: mockPlayers[1].id,
		playerVotedForID: mockPlayers[2].id,
	},
	{
		voterID: mockPlayers[2].id,
		playerVotedForID: mockPlayers[1].id,
	},
];

/**
 * Adds a vote to the database with the given properties.
 * @param db - The in-memory database.
 * @param voteData - The vote data to add.
 * @param voteData.voterID - The ID of the user who voted.
 * @param voteData.playerVotedForID - The ID of the player voted for.
 * @returns The result of the insert operation.
 */
export const addMockVote = (
	db: DatabaseQuerier,
	{ voterID, playerVotedForID }: { voterID: string, playerVotedForID: string }
): RunResult => {
	if (voterID === undefined)
		throw new InvalidArgumentError("addMockVote: voterID is undefined.");

	if (typeof voterID !== "string")
		throw new InvalidArgumentError(`addMockVote: voterID must be a string, but got ${voterID}.`);

	if (playerVotedForID === undefined)
		throw new InvalidArgumentError("addMockVote: playerVotedForID is undefined.");

	if (typeof playerVotedForID !== "string")
		throw new InvalidArgumentError(`addMockVote: playerVotedForID must be a string, but got ${playerVotedForID}.`);

	const insertVote = db.prepare(`
		INSERT INTO vote (voterID, playerVotedForID)
		VALUES (@voterID, @playerVotedForID)
	`);
	const vote = insertVote.run({ voterID, playerVotedForID });
	return vote;
};