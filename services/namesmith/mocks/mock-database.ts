import DatabasePkg from 'better-sqlite3';
import { applySchemaToDB } from '../database/queries/apply-schema';
import { addInitialDataToDB } from '../database/static-data/insert-static-data';
import { DatabaseQuerier } from '../database/database-querier';

let cachedSeededDBBuffer: Buffer | undefined;

const getSeededDBBuffer = (): Buffer => {
	if (cachedSeededDBBuffer === undefined) {
		const db = new DatabaseQuerier({inMemory: true});
		applySchemaToDB(db);
		addInitialDataToDB(db);
		cachedSeededDBBuffer = db.db.serialize();
	}

	return cachedSeededDBBuffer;
}

/**
 * Creates an in-memory SQLite database with the schema and initial data for Namesmith already populated.
 * Clones a cached seeded database instead of re-running schema/static-data setup on every call.
 * @returns The in-memory database.
 */
export const createMockDB = (): DatabaseQuerier => {
	const rawDB = new DatabasePkg(getSeededDBBuffer());
	rawDB.pragma("synchronous = OFF");
	rawDB.pragma("journal_mode = MEMORY");
	rawDB.pragma("temp_store = MEMORY");
	return new DatabaseQuerier(rawDB);
}
