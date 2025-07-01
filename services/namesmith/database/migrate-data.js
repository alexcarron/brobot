const CharacterRepository = require("../repositories/character.repository");
const MysteryBoxRepository = require("../repositories/mysteryBox.repository");
const { getIDfromCharacterValue } = require("../utilities/character.utility");
const getDatabase = require("./get-database");
const db = getDatabase();

async function migrateCharacters() {
	const characterRepo = new CharacterRepository();
	const characters = await characterRepo.getCharacters();

	const insertCharacter = db.prepare("INSERT OR IGNORE INTO character (id, value, rarity) VALUES (@id, @value, @rarity)");
	const insertTag = db.prepare("INSERT OR IGNORE INTO characterTag (characterID, tag) VALUES (@characterID, @tag)");

	const insertCharacters = db.transaction((characters) => {
		for (const character of characters) {
			insertCharacter.run(character);
			for (const tag of character.tags) {
				insertTag.run({ characterID: character.id, tag });
			}
		}
	});

	insertCharacters(characters);
}

async function migrateMysteryBoxes() {
	const mysteryBoxRepo = new MysteryBoxRepository();
	const mysteryBoxes = await mysteryBoxRepo.getMysteryBoxes();


	const insertMysteryBox = db.prepare("INSERT OR IGNORE INTO mysteryBox (name, tokenCost) VALUES (@name, @tokenCost)");
	const insertMysteryBoxCharacterOdds = db.prepare("INSERT OR IGNORE INTO mysteryBoxCharacterOdds (mysteryBoxID, characterID, weight) VALUES (@mysteryBoxID, @characterID, @weight)");

	const insertMysteryBoxes = db.transaction((mysteryBoxes) => {
		db.exec("DELETE FROM mysteryBoxCharacterOdds");
		db.exec("DELETE FROM mysteryBox");

		// SET AUTO INCREMENT TO 1
		db.exec("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'mysteryBox'");

		for (const mysteryBox of mysteryBoxes) {
			const result = insertMysteryBox.run(mysteryBox);
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

async function main() {
	await migrateCharacters();
	await migrateMysteryBoxes();
}

main();