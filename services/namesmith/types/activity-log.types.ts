import { toEnumFromStrings, ValuesOf } from "../../../utilities/enum-utilts";
import { Player, PlayerResolvable } from "./player.types";
import { Recipe, RecipeResolvable } from "./recipe.types";

export const ActivityTypes = toEnumFromStrings(
	'craftCharacters',
	'acceptTrade',
	'buyMysteryBox',
	'mineTokens',
	'claimRefill',
	'completeQuest',
	'pickPerk',
);

export type ActivityType = ValuesOf<typeof ActivityTypes>;

export type ActivityLog = {
	id: number;
	player: Player;
	type: ActivityType;
	tokensDifference: number;
	involvedPlayer: Player | null;
	involvedRecipe: Recipe | null;
}

export type DBActivityLog = {
	id: number;
	playerID: string;
	type: ActivityType;
	tokensDifference: number;
	involvedPlayerID: string | null;
	involvedRecipeID: number | null;
}

export type ActivityLogDefinition = {
	id?: number;
	player: PlayerResolvable;
	type: ActivityType;
	tokensDifference?: number;
	involvedPlayer?: PlayerResolvable | null;
	involvedRecipe?: RecipeResolvable | null;
}

export type ActivityLogID = ActivityLog['id'];
export type ActivityLogResolvable =
	| { id: ActivityLogID }
	| ActivityLogID