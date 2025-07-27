export type CharacterOdds = Record<string, number>;

export interface MysteryBox {
	id: number;
	name: string;
	tokenCost: number;
}

export interface MysteryBoxWithOdds extends MysteryBox {
	characterOdds: CharacterOdds;
}

export interface DBMysteryBox extends MysteryBox {}

export interface DBCharacterOddsRow {
	mysteryBoxID: number;
	characterID: number;
	weight: number;
}

export type MysteryBoxID = MysteryBox["id"];

export type MysteryBoxResolveable =
	MysteryBox | MysteryBoxWithOdds | MysteryBoxID;
