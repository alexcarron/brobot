import { InvalidArgumentError, validateArguments } from "../../../utilities/error-utils";
import { WithOptional } from "../../../utilities/types/generic-types";
import { CharacterWithTags } from "../types/character.types";
import { MysteryBoxWithOdds } from "../types/mystery-box.types";
import { Perk } from "../types/perk.types";
import { Recipe } from "../types/recipe.types";
import { getIDfromCharacterValue, getCharacterValueFromID } from "../utilities/character.utility";
import { ForeignKeyConstraintError } from "../utilities/error.utility";
import { DatabaseQuerier } from "./database-querier";

/**
 * Inserts an array of character objects into the database.
 * Each character is inserted into the 'character' table, and its associated tags are inserted into the 'characterTag' table.
 * If a character or tag already exists, it will be ignored to prevent duplication.
 * @param db - The database querier instance used for executing SQL statements.
 * @param characters - An array of character objects to be inserted.
 */
export const insertCharactersToDB = (db: DatabaseQuerier, characters: CharacterWithTags[]) => {
	validateArguments("insertCharactersToDB",
		{db, type: DatabaseQuerier},
		{characters, type: "Array"},
	);

	const insertCharacter = db.getQuery("INSERT OR IGNORE INTO character (id, value, rarity) VALUES (@id, @value, @rarity)");
	const insertTag = db.getQuery("INSERT OR IGNORE INTO characterTag (characterID, tag) VALUES (@characterID, @tag)");

	const insertCharacters = db.getTransaction((characters: CharacterWithTags[]) => {
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
			for (const tag of character.tags) {
				insertTag.run({ characterID: character.id, tag });
			}
		}
	});

	insertCharacters(characters);
}

/**
 * Inserts an array of mystery box objects into the database.
 * Each mystery box is inserted into the 'mysteryBox' table, and its associated character odds
 * are inserted into the 'mysteryBoxCharacterOdds' table. Existing entries are ignored to prevent duplication.
 * The function first clears existing mystery box data and resets the auto-increment counter.
 * @param db - The database querier instance used for executing SQL statements.
 * @param mysteryBoxes - An array of mystery box objects to be inserted.
 */
export const insertMysteryBoxesToDB = (db: DatabaseQuerier, mysteryBoxes: MysteryBoxWithOdds[]) => {
	if (!Array.isArray(mysteryBoxes))
		throw new InvalidArgumentError("insertMysteryBoxesToDB: mysteryBoxes must be an array.");

	if (!(db instanceof DatabaseQuerier))
		throw new InvalidArgumentError("insertMysteryBoxesToDB: db must be an instance of DatabaseQuerier.");

	const insertMysteryBox = db.getQuery("INSERT OR IGNORE INTO mysteryBox (name, tokenCost) VALUES (@name, @tokenCost)");
	const insertMysteryBoxCharacterOdds = db.getQuery("INSERT OR IGNORE INTO mysteryBoxCharacterOdds (mysteryBoxID, characterID, weight) VALUES (@mysteryBoxID, @characterID, @weight)");

	const insertMysteryBoxes = db.getTransaction((mysteryBoxes: MysteryBoxWithOdds[]) => {
		db.run("DELETE FROM mysteryBoxCharacterOdds");
		db.run("DELETE FROM mysteryBox");

		// SET AUTO INCREMENT TO 1
		db.run("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'mysteryBox'");

		for (const mysteryBox of mysteryBoxes) {
			const result = insertMysteryBox.run({
				name: mysteryBox.name,
				tokenCost: mysteryBox.tokenCost
			});
			const newId = result.lastInsertRowid;

			for (const [characterValue, weight] of Object.entries(mysteryBox.characterOdds)) {
				const characterID = getIDfromCharacterValue(characterValue);
				const insertCharacterOdds = () =>
					insertMysteryBoxCharacterOdds.run({
						mysteryBoxID: newId,
						characterID,
						weight
					});

				try {
					insertCharacterOdds();
				}
				catch (error) {
					if (!(error instanceof ForeignKeyConstraintError))
						throw error;

					const character: CharacterWithTags = {
						id: characterID,
						value: characterValue,
						rarity: weight,
						tags: []
					};

					insertCharactersToDB(db, [character]);
					insertCharacterOdds();
				}
			}
		}
	});

	insertMysteryBoxes(mysteryBoxes);
}

/**
 * Inserts a list of recipes into the database.
 * @param db - The database querier used to execute queries.
 * @param recipes - An array of recipe objects to be inserted. Each recipe can optionally include an 'id'. If 'id' is not provided, it will be auto-generated.
 */
export const insertRecipesToDB = (
	db: DatabaseQuerier,
	recipes: WithOptional<Recipe, "id">[]
) => {
	const insertRecipeIntoDB = db.getQuery("INSERT INTO recipe (inputCharacters, outputCharacters) VALUES (@inputCharacters, @outputCharacters)");

	const insertRecipeIntoDBWithID = db.getQuery("INSERT INTO recipe (id, inputCharacters, outputCharacters) VALUES (@id, @inputCharacters, @outputCharacters)");

	const insertRecipes = db.getTransaction((recipes: WithOptional<Recipe, "id">[]) => {
		db.run("DELETE FROM recipe");

		// SET AUTO INCREMENT TO 1
		db.run("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'recipe'");

		for (const recipe of recipes) {
			if (recipe.id === undefined)
				insertRecipeIntoDB.run({
					inputCharacters: recipe.inputCharacters,
					outputCharacters: recipe.outputCharacters
				});
			else
				insertRecipeIntoDBWithID.run({
					id: recipe.id,
					inputCharacters: recipe.inputCharacters,
					outputCharacters: recipe.outputCharacters
				});
		}
	});

	insertRecipes(recipes);
}

/**
 * Inserts a list of perks into the database.
 * @param db - The database querier used to execute queries.
 * @param perks - An array of perk objects to be inserted. Each perk can optionally include an 'id'. If 'id' is not provided, it will be auto-generated.
 */
export function insertPerksToDB(
	db: DatabaseQuerier,
	perks: WithOptional<Perk, "id">[]
) {
	const insertPerkIntoDB = db.getQuery("INSERT INTO perk (name, description) VALUES (@name, @description)");
	const insertPerkIntoDBWithID = db.getQuery("INSERT INTO perk (id, name, description) VALUES (@id, @name, @description)");

	const insertPerks = db.getTransaction((perks: WithOptional<Perk, "id">[]) => {
		db.run("DELETE FROM perk");

		// SET AUTO INCREMENT TO 1
		db.run("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'perk'");

		for (const perk of perks) {
			if (perk.id === undefined)
				insertPerkIntoDB.run({
					name: perk.name,
					description: perk.description
				});
			else
				insertPerkIntoDBWithID.run({
					id: perk.id,
					name: perk.name,
					description: perk.description
				});
		}
	});

	insertPerks(perks);
}