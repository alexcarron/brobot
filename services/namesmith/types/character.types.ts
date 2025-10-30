export interface Character {
  id: number;
  value: string;
  rarity: number;
}

/**
 * DBCharacter represents a Character stored in the database.
 * Currently identical to Character but kept for semantic clarity.
 */
export type DBCharacter = Character;

export type CharacterID = Character["id"];
export type CharacterValue = Character["value"];
export type CharacterResolvable =
	| Character
	| {id: CharacterID}
	| CharacterID
	| CharacterValue;