export type CharacterOdds = Record<string, number>;

export interface MysteryBox {
	id: number;
	name: string;
	tokenCost: number;
}

export interface MysteryBoxWithOdds extends MysteryBox {
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

export type MysteryBoxResolveable =
	MysteryBox | MysteryBoxWithOdds | MysteryBoxID;
