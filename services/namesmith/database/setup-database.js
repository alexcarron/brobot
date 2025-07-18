const DatabaseQuerier = require('./database-querier');
const {getDatabase} = require('./get-database');
const { applySchemaToDB } = require('./queries/apply-scheme');
const { addInitialDataToDB } = require('./static-data/insert-static-data');
const { startBackupCronJob } = require('./backup-database');

/**
 * Sets up the Namesmith database by creating the schema and inserting initial data.
 * It is the caller's responsibility to close the database when finished.
 * @returns {DatabaseQuerier} The Namesmith database instance.
 */
const setupDatabase = () => {
	const db = getDatabase();
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	applySchemaToDB(db);
	addInitialDataToDB(db);
	startBackupCronJob();
	return db;
};

module.exports = { setupDatabase };