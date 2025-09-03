/**
 * An object mapping character values to their weights.
 * @example
 * { "A": 1, "B": 2, "C": 3 }
 */
export type CharacterOdds = Record<string, number>;

export type MysteryBox = {
	id: number;
	name: string;
	tokenCost: number;
}

export type MysteryBoxWithOdds = MysteryBox & {
	characterOdds: CharacterOdds;
}

/**
 * DBMysteryBox represents a Mystery Box stored in the database.
 * Currently identical to MysteryBox but kept for semantic clarity.
 */
export type DBMysteryBox = MysteryBox

export interface DBCharacterOddsRow {
	mysteryBoxID: number;
	characterID: number;
	weight: number;
}

export type MysteryBoxID = MysteryBox["id"];
export type MysteryBoxName = MysteryBox["name"];

export type MysteryBoxResolveable =
	MysteryBox | MysteryBoxWithOdds | MysteryBoxID;
