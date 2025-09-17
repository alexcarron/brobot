import { applySchemaToDB } from '../database/queries/apply-schema';
import { addInitialDataToDB } from '../database/static-data/insert-static-data';
import { DatabaseQuerier } from '../database/database-querier';

/**
 * Creates an in-memory SQLite database with the schema and initial data for Namesmith already populated.
 * @returns The in-memory database.
 */
export const createMockDB = (): DatabaseQuerier => {
	const db = new DatabaseQuerier({inMemory: true});
	applySchemaToDB(db);
	addInitialDataToDB(db);
	return db;
}
