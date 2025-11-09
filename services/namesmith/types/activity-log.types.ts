import { toEnumFromStrings, ValuesOf } from "../../../utilities/enum-utilts";
import { Override } from "../../../utilities/types/generic-types";
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

export type Activity = {
	id: string;
	player: Player;
	type: ActivityType;
	tokensDifference: number;
	involvedPlayer: Player | null;
	involvedRecipe: Recipe | null;
}

export type DBActivityLog = {
	id: string;
	playerID: string;
	type: ActivityType;
	tokensDifference: number;
	involvedPlayerID: string | null;
	involvedRecipeID: number | null;
}

export type ActivityDefinition = Override<Activity, {
	id?: string,
	player: PlayerResolvable,
	tokensDifference?: number,
	involvedPlayer?: PlayerResolvable,
	involvedRecipe?: RecipeResolvable,
}>

export type ActivityID = Activity['id'];
export type ActivityResolvable =
	| { id: ActivityID }
	| ActivityID