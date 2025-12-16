import { toEnumFromStrings, ValuesOf } from "../../../utilities/enum-utilts";
import { object, number, string, ExtractDomainType } from '../../../utilities/runtime-types-utils';
import { WithOptional } from "../../../utilities/types/generic-types";
import { DBBoolean, DBDate } from "../utilities/db.utility";

export const DBQuestType = object.asTransformableType('Quest', {
	id: number,
	name: string,
	description: string,
	tokensReward: number,
	charactersReward: string,
	wasShown: DBBoolean,
	isShown: DBBoolean,
});
export const asDBQuests = DBQuestType.fromAll;
export const asQuest = DBQuestType.toQuest;
export const asQuests = DBQuestType.toQuests;
export type Quest = ExtractDomainType<typeof DBQuestType>

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


export const DBShownDailyQuest = object.asTransformableType('MinimalShownDailyQuest', {
	timeShown: DBDate,
	questID: number,
});
export const toDBShownDailyQuest = DBShownDailyQuest.fromMinimalShownDailyQuest;
export const asMinimalShownDailyQuest = DBShownDailyQuest.toMinimalShownDailyQuest;
export type MinimalShownDailyQuest = ExtractDomainType<typeof DBShownDailyQuest>;

export type ShownDailyQuest = {
	timeShown: Date,
	quest: Quest,
};

export type ShownDailyQuestDefinition = {
	timeShown: Date;
	quest: QuestResolvable;
}