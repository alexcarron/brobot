import { DatabaseQuerier } from './database-querier';
import { getDatabase } from './get-database';
import { applySchemaToDB } from './queries/apply-schema';
import { addInitialDataToDB } from './static-data/insert-static-data';
import { startBackupCronJob } from './backup-database';

/**
 * Sets up the Namesmith database by creating the schema and inserting initial data.
 * It is the caller's responsibility to close the database when finished.
 * @returns The Namesmith database instance.
 */
export const setupDatabase = async (): Promise<DatabaseQuerier> => {
	const db = getDatabase();
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	applySchemaToDB(db);
	addInitialDataToDB(db);
	await startBackupCronJob();
	return db;
};