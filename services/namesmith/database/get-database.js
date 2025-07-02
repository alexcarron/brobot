const Database = require("better-sqlite3");
const path = require('path');
const currDir = __dirname;
const dbPath = path.join(currDir, 'db', 'namesmith.db');

/**
 * Returns an instance of the database.
 * @returns {Database} An instance of the Database class for Namesmith.
 */
const getDatabase = () => {
	return new Database(dbPath);
}

module.exports = getDatabase