import { attempt } from '../../../utilities/error-utils';
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "./mock-database";
import { PlayerDefinition } from "../types/player.types";
import { Vote } from "../types/vote.types";
import { CharacterRepository } from "../repositories/character.repository";
import { GameStateRepository } from "../repositories/game-state.repository";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { VoteRepository } from "../repositories/vote.repository";
import { Recipe } from "../types/recipe.types";
import { RecipeRepository } from "../repositories/recipe.repository";
import { insertRecipesToDB } from "../database/db-inserters";
import { PlayerAlreadyExistsError } from '../utilities/error.utility';
import { Trade } from '../types/trade.types';
import { TradeRepository } from '../repositories/trade.repository';
import { NamesmithRepositories } from '../types/namesmith.types';
import { addMockPlayer, createMockPlayerObject, mockPlayers } from './mock-data/mock-players';
import { addMockVote, mockVotes } from './mock-data/mock-votes';
import { mockRecipes } from './mock-data/mock-recipes';
import { addMockTrade, mockTrades } from './mock-data/mock-trades';
import { PerkRepository } from '../repositories/perk.repository';
import { RoleRepository } from '../repositories/role.repository';

/**
 * Creates a mock character repository instance with an in-memory database for testing purposes.
 * @param mockDB - An optional mock database instance.
 * @returns A mock instance of the CharacterRepository.
 */
export const createMockCharacterRepo =
(mockDB?: DatabaseQuerier): CharacterRepository => {
	if (mockDB === undefined || !(mockDB instanceof DatabaseQuerier))
		mockDB = createMockDB();
	return new CharacterRepository(mockDB);
}

/**
 * Creates a mock game state repository instance with an in-memory database for testing purposes.
 * @param mockDB - An optional mock database instance.
 * @returns A mock instance of the GameStateRepository.
 */
export const createMockGameStateRepo =
(mockDB?: DatabaseQuerier): GameStateRepository => {
	if (mockDB === undefined || !(mockDB instanceof DatabaseQuerier))
		mockDB = createMockDB();
	return new GameStateRepository(mockDB);
}

/**
 * Creates a mock mystery box repository instance with an in-memory database for testing purposes.
 * @param mockDB - An optional mock database instance.
 * @returns A mock instance of the MysteryBoxRepository.
 */
export const createMockMysteryBoxRepo =
(mockDB?: DatabaseQuerier): MysteryBoxRepository => {
	if (mockDB === undefined || !(mockDB instanceof DatabaseQuerier))
		mockDB = createMockDB();
	return new MysteryBoxRepository(mockDB);
}

/**
 * Creates a mock player repository instance with an in-memory database for testing purposes.

 * The mock repository is populated with mock player data from the mockPlayers array.
 * @param mockDB - An optional mock database instance.
 * @param players - An optional array of mock player data.
 * @returns A mock instance of the PlayerRepository.
 */
export const createMockPlayerRepo =
(mockDB?: DatabaseQuerier, players?: PlayerDefinition[]): PlayerRepository => {
	if (mockDB === undefined || !(mockDB instanceof DatabaseQuerier))
		mockDB = createMockDB();

	if (players === undefined || !Array.isArray(players))
		players = mockPlayers;

	for (const player of players) {
		attempt(() => addMockPlayer(mockDB, player))
			.ignoreError(PlayerAlreadyExistsError)
			.execute();
	}
	return new PlayerRepository(mockDB);
}

/**
 * Creates a mock vote repository instance with an in-memory database for testing purposes.

 * The mock repository is populated with mock vote data from the mockVotes array.
 * @param mockDB - An optional mock database instance.
 * @param players - An optional array of mock player data.
 * @param votes - An optional array of mock vote data.
 * @returns A mock instance of the VoteRepository.
 */
export const createMockVoteRepo = (
	mockDB?: DatabaseQuerier,
	players?: PlayerDefinition[],
	votes?: Vote[]
): VoteRepository => {
	if (mockDB === undefined || !(mockDB instanceof DatabaseQuerier))
		mockDB = createMockDB();

	if (votes === undefined || !Array.isArray(votes))
		votes = mockVotes;

	if (players === undefined || !Array.isArray(players))
		players = mockPlayers;

		// Get a list of unique player IDs used in votes
	const requiredPlayerIDs = [
		...new Set(votes.map(v => v.playerVotedForID))
	];

	for (const player of players) {
		attempt(() => addMockPlayer(mockDB, player))
			.ignoreError(PlayerAlreadyExistsError)
			.execute();
	}

	// Insert dummy players if they don't exist yet
	for (const playerID of requiredPlayerIDs) {
		attempt(addMockPlayer, mockDB,
			createMockPlayerObject({id: playerID})
		)
			.ignoreError(PlayerAlreadyExistsError)
			.execute();
	}

	for (const vote of votes) {
		addMockVote(mockDB, vote);
	}
	return new VoteRepository(mockDB);
}

