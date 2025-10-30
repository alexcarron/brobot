import { Without } from "../../../utilities/types/generic-types";

/**
 * An object mapping character values to their weights.
 * @example
 * { "A": 1, "B": 2, "C": 3 }
 */
export type CharacterOdds = Record<string, number>;

/**
 * A row in the mysteryBoxCharacterOdds table.
 */
export type DBCharacterOddsRow = {
	mysteryBoxID: number;
	characterID: number;
	weight: number;
}

export type MysteryBox = {
	id: number;
	name: string;
	tokenCost: number;
	characterOdds: CharacterOdds;
}

export type MinimalMysteryBox = Without<MysteryBox, "characterOdds">;

/**
 * DBMysteryBox represents a Mystery Box stored in the database.
 * Currently identical to MinimalMysteryBox but kept for semantic clarity.
 */
export type DBMysteryBox = MinimalMysteryBox;

export type MysteryBoxID = MinimalMysteryBox["id"];
export type MysteryBoxName = MinimalMysteryBox["name"];
export type MysteryBoxResolveable =
	| {id: MysteryBoxID}
	| MysteryBoxID;
