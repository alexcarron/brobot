import { ExtractType, number, object, string } from "../../../utilities/runtime-types-utils";
import { WithOptional } from "../../../utilities/types/generic-types";
export type MysteryBox = {
	id: number;
	name: string;
	tokenCost: number;
	characterOdds: CharacterOdds;
}

export type MinimalMysteryBoxDefinition =
	WithOptional<MinimalMysteryBox, 'id'>;

export const DBMysteryBoxType = object.asType({
	id: number,
	name: string,
	tokenCost: number
});
export const asMinimalMysteryBox = DBMysteryBoxType.from;
export const asMinimalMysteryBoxes = DBMysteryBoxType.fromAll;
export type MinimalMysteryBox = ExtractType<typeof DBMysteryBoxType>;

export type MysteryBoxDefinition =
	WithOptional<MysteryBox, 'id'>;

export type MysteryBoxID = MinimalMysteryBox["id"];
export type MysteryBoxName = MinimalMysteryBox["name"];
export type MysteryBoxResolvable =
	| {id: MysteryBoxID}
	| MysteryBoxID;

export const DBCharacterOddType = object.asType({
	mysteryBoxID: number,
	characterID: number,
	weight: number,
});
export const asDBCharacterOdds = DBCharacterOddType.fromAll;
export type DBCharacterOddsRow = ExtractType<typeof DBCharacterOddType>;

/**
 * An object mapping character values to their weights.
 * @example
 * { "A": 1, "B": 2, "C": 3 }
 */
export type CharacterOdds = Record<string, number>;