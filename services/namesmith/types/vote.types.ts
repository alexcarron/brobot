export interface Vote {
	voterID: string;
	playerVotedForID: string;
}

export interface DBVote extends Vote {}

export type VoteResolvable = Vote | Vote["voterID"];