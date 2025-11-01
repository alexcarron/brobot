export interface Vote {
	voterID: string;
	playerVotedForID: string;
}

export type DBVote = Vote;

export type VoteDefinition = Vote;

export type VoteID = Vote["voterID"];
export type VoteResolvable =
	| {voterID: VoteID}
	| VoteID;