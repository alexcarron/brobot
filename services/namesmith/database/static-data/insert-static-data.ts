import { insertCharactersToDB, insertMysteryBoxesToDB, insertPerksToDB, insertRecipesToDB, insertRolesToDB } from "../db-inserters";
import { DatabaseQuerier } from '../database-querier';
import { perks } from './perks';
import { roles } from './roles';
import { characters } from './characters';
import { mysteryBoxes } from './mystery-boxes';
import { recipes } from './recipes';

/**
 * Adds the initial data to the database.
 * @param db - The database querier instance used for executing SQL statements.
 */
export const addInitialDataToDB = (db: DatabaseQuerier) => {
	const insertInitialGameState = db.prepare(`INSERT OR IGNORE INTO gameState (id) VALUES (1);`);
	insertInitialGameState.run();

	insertCharactersToDB(db, characters);
	insertMysteryBoxesToDB(db, mysteryBoxes);
	insertRecipesToDB(db, recipes);
	insertPerksToDB(db, perks);
	insertRolesToDB(db, roles);
}