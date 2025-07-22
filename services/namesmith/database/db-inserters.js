const { InvalidArgumentError, validateArguments } = require("../../../utilities/error-utils");
const { getIDfromCharacterValue, getCharacterValueFromID } = require("../utilities/character.utility");
const DatabaseQuerier = require("./database-querier");

/**
 * Inserts an array of character objects into the database.
 * Each character is inserted into the 'character' table, and its associated tags are inserted into the 'characterTag' table.
 * If a character or tag already exists, it will be ignored to prevent duplication.
 * @param {DatabaseQuerier} db - The database querier instance used for executing SQL statements.
 * @param {Array<object>} characters - An array of character objects to be inserted.
 */
const insertCharactersToDB = (db, characters) => {
	validateArguments("insertCharactersToDB",
		{db, type: DatabaseQuerier},
		{characters, type: "Array"},
	);

	const insertCharacter = db.getQuery("INSERT OR IGNORE INTO character (id, value, rarity) VALUES (@id, @value, @rarity)");
	const insertTag = db.getQuery("INSERT OR IGNORE INTO characterTag (characterID, tag) VALUES (@characterID, @tag)");

	const insertCharacters = db.getTransaction((characters) => {
		for (const character of characters) {
			if (character.id === undefined)
				throw new InvalidArgumentError("insertCharactersToDB: character id is undefined.");

			if (typeof character.id !== "number")
				throw new InvalidArgumentError(`insertCharactersToDB: character id must be a nurmber, but got ${character.id}.`);

			if (character.value === undefined)
				throw new InvalidArgumentError("insertCharactersToDB: character value is undefined.");

			if (typeof character.value !== "string")
				throw new InvalidArgumentError(`insertCharactersToDB: character value must be a string, but got ${character.value}.`);

			if (character.value.length !== 1)
				throw new InvalidArgumentError("insertCharactersToDB: character value must be a single character.");

			if (getIDfromCharacterValue(character.value) !== character.id)
				throw new InvalidArgumentError(`insertCharactersToDB: character id ${character.id} does not match character value ${character.value}.`);

			if (getCharacterValueFromID(character.id) !== character.value)
				throw new InvalidArgumentError(`insertCharactersToDB: character value ${character.value} does not match character id ${character.id}.`);

			if (character.rarity === undefined)
				throw new InvalidArgumentError("insertCharactersToDB: character rarity is undefined.");

			if (typeof character.rarity !== "number")
				throw new InvalidArgumentError(`insertCharactersToDB: character rarity must be a number, but got ${character.rarity}.`);


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
 * @param {DatabaseQuerier} db - The database querier instance used for executing SQL statements.
 * @param {Array<object>} mysteryBoxes - An array of mystery box objects to be inserted.
 */

const insertMysteryBoxesToDB = (db, mysteryBoxes) => {
	if (!Array.isArray(mysteryBoxes))
		throw new InvalidArgumentError("insertMysteryBoxesToDB: mysteryBoxes must be an array.");

	if (!(db instanceof DatabaseQuerier))
		throw new InvalidArgumentError("insertMysteryBoxesToDB: db must be an instance of DatabaseQuerier.");

	const insertMysteryBox = db.getQuery("INSERT OR IGNORE INTO mysteryBox (name, tokenCost) VALUES (@name, @tokenCost)");
	const insertMysteryBoxCharacterOdds = db.getQuery("INSERT OR IGNORE INTO mysteryBoxCharacterOdds (mysteryBoxID, characterID, weight) VALUES (@mysteryBoxID, @characterID, @weight)");

	const insertMysteryBoxes = db.getTransaction((mysteryBoxes) => {
		db.run("DELETE FROM mysteryBoxCharacterOdds");
		db.run("DELETE FROM mysteryBox");

		// SET AUTO INCREMENT TO 1
		db.run("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'mysteryBox'");

		for (const mysteryBox of mysteryBoxes) {
			if (mysteryBox.name === undefined)
				throw new InvalidArgumentError("insertMysteryBoxesToDB: mystery box name is undefined.");

			if (typeof mysteryBox.name !== "string")
				throw new InvalidArgumentError(`insertMysteryBoxesToDB: mystery box name must be a string, but got ${mysteryBox.name}.`);

			if (mysteryBox.tokenCost === undefined)
				throw new InvalidArgumentError("insertMysteryBoxesToDB: mystery box token cost is undefined.");

			if (typeof mysteryBox.tokenCost !== "number")
				throw new InvalidArgumentError(`insertMysteryBoxesToDB: mystery box token cost must be a number, but got ${mysteryBox.tokenCost}.`);

			if (mysteryBox.characterOdds === undefined)
				throw new InvalidArgumentError("insertMysteryBoxesToDB: mystery box character odds is undefined.");

			if (typeof mysteryBox.characterOdds !== "object")
				throw new InvalidArgumentError(`insertMysteryBoxesToDB: mystery box character odds must be an object, but got ${mysteryBox.characterOdds}.`);

			const result = insertMysteryBox.run({
				name: mysteryBox.name,
				tokenCost: mysteryBox.tokenCost
			});
			const newId = result.lastInsertRowid;

			for (const [characterValue, weight] of Object.entries(mysteryBox.characterOdds)) {
				if (characterValue === undefined)
					throw new InvalidArgumentError("insertMysteryBoxesToDB: character value is undefined.");

				if (typeof characterValue !== "string")
					throw new InvalidArgumentError(`insertMysteryBoxesToDB: character value must be a string, but got ${characterValue}.`);

				if (weight === undefined)
					throw new InvalidArgumentError("insertMysteryBoxesToDB: character weight is undefined.");

				if (typeof weight !== "number")
					throw new InvalidArgumentError(`insertMysteryBoxesToDB: character weight must be a number, but got ${weight}.`);

				const characterID = getIDfromCharacterValue(characterValue);
				insertMysteryBoxCharacterOdds.run({
					mysteryBoxID: newId,
					characterID,
					weight
				});
			}
		}
	});

	insertMysteryBoxes(mysteryBoxes);
}

module.exports = { insertCharactersToDB, insertMysteryBoxesToDB };