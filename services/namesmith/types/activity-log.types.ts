import { toEnumFromStrings, ValuesOf } from "../../../utilities/enum-utilts";
import { ExtractDomainType, ExtractType, number, object, string, strings } from "../../../utilities/runtime-types-utils";
import { DBDate } from "../utilities/db.utility";
import { Perk, PerkResolvable } from "./perk.types";
import { Player, PlayerID, PlayerResolvable } from "./player.types";
import { Quest, QuestResolvable } from "./quest.types";
import { Recipe, RecipeResolvable } from "./recipe.types";
import { Trade, TradeResolvable } from "./trade.types";
import { MysteryBox, MysteryBoxResolvable } from "./mystery-box.types";
import { Role, RoleResolvable } from "./role.types";

export const ActivityTypes = toEnumFromStrings(
	'changeName',
	'publishName',
	'mineTokens',
	'claimRefill',
	'buyMysteryBox',
	'craftCharacters',
	'initiateTrade',
	'acceptTrade',
	'declineTrade',
	'modifyTrade',
	'completeQuest',
	'chooseRole',
	'pickPerk',
);

export type ActivityType = ValuesOf<typeof ActivityTypes>;
export const activityTypes: ActivityType[] = Object.values(ActivityTypes);

export const DBActivityLogType = object.asTransformableType('MinimalActivityLog', {
	id: number,
	timeOccured: DBDate,
	playerID: string,
	type: strings(...activityTypes),
	nameChangedFrom: string.orNull,
	currentName: string,
	charactersGained: string.orNull,
	charactersLost: string.orNull,
	tokensDifference: number,
	timeCooldownExpired: DBDate.orNull,
	involvedPlayerID: string.orNull,
	involvedRecipeID: number.orNull,
	involvedQuestID: number.orNull,
	involvedTradeID: number.orNull,
	involvedPerkID: number.orNull,
	involvedRoleID: number.orNull,
	involvedMysteryBoxID: number.orNull,
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
	nameChangedFrom: string | null;
	currentName: string;
	charactersGained: string | null;
	charactersLost: string | null;
	tokensDifference: number;
	timeCooldownExpired: Date | null;
	involvedPlayer: Player | null;
	involvedRecipe: Recipe | null;
	involvedQuest: Quest | null;
	involvedTrade: Trade | null;
	involvedPerk: Perk | null;
	involvedRole: Role | null;
	involvedMysteryBox: MysteryBox | null;
}

export type ActivityLogDefinition = {
	id?: number;
	timeOccured?: Date;
	player: PlayerResolvable;
	type: ActivityType;
	nameChangedFrom?: string | null;
	currentName?: string;
	charactersGained?: string | null;
	charactersLost?: string | null;
	tokensDifference?: number;
	timeCooldownExpired?: Date | null;
	involvedPlayer?: PlayerResolvable | null;
	involvedRecipe?: RecipeResolvable | null;
	involvedQuest?: QuestResolvable | null;
	involvedTrade?: TradeResolvable | null;
	involvedPerk?: PerkResolvable | null;
	involvedRole?: RoleResolvable | null;
	involvedMysteryBox?: MysteryBoxResolvable | null;
}

export type ActivityLogID = ActivityLog['id'];
export type ActivityLogResolvable =
	| { id: ActivityLogID }
	| ActivityLogID

export type NameInterval = {
	startTime: Date,
	endTime: Date,
	playerID: PlayerID,
	name: string
}