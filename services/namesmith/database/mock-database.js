const Database = require('better-sqlite3');
const { addSchemaToDB, addInitialDataToDB } = require('./static-queries/static-queries');

/**
 * Creates an in-memory SQLite database with the schema and initial data for Namesmith already populated.
 *
 * @returns {Database} The in-memory database.
 */
function createMockDB() {
	const db = new Database(':memory:');
	addSchemaToDB(db);
	addInitialDataToDB(db);
	return db;
}

module.exports = { createMockDB };