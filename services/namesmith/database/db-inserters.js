const { getIDfromCharacterValue } = require("../utilities/character.utility");

const insertCharactersToDB = async (db, characters) => {
	const insertCharacter = db.prepare("INSERT OR IGNORE INTO character (id, value, rarity) VALUES (@id, @value, @rarity)");
	const insertTag = db.prepare("INSERT OR IGNORE INTO characterTag (characterID, tag) VALUES (@characterID, @tag)");

	const insertCharacters = db.transaction((characters) => {
		for (const character of characters) {
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

const insertMysteryBoxesToDB = async (db, mysteryBoxes) => {
	const insertMysteryBox = db.prepare("INSERT OR IGNORE INTO mysteryBox (name, tokenCost) VALUES (@name, @tokenCost)");
	const insertMysteryBoxCharacterOdds = db.prepare("INSERT OR IGNORE INTO mysteryBoxCharacterOdds (mysteryBoxID, characterID, weight) VALUES (@mysteryBoxID, @characterID, @weight)");

	const insertMysteryBoxes = db.transaction((mysteryBoxes) => {
		db.exec("DELETE FROM mysteryBoxCharacterOdds");
		db.exec("DELETE FROM mysteryBox");

		// SET AUTO INCREMENT TO 1
		db.exec("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'mysteryBox'");

		for (const mysteryBox of mysteryBoxes) {
			const result = insertMysteryBox.run({
				name: mysteryBox.name,
				tokenCost: mysteryBox.tokenCost
			});
			const newId = result.lastInsertRowid;

			for (const [characterValue, weight] of Object.entries(mysteryBox.characterOdds)) {
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