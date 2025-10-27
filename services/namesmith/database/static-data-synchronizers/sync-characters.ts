import { InvalidArgumentError } from "../../../../utilities/error-utils";
import { Character } from "../../types/character.types";
import { getCharacterValueFromID, getIDfromCharacterValue } from "../../utilities/character.utility";
import { DatabaseQuerier } from "../database-querier";


/**
 * Syncronizes the database to match a list of characters without breaking existing data.
 * @param db - The database querier instance used for executing SQL statements.
 * @param characters - An array of character objects to be inserted.
 */
export const syncCharactersToDB = (
	db: DatabaseQuerier,
	characters: Readonly<Character[]>
) => {
	const insertCharacter = db.getQuery("INSERT OR IGNORE INTO character (id, value, rarity) VALUES (@id, @value, @rarity)");

	const insertCharacters = db.getTransaction((characters: Character[]) => {
		for (const character of characters) {
			if (character.value.length !== 1)
				throw new InvalidArgumentError("insertCharactersToDB: character value must be a single character.");

			if (getIDfromCharacterValue(character.value) !== character.id)
				throw new InvalidArgumentError(`insertCharactersToDB: character id ${character.id} does not match character value ${character.value}.`);

			if (getCharacterValueFromID(character.id) !== character.value)
				throw new InvalidArgumentError(`insertCharactersToDB: character value ${character.value} does not match character id ${character.id}.`);


			insertCharacter.run({
				id: character.id,
				value: character.value,
				rarity: character.rarity
			});
		}
	});

	insertCharacters(characters);
}