/**
 * Creates a mock recipe repository instance with an in-memory database for testing purposes.
 * The mock repository is populated with mock recipe data from the mockRecipes array.
 * @param mockDB - An optional mock database instance.
 * @param recipes - An optional array of mock recipe data.
 * @returns A mock instance of the RecipeRepository.
 */
export const createMockRecipeRepo = (
	mockDB?: DatabaseQuerier,
	recipes?: Recipe[]
): RecipeRepository => {
	if (mockDB === undefined)
		mockDB = createMockDB();

	if (recipes === undefined)
		recipes = mockRecipes;

	insertRecipesToDB(mockDB, recipes);

	return new RecipeRepository(mockDB);
}

/**
 * Creates a mock trade repository instance with an in-memory database for testing purposes.
 * The mock repository is populated with mock trade data from the trades array.
 * If any of the mock repository parameters are undefined, a default mock repository
 * instance is created for the respective service.
 * @param mockDB - An optional mock database instance.
 * @param trades - An optional array of mock trade data.
 * @param players - An optional array of mock player data.
 * @returns A mock instance of the TradeRepository.
 */
export const createMockTradeRepo = (
	mockDB?: DatabaseQuerier,
	trades?: Trade[],
	players?: PlayerDefinition[]
): TradeRepository => {
	mockDB =
		mockDB
		?? createMockDB();

	trades =
		trades
		?? mockTrades;

	players =
		players
		?? mockPlayers;

	// Get a list of unique player IDs used in votes
	const requiredPlayerIDs = [
		...new Set([
			...trades.map(trade => trade.initiatingPlayerID),
			...trades.map(trade => trade.recipientPlayerID)
		])
	];

	for (const player of players) {
		attempt(() => addMockPlayer(mockDB, player))
			.ignoreError(PlayerAlreadyExistsError)
			.execute();
	}

	// Insert dummy players if they don't exist yet
	for (const playerID of requiredPlayerIDs) {
		attempt(addMockPlayer, mockDB,
			createMockPlayerObject({id: playerID})
		)
			.ignoreError(PlayerAlreadyExistsError)
			.execute();
	}


	for (const trade of trades) {
		addMockTrade(mockDB, trade);
	}

	return new TradeRepository(mockDB);
}

/**
 * Creates a mock perk repository instance with an in-memory database for testing purposes.
 * If the mockDB parameter is undefined, a default mock database instance is created.
 * @param mockDB - An optional mock database instance.
 * @returns A mock instance of the PerkRepository.
 */
export const createMockPerkRepo = (
	mockDB?: DatabaseQuerier,
): PerkRepository => {
	mockDB =
		mockDB
		?? createMockDB();

	return new PerkRepository(mockDB);
}

/**
 * Creates a mock role repository instance with an in-memory database for testing purposes.
 * If the mockDB parameter is undefined, a default mock database instance is created.
 * @param mockDB - An optional mock database instance.
 * @returns A mock instance of the RoleRepository.
 */
export const crateMockRoleRepo = (
	mockDB?: DatabaseQuerier,
): RoleRepository => {
	mockDB =
		mockDB
		?? createMockDB();

	return new RoleRepository(mockDB);
}

/**
 * Creates an object containing mock instances of the repositories and the in-memory database for testing purposes.
 * The returned object contains the following properties:
 * - db: The mock database instance.
 * - characterRepository: A mock instance of the CharacterRepository.
 * - gameStateRepository: A mock instance of the GameStateRepository.
 * - mysteryBoxRepository: A mock instance of the MysteryBoxRepository.
 * - playerRepository: A mock instance of the PlayerRepository.
 * - voteRepository: A mock instance of the VoteRepository.
 * @param mockDB - An optional mock database instance.
 * @param options - An object containing optional parameters.
 * @param options.players - An optional array of mock player data.
 * @param options.votes - An optional array of mock vote data.
 * @param options.recipes - An optional array of mock recipe data.
 * @param options.trades - An optional array of mock trade data.
 * @returns A mock instance of the repositories and the in-memory database.
 */
export function createMockRepositories(
	mockDB?: DatabaseQuerier,
	{players, votes, recipes, trades}: {
		players?: PlayerDefinition[],
		votes?: Vote[],
		recipes?: Recipe[],
		trades?: Trade[],
	} = {}
): NamesmithRepositories {
	if (mockDB === undefined || !(mockDB instanceof DatabaseQuerier))
		mockDB = createMockDB();

	return {
		characterRepository: createMockCharacterRepo(mockDB),
		gameStateRepository: createMockGameStateRepo(mockDB),
		mysteryBoxRepository: createMockMysteryBoxRepo(mockDB),
		playerRepository: createMockPlayerRepo(mockDB, players),
		voteRepository: createMockVoteRepo(mockDB, players, votes),
		recipeRepository: createMockRecipeRepo(mockDB, recipes),
		tradeRepository: createMockTradeRepo(mockDB, trades),
		perkRepository: createMockPerkRepo(mockDB),
		roleRepository: crateMockRoleRepo(mockDB),
	}
}