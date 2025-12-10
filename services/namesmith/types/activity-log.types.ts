import { toEnumFromStrings, ValuesOf } from "../../../utilities/enum-utilts";
import { ExtractDomainType, ExtractType, number, object, string, strings } from "../../../utilities/runtime-types-utils";
import { DBDate } from "../utilities/db.utility";
import { Player, PlayerResolvable } from "./player.types";
import { Quest, QuestResolvable } from "./quest.types";
import { Recipe, RecipeResolvable } from "./recipe.types";
import { Trade, TradeResolvable } from "./trade.types";

export const ActivityTypes = toEnumFromStrings(
	'craftCharacters',
	'initiateTrade',
	'acceptTrade',
	'declineTrade',
	'modifyTrade',
	'buyMysteryBox',
	'mineTokens',
	'claimRefill',
	'completeQuest',
	'pickPerk',
);

export type ActivityType = ValuesOf<typeof ActivityTypes>;
export const activityTypes: ActivityType[] = Object.values(ActivityTypes);

export const DBActivityLogType = object.asTransformableType('MinimalActivityLog', {
	id: number,
	timeOccured: DBDate,
	playerID: string,
	type: strings(...activityTypes),
	tokensDifference: number,
	involvedPlayerID: string.orNull,
	involvedRecipeID: number.orNull,
	involvedQuestID: number.orNull,
	involvedTradeID: number.orNull,
});
export const asMinimalActivityLog = DBActivityLogType.toMinimalActivityLog;
export const asMinimalActivityLogs = DBActivityLogType.toMinimalActivityLogs;
export type DBActivityLog = ExtractType<typeof DBActivityLogType>;
export type MinimalActivityLog = ExtractDomainType<typeof DBActivityLogType>;

export type ActivityLog = {
	id: number;
	timeOccured: Date;
	player: Player;
	type: ActivityType;
	tokensDifference: number;
	involvedPlayer: Player | null;
	involvedRecipe: Recipe | null;
	involvedQuest: Quest | null;
	involvedTrade: Trade | null;
}

export type ActivityLogDefinition = {
	id?: number;
	timeOccured?: Date;
	player: PlayerResolvable;
	type: ActivityType;
	tokensDifference?: number;
	involvedPlayer?: PlayerResolvable | null;
	involvedRecipe?: RecipeResolvable | null;
	involvedQuest?: QuestResolvable | null;
	involvedTrade?: TradeResolvable | null;
}

export type ActivityLogID = ActivityLog['id'];
export type ActivityLogResolvable =
	| { id: ActivityLogID }
	| ActivityLogID