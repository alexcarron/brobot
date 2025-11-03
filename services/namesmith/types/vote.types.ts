import { Player, PlayerResolvable } from "./player.types";

export type Vote = {
	voterID: string;
	playerVotedFor: Player;
}

export type DBVote = {
	voterID: string;
	playerVotedForID: string;
};

export type VoteDefinition = {
	voter: VoteID | PlayerResolvable;
	playerVotedFor: PlayerResolvable;
};

export type VoteID = DBVote["voterID"];
export type VoteResolvable =
	| {voter: VoteID | PlayerResolvable}
	| {voterID: VoteID}
	| VoteID;