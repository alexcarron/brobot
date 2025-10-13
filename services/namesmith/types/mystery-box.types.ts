/**
 * An object mapping character values to their weights.
 * @example
 * { "A": 1, "B": 2, "C": 3 }
 */
export type CharacterOdds = Record<string, number>;

export type MinimalMysteryBox = {
	id: number;
	name: string;
	tokenCost: number;
}

export type MysteryBox = MinimalMysteryBox & {
	characterOdds: CharacterOdds;
}

/**
 * DBMysteryBox represents a Mystery Box stored in the database.
 * Currently identical to MysteryBox but kept for semantic clarity.
 */
export type DBMysteryBox = MinimalMysteryBox;

export interface DBCharacterOddsRow {
	mysteryBoxID: number;
	characterID: number;
	weight: number;
}

export type MysteryBoxID = MinimalMysteryBox["id"];
export type MysteryBoxName = MinimalMysteryBox["name"];

export type MysteryBoxResolveable =
	MinimalMysteryBox | MysteryBox | MysteryBoxID;
