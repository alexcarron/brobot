import { ExtractType, number, object, string } from '../../../utilities/runtime-types-utils';
import { WithOptional } from '../../../utilities/types/generic-types';

const DBCharacterType = object.asType({
  id: number,
  value: string,
  rarity: number,
});
export const asMinimalCharacter = DBCharacterType.from;
export const asMinimalCharacters = DBCharacterType.fromAll;
export type MinimalCharacter = ExtractType<typeof DBCharacterType>

export type Character = MinimalCharacter;
export type CharacterDefintion = WithOptional<Character, "id">;

export type CharacterID = Character["id"];
export type CharacterValue = Character["value"];
export type CharacterResolvable =
	| Character
	| {id: CharacterID}
	| CharacterID
	| CharacterValue;