import { toEnumFromStrings, ValuesOf } from "../../../utilities/enum-utilts";
import { Override, WithOptional } from "../../../utilities/types/generic-types"

export type Quest = {
	id: number,
	name: string,
	description: string,
	tokensReward: number,
	charactersReward: string,
	wasShown: boolean,
	isShown: boolean,
}

export type DBQuest = Override<Quest, {
	wasShown: 0 | 1,
	isShown: 0 | 1,
}>

/**
 * @example
 * {
 * 	name: "Quest Name",
 * 	description: "My description for this quest",
 * 	tokensReward: 12,
 * }
 */
export type QuestDefinition = WithOptional<Quest,
	| 'id'
	| 'tokensReward'
	| 'charactersReward'
	| 'wasShown'
	| 'isShown'
>

export type QuestID = Quest['id']
export type QuestName = Quest['name']
export type QuestResolvable =
	| { id: QuestID }
	| QuestID
	| QuestName


export const RewardTypes = toEnumFromStrings(
	'tokens', 'characters',
);

export type RewardType = ValuesOf<typeof RewardTypes>;

export type TokenReward = {
	type: 'tokens',
	numTokens: number,
}

export type CharacterReward = {
	type: 'characters',
	characters: string,
}

export type Reward =
	| TokenReward
	| CharacterReward