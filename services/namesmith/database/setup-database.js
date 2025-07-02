const fs = require('fs');
const path = require('path');
const { insertCharactersToDB, insertMysteryBoxesToDB } = require('./db-inserters');
const getDatabase = require('./get-database');

const currDir = __dirname;
const schemaPath = path.join(currDir, 'queries', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

const charactersPath = path.join(currDir, 'static-data', 'characters.json');
const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));

const mysteryBoxesPath = path.join(currDir, 'static-data', 'mystery-boxes.json');
const mysteryBoxes = JSON.parse(fs.readFileSync(mysteryBoxesPath, 'utf8'));

const applySchemaToDB = (db) => {
	db.exec(schema);
}

const addInitialDataToDB = (db) => {
	const insertInitialGameState = db.prepare(`INSERT OR IGNORE INTO gameState (id) VALUES (1);`);
	insertInitialGameState.run();

	insertCharactersToDB(db, characters);
	insertMysteryBoxesToDB(db, mysteryBoxes);
}

/**
 * Sets up the Namesmith database by creating the schema and inserting initial data.
 * It is the caller's responsibility to close the database when finished.
 *
 * @returns {Database} The Namesmith database instance.
 */
const setupDatabase = () => {
	const db = getDatabase();
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	applySchemaToDB(db);
	addInitialDataToDB(db);
	return db;
};

module.exports = { setupDatabase, applySchemaToDB, addInitialDataToDB };