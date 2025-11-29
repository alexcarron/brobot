import { toPropertyValues } from "../../../../utilities/data-structure-utils";
import { InvalidArgumentError } from "../../../../utilities/error-utils";
import { isOneSymbol } from "../../../../utilities/string-checks-utils";
import { isDefined } from "../../../../utilities/types/type-guards";
import { CharacterRepository } from "../../repositories/character.repository";
import { asMinimalCharacters, CharacterDefintion } from '../../types/character.types';
import { getCharacterValueFromID, getIDfromCharacterValue } from "../../utilities/character.utility";
import { DatabaseQuerier, toPlaceholdersList } from "../database-querier";


/**
 * Syncronizes the database to match a list of characters without breaking existing data.
 * @param db - The database querier instance used for executing SQL statements.
 * @param characterDefintions - An array of character objects to be inserted.
 */
export const syncCharactersToDB = (
	db: DatabaseQuerier,
	characterDefintions: Readonly<CharacterDefintion[]>
) => {
	const characterRepository = new CharacterRepository(db);

	const characterIDs = toPropertyValues([...characterDefintions], 'id').filter(isDefined);
	const characterValues = toPropertyValues([...characterDefintions], 'value').filter(isDefined);

	db.runTransaction(() => {
		const deleteCharactersNotDefined = db.getQuery(
			`DELETE FROM character
			WHERE
				id NOT IN ${toPlaceholdersList(characterIDs)}
				AND value NOT IN ${toPlaceholdersList(characterValues)}`,
		);
		deleteCharactersNotDefined.run(...characterIDs, ...characterValues);

		const findExistingCharacters = db.getQuery(
			`SELECT * FROM character
			WHERE
				id IN ${toPlaceholdersList(characterIDs)}
				OR value IN ${toPlaceholdersList(characterValues)}`,
		);
		const existingDBCharacters = asMinimalCharacters(
			findExistingCharacters.getRows(
				...characterIDs, ...characterValues
			)
		);

		const existingCharacterDefinitions: CharacterDefintion[] = [];
		const newCharacterDefinitions: CharacterDefintion[] = [];

		for (const characterDefintion of characterDefintions) {
			if (!isOneSymbol(characterDefintion.value))
				throw new InvalidArgumentError("insertCharactersToDB: character value must be a single character.");

			if (
				characterDefintion.value !== undefined &&
				characterDefintion.id !== undefined
			) {
				if (getIDfromCharacterValue(characterDefintion.value) !== characterDefintion.id)
					throw new InvalidArgumentError(`insertCharactersToDB: character id ${characterDefintion.id} does not match character value ${characterDefintion.value}.`);

				if (getCharacterValueFromID(characterDefintion.id) !== characterDefintion.value)
					throw new InvalidArgumentError(`insertCharactersToDB: character value ${characterDefintion.value} does not match character id ${characterDefintion.id}.`);
			}

			if (existingDBCharacters.some(existingCharacter =>
				existingCharacter.id === characterDefintion.id ||
				existingCharacter.value === characterDefintion.value
			)) {
				existingCharacterDefinitions.push(characterDefintion);
			}
			else {
				newCharacterDefinitions.push(characterDefintion);
			}
		}

		for (const characterDefintion of existingCharacterDefinitions) {
			let id = characterDefintion.id;
			if (id === undefined)
				id = getIDfromCharacterValue(characterDefintion.value);

			characterRepository.updateCharacter({
				id,
				...characterDefintion
			});
		}

		for (const newCharacterDefinition of newCharacterDefinitions) {
			characterRepository.addCharacter(newCharacterDefinition);
		}
	});
}
