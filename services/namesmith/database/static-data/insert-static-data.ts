import { DatabaseQuerier } from '../database-querier';
import { perks } from './perks';
import { roles } from './roles';
import { characters } from './characters';
import { mysteryBoxes } from './mystery-boxes';
import { recipes } from './recipes';
import { syncCharactersToDB } from '../static-data-synchronizers/sync-characters';
import { syncMysteryBoxesToDB } from '../static-data-synchronizers/sync-mystery-boxes';
import { syncPerksToDB } from '../static-data-synchronizers/sync-perks';
import { syncRecipesToDB } from '../static-data-synchronizers/sync-recipes';
import { syncRolesToDB } from '../static-data-synchronizers/sync-roles';
import { syncQuestsToDB } from '../static-data-synchronizers/sync-quests';
import { quests } from './quests';

/**
 * Adds the initial data to the database.
 * @param db - The database querier instance used for executing SQL statements.
 */
export const addInitialDataToDB = (db: DatabaseQuerier) => {
	const insertInitialGameState = db.prepare(`INSERT OR IGNORE INTO gameState (id) VALUES (1);`);
	insertInitialGameState.run();

	syncCharactersToDB(db, characters);
	syncMysteryBoxesToDB(db, mysteryBoxes);
	syncRecipesToDB(db, recipes);
	syncPerksToDB(db, perks);
	syncRolesToDB(db, roles);
	syncQuestsToDB(db, quests);
}