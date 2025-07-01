const getDatabase = require('./get-database');
const { addSchemaToDB, addInitialDataToDB } = require('./static-queries/static-queries');

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
	addSchemaToDB(db);
	addInitialDataToDB(db);
	return db;
};

module.exports = { setupDatabase };