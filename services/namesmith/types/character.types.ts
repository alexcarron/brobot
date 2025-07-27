export interface Character {
  id: number;
  value: string;
  rarity: number;
}

export interface CharacterWithTags extends Character {
  tags: string[];
}

export interface DBCharacter extends Character {}
export interface DBCharacterWithTags extends DBCharacter {
	tags: string;
}
