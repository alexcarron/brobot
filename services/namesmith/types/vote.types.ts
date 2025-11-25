import { ExtractType, object, string } from "../../../utilities/runtime-types-utils";
import { Player, PlayerResolvable } from "./player.types";

export const DBVoteType = object.asType({
	voterID: string,
	playerVotedForID: string,
})
export const asDBVote = DBVoteType.from;
export const asDBVotes = DBVoteType.fromAll;
export const asMinimalVote = DBVoteType.from;
export const asMinimalVotes = DBVoteType.fromAll;
export type MinimalVote = ExtractType<typeof DBVoteType>

export type Vote = {
	voterID: string;
	playerVotedFor: Player;
}

export type VoteDefinition = {
	voter: VoteID | PlayerResolvable;
	playerVotedFor: PlayerResolvable;
};

export type VoteID = MinimalVote["voterID"];
export type VoteResolvable =
	| {voter: VoteID | PlayerResolvable}
	| {voterID: VoteID}
	| VoteID;