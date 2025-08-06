import Database, { RunResult } from 'better-sqlite3';
import { applySchemaToDB } from './queries/apply-schema';
import { addInitialDataToDB } from './static-data/insert-static-data';
import { InvalidArgumentError } from '../../../utilities/error-utils';
import { DatabaseQuerier } from './database-querier';
import { Recipe } from '../types/recipe.types';
import { insertRecipesToDB } from './db-inserters';
import { AtLeastOne, IfPresent } from '../../../utilities/types/generic-types';
import { Player } from '../types/player.types';
import { NamesmithError, PlayerAlreadyExistsError } from '../utilities/error.utility';
import { createRandomNumericUUID } from '../../../utilities/random-utils';

/**
 * Creates an in-memory SQLite database with the schema and initial data for Namesmith already populated.
 * @returns The in-memory database.
 */
export const createMockDB = (): DatabaseQuerier => {
	const db = new DatabaseQuerier(new Database(':memory:'));
	applySchemaToDB(db);
	addInitialDataToDB(db);
	return db;
}

/**
 * Adds a player to the database with the given properties.
 * @param db - The in-memory database.
 * @param playerData - The player data to add.
 */
export const addMockPlayer = (
	db: DatabaseQuerier,
	{
		id = undefined,
		currentName = "",
		publishedName = null,
		tokens = 0,
		role = null,
		inventory = "",
	}:
	AtLeastOne<Player>
): Player => {
	if (id === undefined) {
		id = createRandomNumericUUID();
	}

	if (inventory === "" && currentName !== "")
		inventory = currentName;

	const existingPlayer = db.getRow(
		"SELECT id FROM player WHERE id = ?",
		[id]
	);

	if (existingPlayer !== undefined) {
		throw new PlayerAlreadyExistsError(id);
	}

	const player = { id, currentName, publishedName, tokens, role, inventory };
	const insertPlayer = db.prepare(`
		INSERT INTO player (id, currentName, publishedName, tokens, role, inventory)
		VALUES (@id, @currentName, @publishedName, @tokens, @role, @inventory)
	`);
	insertPlayer.run(player);
	return player;
};

/**
 * Adds a vote to the database with the given properties.
 * @param db - The in-memory database.
 * @param voteData - The vote data to add.
 * @returns The result of the insert operation.
 */
export const addMockVote = (
	db: DatabaseQuerier,
	{ voterID, playerVotedForID }: { voterID: string, playerVotedForID: string }
): RunResult => {
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

/**
 * Adds a recipe to the database with the given properties.
 * @param db - The in-memory database.
 * @param recipeData - The recipe data to add.
 * @returns The added recipe with an ID.
 */
export const addMockRecipe = (
	db: DatabaseQuerier,
	{
		id = undefined,
		inputCharacters = "a",
		outputCharacters = "a",
	}: AtLeastOne<Recipe>
): Recipe => {
	if (id === undefined) {
		const runResult = db.run(
			"INSERT INTO recipe (inputCharacters, outputCharacters) VALUES (@inputCharacters, @outputCharacters)",
			{ inputCharacters, outputCharacters }
		);

		if (typeof runResult.lastInsertRowid !== "number")
			id = Number(runResult.lastInsertRowid);
		else
			id = runResult.lastInsertRowid;
	}
	else {
		db.run(
			"INSERT INTO recipe (id, inputCharacters, outputCharacters) VALUES (@id, @inputCharacters, @outputCharacters)",
			{ id, inputCharacters, outputCharacters }
		);
	}
	return { id, inputCharacters, outputCharacters };
};