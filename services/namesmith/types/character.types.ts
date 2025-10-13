import { Without } from "../../../utilities/types/generic-types";

export interface Character {
  id: number;
  value: string;
  rarity: number;
	tags: string[];
}

/**
 * A character without its subentities.
 */
export type MinimalCharacter = Without<Character, "tags">;

/**
 * DBCharacter represents a Character stored in the database.
 * Currently identical to Character but kept for semantic clarity.
 */
export type DBCharacter = MinimalCharacter

export interface DBCharacterWithTags extends DBCharacter {
	tags: string | null;
}

export type CharacterID = MinimalCharacter["id"];
export type CharacterValue = MinimalCharacter["value"];

export type CharacterResolvable =
	| MinimalCharacter
	| Character
	| CharacterID
	| CharacterValue;