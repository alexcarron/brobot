import { ExtractType, object, string } from "../../../utilities/runtime-types-utils";
import { Player, PlayerResolvable } from "./player.types";

export const Ranks = Object.freeze({
	FIRST: '1st',
	SECOND: '2nd',
	THIRD: '3rd',
})
export type Rank = typeof Ranks[keyof typeof Ranks];
export const RANKS = [Ranks.FIRST, Ranks.SECOND, Ranks.THIRD];

export const DBVoteType = object.asType({
	voterID: string,
	votedFirstPlayerID: string.orNull,
	votedSecondPlayerID: string.orNull,
	votedThirdPlayerID: string.orNull,
})
export const asDBVote = DBVoteType.from;
export const asDBVotes = DBVoteType.fromAll;
export const asMinimalVote = DBVoteType.from;
export const asMinimalVotes = DBVoteType.fromAll;
export type MinimalVote = ExtractType<typeof DBVoteType>

export type Vote = {
	voterID: string;
	votedFirstPlayer: Player | null;
	votedSecondPlayer: Player | null;
	votedThirdPlayer: Player | null;
}

export type VoteDefinition = {
	voter: VoteID | PlayerResolvable;
	votedFirstPlayer?: PlayerResolvable | null;
	votedSecondPlayer?: PlayerResolvable | null;
	votedThirdPlayer?: PlayerResolvable | null;
};

export type VoteID = MinimalVote["voterID"];
export type VoteResolvable =
	| {voter: VoteID | PlayerResolvable}
	| {voterID: VoteID}
	| VoteID;

export type VoteInfo = {
	points: number;
	firstPlaceVotes: number;
	firstPlacePoints: number;
	secondPlaceVotes: number;
	secondPlacePoints: number;
	thirdPlaceVotes: number;
	thirdPlacePoints: number;
}
	
export type Placement = 
	& VoteInfo
	& {
		rank: number;
		player: Player;
		name: string;
	};