import { RunResult } from 'better-sqlite3';
import { applySchemaToDB } from '../database/queries/apply-schema';
import { addInitialDataToDB } from '../database/static-data/insert-static-data';
import { InvalidArgumentError } from '../../../utilities/error-utils';
import { DatabaseQuerier } from '../database/database-querier';
import { Recipe } from '../types/recipe.types';
import { WithAtLeast, WithAtLeastOne } from '../../../utilities/types/generic-types';
import { DBPlayer, Player } from '../types/player.types';
import { PlayerAlreadyExistsError } from '../utilities/error.utility';
import { createRandomName, createRandomNumericUUID } from '../../../utilities/random-utils';
import { MysteryBox } from '../types/mystery-box.types';
import { Trade, TradeStatuses } from '../types/trade.types';
import { mockPlayers } from './mock-repositories';
import { toPlayerObject } from '../utilities/player.utility';

/**
 * Creates an in-memory SQLite database with the schema and initial data for Namesmith already populated.
 * @returns The in-memory database.
 */
export const createMockDB = (): DatabaseQuerier => {
	const db = new DatabaseQuerier({inMemory: true});
	applySchemaToDB(db);
	addInitialDataToDB(db);
	return db;
}

/**
 * Adds a player to the database with the given properties.
 * @param db - The in-memory database.
 * @param playerData - The player data to add.
 * @param playerData.id - The ID of the player.
 * @param playerData.currentName - The current name of the player.
 * @param playerData.publishedName - The published name of the player.
 * @param playerData.tokens - The number of tokens the player has.
 * @param playerData.role - The role of the player.
 * @param playerData.inventory - The player's inventory.
 * @param playerData.lastClaimedRefillTime - The last time the player claimed a refill.
 * @returns The player object that was added to the database.
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
		lastClaimedRefillTime = null
	}:
	WithAtLeastOne<Player>
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

	const player = { id, currentName, publishedName, tokens, role, inventory, lastClaimedRefillTime};
	const insertPlayer = db.prepare(`
		INSERT INTO player (id, currentName, publishedName, tokens, role, inventory, lastClaimedRefillTime)
		VALUES (@id, @currentName, @publishedName, @tokens, @role, @inventory, @lastClaimedRefillTime)
	`);
	insertPlayer.run({
		...player,
		lastClaimedRefillTime:
			lastClaimedRefillTime === null
				? null
				: lastClaimedRefillTime.getTime()
	});
	return player;
};

export const editMockPlayer = (
	db: DatabaseQuerier,
	editedPlayer: WithAtLeast<Player, "id">
): Player => {
	const setQueries: string[] =
		Object.entries(editedPlayer)
			.filter(([key, value]) =>
				key !== "id" &&
				value !== undefined
			)
			.map(([key]) => `${key} = @${key}`);

	if (setQueries.length === 0)
		throw new InvalidArgumentError("editMockPlayer: No properties to update.");

	const updateQuery = `
		UPDATE player
		SET ${setQueries.join(", ")}
		WHERE id = @id
	`;

	const result = db.run(updateQuery, { ...editedPlayer });

	if (result.changes === 0)
		throw new InvalidArgumentError(`editMockPlayer: No player found with ID ${editedPlayer.id}.`);

	const newMockPlayer = db.getRow(
		"SELECT * FROM player WHERE id = @id",
		{ id: editedPlayer.id }
	) as DBPlayer | undefined;

	if (newMockPlayer === undefined)
		throw new InvalidArgumentError(`editMockPlayer: No player found with ID ${editedPlayer.id}.`);

	return toPlayerObject(newMockPlayer);
}

/**
 * Adds a vote to the database with the given properties.
 * @param db - The in-memory database.
 * @param voteData - The vote data to add.
 * @param voteData.voterID - The ID of the user who voted.
 * @param voteData.playerVotedForID - The ID of the player voted for.
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
 * @param recipeData.id - The ID of the recipe.
 * @param recipeData.inputCharacters - The input characters of the recipe.
 * @param recipeData.outputCharacters - The output characters of the recipe.
 * @returns The added recipe with an ID.
 */
