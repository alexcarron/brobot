const fs = require('fs');
const path = require('path');
const { insertCharactersToDB, insertMysteryBoxesToDB } = require("../db-inserters");

const currDir = __dirname;
const charactersPath = path.join(currDir, 'characters.json');
const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));

const mysteryBoxesPath = path.join(currDir, 'mystery-boxes.json');
const mysteryBoxes = JSON.parse(fs.readFileSync(mysteryBoxesPath, 'utf8'));


const addInitialDataToDB = (db) => {
	const insertInitialGameState = db.prepare(`INSERT OR IGNORE INTO gameState (id) VALUES (1);`);
	insertInitialGameState.run();

	insertCharactersToDB(db, characters);
	insertMysteryBoxesToDB(db, mysteryBoxes);
}

module.exports = { addInitialDataToDB };