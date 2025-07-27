export interface Vote {
	voterID: string;
	playerVotedForID: string;
}

export interface DBVote extends Vote {}

export type VoteID = Vote["voterID"];

export type VoteResolvable = Vote | VoteID;