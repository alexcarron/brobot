export interface Character {
  id: number;
  value: string;
  rarity: number;
}

export interface CharacterWithTags extends Character {
  tags: string[];
}


/**
 * DBCharacter represents a Character stored in the database.
 * Currently identical to Character but kept for semantic clarity.
 */
export type DBCharacter = Character

export interface DBCharacterWithTags extends DBCharacter {
	tags: string | null;
}

export type CharacterID = Character["id"];

export type CharacterResolvable = Character | CharacterWithTags | CharacterID;