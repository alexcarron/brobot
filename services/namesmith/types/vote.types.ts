export interface Vote {
	voterID: string;
	playerVotedForID: string;
}

/**
 * DBVote represents a Vote stored in the database.
 * Currently identical to Vote but kept for semantic clarity.
 */
export type DBVote = Vote;

export type VoteID = Vote["voterID"];
export type VoteResolvable =
	| {voterID: VoteID}
	| VoteID;