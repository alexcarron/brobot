import { ExtractType, number, object, string } from "../../../utilities/runtime-types-utils";
import { Player, PlayerResolvable } from "./player.types";
import { PublishedName, PublishedNameResolvable } from "./published-name.types";

export const Ranks = Object.freeze({
	FIRST: '1st',
	SECOND: '2nd',
	THIRD: '3rd',
})
export type Rank = typeof Ranks[keyof typeof Ranks];
export const RANKS = [Ranks.FIRST, Ranks.SECOND, Ranks.THIRD];

export const DBVoteType = object.asType({
	voterID: string,
	votedFirstPublishedNameID: number.orNull,
	votedSecondPublishedNameID: number.orNull,
	votedThirdPublishedNameID: number.orNull,
})
export const asDBVote = DBVoteType.from;
export const asDBVotes = DBVoteType.fromAll;
export const asMinimalVote = DBVoteType.from;
export const asMinimalVotes = DBVoteType.fromAll;
export type MinimalVote = ExtractType<typeof DBVoteType>

export type Vote = {
	voterID: string;
	votedFirstPublishedName: PublishedName | null;
	votedSecondPublishedName: PublishedName | null;
	votedThirdPublishedName: PublishedName | null;
}

export type VoteDefinition = {
	voter: VoteID | PlayerResolvable;
	votedFirstPublishedName?: PublishedNameResolvable | null;
	votedSecondPublishedName?: PublishedNameResolvable | null;
	votedThirdPublishedName?: PublishedNameResolvable | null;
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
		publishedName: PublishedName;
		player: Player;
		name: string;
	};
