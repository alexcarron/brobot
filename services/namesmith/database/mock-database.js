const Database = require('better-sqlite3');
const { applySchemaToDB } = require('./queries/apply-scheme');
const { addInitialDataToDB } = require('./static-data/insert-static-data');
const DatabaseQuerier = require('./database-querier');
const { InvalidArgumentError } = require('../../../utilities/error-utils');

/**
 * Creates an in-memory SQLite database with the schema and initial data for Namesmith already populated.
 * @returns {DatabaseQuerier} The in-memory database.
 */
const createMockDB = () => {
	const db = new DatabaseQuerier(new Database(':memory:'));
	applySchemaToDB(db);
	addInitialDataToDB(db);
	return db;
}

/**
 * Adds a player to the database with the given properties.
 * @param {DatabaseQuerier} db - The in-memory database.
 * @param {{
 * 	id: string,
 * 	currentName: string,
 * 	publishedName: string | null,
 * 	tokens: number,
 * 	role: string | null,
 * 	inventory: string
 * }} playerData - The player data to add.
 */
const addMockPlayer = (db, { id, currentName, publishedName, tokens, role, inventory }) => {
	if (id === undefined)
		throw new InvalidArgumentError("addMockPlayer: player id is undefined.");

	if (typeof id !== "string")
		throw new InvalidArgumentError(`addMockPlayer: player id must be a string, but got ${id}.`);

	if (currentName === undefined)
		throw new InvalidArgumentError("addMockPlayer: player current name is undefined.");

	if (typeof currentName !== "string")
		throw new InvalidArgumentError(`addMockPlayer: player current name must be a string, but got ${currentName}.`);

	if (tokens === undefined)
		throw new InvalidArgumentError("addMockPlayer: player tokens is undefined.");

	if (typeof tokens !== "number")
		throw new InvalidArgumentError(`addMockPlayer: player tokens must be a number, but got ${tokens}.`);

	if (inventory === undefined)
		throw new InvalidArgumentError("addMockPlayer: player inventory is undefined.");

	if (typeof inventory !== "string")
		throw new InvalidArgumentError(`addMockPlayer: player inventory must be a string, but got ${inventory}.`);

	if (publishedName === undefined)
		throw new InvalidArgumentError("addMockPlayer: player published name is undefined.");

	if (publishedName !== null && typeof publishedName !== "string")
		throw new InvalidArgumentError(`addMockPlayer: player published name must be a string or null, but got ${publishedName}.`);

	if (role === undefined)
		throw new InvalidArgumentError("addMockPlayer: player role is undefined.");

	if (role !== null && typeof role !== "string")
		throw new InvalidArgumentError(`addMockPlayer: player role must be a string or null, but got ${role}.`);

	const existingPlayer = db.getRow(
		"SELECT id FROM player WHERE id = ?",
		[id]
	);

	if (existingPlayer !== undefined) {
		// Ignore player if it already exists
		return;
	}

	const insertPlayer = db.prepare(`
		INSERT INTO player (id, currentName, publishedName, tokens, role, inventory)
		VALUES (@id, @currentName, @publishedName, @tokens, @role, @inventory)
	`);
	insertPlayer.run({ id, currentName, publishedName, tokens, role, inventory });
};

/**
 * Adds a vote to the database with the given properties.
 * @param {import('better-sqlite3').Database | DatabaseQuerier} db - The in-memory database.
 * @param {{ voterID: string, playerVotedForID: string }} voteData - The vote data to add.
 * @returns {import('better-sqlite3').RunResult} The result of the insert operation.
 */
const addMockVote = (db, { voterID, playerVotedForID }) => {
	if (voterID === undefined)
		throw new InvalidArgumentError("addMockVote: voterID is undefined.");

	if (typeof voterID !== "string")
		throw new InvalidArgumentError(`addMockVote: voterID must be a string, but got ${voterID}.`);

	if (playerVotedForID === undefined)
		throw new InvalidArgumentError("addMockVote: playerVotedForID is undefined.");

	if (typeof playerVotedForID !== "string")
		throw new InvalidArgumentError(`addMockVote: playerVotedForID must be a string, but got ${playerVotedForID}.`);

	const insertVote = db.prepare(`
		INSERT INTO vote (voterID, playerVotedForID)
		VALUES (@voterID, @playerVotedForID)
	`);
	const vote = insertVote.run({ voterID, playerVotedForID });
	return vote;
};

module.exports = { createMockDB, addMockPlayer, addMockVote };