export const addMockRecipe = (
	db: DatabaseQuerier,
	{
		id = undefined,
		inputCharacters = "a",
		outputCharacters = "a",
	}: WithAtLeastOne<Recipe>
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

/**
 * Adds a mystery box to the database with the given properties.
 * @param db - The in-memory database.
 * @param mysteryBoxData - The mystery box data to add.
 * @param mysteryBoxData.id - The ID of the mystery box.
 * @param mysteryBoxData.name - The name of the mystery box.
 * @param mysteryBoxData.tokenCost - The number of tokens to purchase the mystery box.
 * @returns The added mystery box with an ID.
 */
export const addMockMysteryBox = (
	db: DatabaseQuerier,
	{
		id = undefined,
    name = undefined,
    tokenCost = 0,
	}: WithAtLeastOne<MysteryBox>
): MysteryBox => {
	if (name === undefined)
		name = createRandomName();

	if (id === undefined) {
		const runResult = db.run(
			"INSERT INTO mysteryBox (name, tokenCost) VALUES (@name, @tokenCost)",
			{ name, tokenCost }
		);

		if (typeof runResult.lastInsertRowid !== "number")
			id = Number(runResult.lastInsertRowid);
		else
			id = runResult.lastInsertRowid;
	}
	else {
		db.run(
			"INSERT INTO mysteryBox (id, name, tokenCost) VALUES (@id, @name, @tokenCost)",
			{ id, name, tokenCost }
		);
	}
	return { id, name, tokenCost };
};


/**
 * Adds a trade to the database with the given properties.
 * @param db - The in-memory database.
 * @param tradeData - The trade data to add.
 * @param tradeData.id - The ID of the trade.
 * @param tradeData.initiatingPlayerID - The ID of the player who initiated the trade.
 * @param tradeData.recipientPlayerID - The ID of the player who received the trade.
 * @param tradeData.offeredCharacters - The characters offered in the trade.
 * @param tradeData.requestedCharacters - The characters requested in the trade.
 * @param tradeData.status - The status of the trade.
 * @returns The added trade with an ID.
 */
export const addMockTrade = (
	db: DatabaseQuerier,
	{
		id = undefined,
		initiatingPlayerID = mockPlayers[0].id,
		recipientPlayerID = mockPlayers[1].id,
		offeredCharacters = "abc",
		requestedCharacters = "edf",
		status = TradeStatuses.AWAITING_RECIPIENT,
	}: WithAtLeastOne<Trade>
): Trade => {
	if (id === undefined) {
		const runResult = db.run(
			`INSERT INTO trade (
				initiatingPlayerID,
				recipientPlayerID,
				offeredCharacters,
				requestedCharacters,
				status
			)
			VALUES (
				@initiatingPlayer,
				@recipientPlayer,
				@offeredCharacters,
				@requestedCharacters,
				@status
			)`,
			{ initiatingPlayer: initiatingPlayerID, recipientPlayer: recipientPlayerID, offeredCharacters, requestedCharacters, status }
		);

		if (typeof runResult.lastInsertRowid !== "number")
			id = Number(runResult.lastInsertRowid);
		else
			id = runResult.lastInsertRowid;
	}
	else {
		db.run(
			`INSERT INTO trade (
				id,
				initiatingPlayerID,
				recipientPlayerID,
				offeredCharacters,
				requestedCharacters,
				status
			)
			VALUES (
				@id,
				@initiatingPlayer,
				@recipientPlayer,
				@offeredCharacters,
				@requestedCharacters,
				@status
			)`,
			{
				id,
				initiatingPlayer: initiatingPlayerID,
				recipientPlayer: recipientPlayerID,
				offeredCharacters,
				requestedCharacters,
				status
			}
		);
	}
	return { id, initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters, status };
};