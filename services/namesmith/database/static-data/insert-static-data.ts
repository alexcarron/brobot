import * as fs from 'fs';
import * as path from 'path';
import { insertCharactersToDB, insertMysteryBoxesToDB } from "../db-inserters";
import { DatabaseQuerier } from '../database-querier';

const currDir = __dirname;
const charactersPath = path.join(currDir, 'characters.json');
const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));

const mysteryBoxesPath = path.join(currDir, 'mystery-boxes.json');
const mysteryBoxes = JSON.parse(fs.readFileSync(mysteryBoxesPath, 'utf8'));


/**
 * Adds the initial data to the database.
 * @param db - The database querier instance used for executing SQL statements.
 */
export const addInitialDataToDB = (db: DatabaseQuerier) => {
	const insertInitialGameState = db.prepare(`INSERT OR IGNORE INTO gameState (id) VALUES (1);`);
	insertInitialGameState.run();

	insertCharactersToDB(db, characters);
	insertMysteryBoxesToDB(db, mysteryBoxes);
}