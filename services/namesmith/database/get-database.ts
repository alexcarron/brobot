import Database from "better-sqlite3";
import path from 'path';
import { DatabaseQuerier } from "./database-querier";

const currDir = __dirname;
export const dbPath = path.join(currDir, 'db', 'namesmith.db');

/**
 * Returns an instance of the database.
 * @returns An instance of the Database class for Namesmith.
 */
export const getDatabase = (): DatabaseQuerier => {
	return new DatabaseQuerier(new Database(dbPath));
}