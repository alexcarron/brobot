import { WithOptional } from '../../../utilities/types/generic-types';
export type Character = {
  id: number;
  value: string;
  rarity: number;
}

export type DBCharacter = Character;
export type CharacterDefintion = WithOptional<Character, "id">;

export type CharacterID = Character["id"];
export type CharacterValue = Character["value"];
export type CharacterResolvable =
	| Character
	| {id: CharacterID}
	| CharacterID
	| CharacterValue;