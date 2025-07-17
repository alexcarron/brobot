const Database = require("better-sqlite3");
const path = require('path');
const DatabaseQuerier = require("./database-querier");
const currDir = __dirname;
const dbPath = path.join(currDir, 'db', 'namesmith.db');

/**
 * Returns an instance of the database.
 * @returns {DatabaseQuerier} An instance of the Database class for Namesmith.
 */
const getDatabase = () => {
	return new DatabaseQuerier(new Database(dbPath));
}

module.exports = getDatabase
