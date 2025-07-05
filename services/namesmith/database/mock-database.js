const Database = require('better-sqlite3');

/**
 * Creates an in-memory SQLite database with the schema and initial data for Namesmith already populated.
 *
 * @returns {Database} The in-memory database.
 */
const createMockDB = () => {
	const { addInitialDataToDB, applySchemaToDB } = require('./setup-database');
	const db = new Database(':memory:');
	applySchemaToDB(db);
	addInitialDataToDB(db);
	return db;
}

/**
 * Adds a player to the database with the given properties.
 *
 * @param {Database} db - The in-memory database.
 * @param {{
 * 	id: string,
 * 	currentName: string,
 * 	publishedName: string | null,
 * 	tokens: number,
 * 	role: string | null,
 * 	inventory: string
 * }} playerData - The player data to add.
 * @returns {{
 * 	id: string,
 * 	currentName: string,
 * 	publishedName: string | null,
 * 	tokens: number,
 * 	role: string | null,
 * 	inventory: string
 * }} The player object that was added to the database.
 */
const addMockPlayer = (db, { id, currentName, publishedName, tokens, role, inventory }) => {
	const insertPlayer = db.prepare(`
		INSERT INTO player (id, currentName, publishedName, tokens, role, inventory)
		VALUES (@id, @currentName, @publishedName, @tokens, @role, @inventory)
	`);
	const player = insertPlayer.run({ id, currentName, publishedName, tokens, role, inventory });
	return player;
};

/**
 * Adds a vote to the database with the given properties.
 *
 * @param {Database} db - The in-memory database.
 * @param {{ voterID: string, playerVotedForID: string }} voteData - The vote data to add.
 * @returns {{ voterID: string, playerVotedForID: string }} The vote object that was added to the database.
 */
const addMockVote = (db, { voterID, playerVotedForID }) => {
	const insertVote = db.prepare(`
		INSERT INTO vote (voterID, playerVotedForID)
		VALUES (@voterID, @playerVotedForID)
	`);
	const vote = insertVote.run({ voterID, playerVotedForID });
	return vote;
};

module.exports = { createMockDB, addMockPlayer, addMockVote };