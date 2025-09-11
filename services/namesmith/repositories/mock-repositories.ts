import { InvalidArgumentError, attempt } from '../../../utilities/error-utils';
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB, addMockPlayer, addMockVote, addMockTrade } from "../database/mock-database";
import { Player } from "../types/player.types";
import { Vote } from "../types/vote.types";
import { CharacterRepository } from "./character.repository";
import { GameStateRepository } from "./game-state.repository";
import { MysteryBoxRepository } from "./mystery-box.repository";
import { PlayerRepository } from "./player.repository";
import { VoteRepository } from "./vote.repository";
import { WithAtLeast } from '../../../utilities/types/generic-types';
import { Recipe } from "../types/recipe.types";
import { RecipeRepository } from "./recipe.repository";
import { insertRecipesToDB } from "../database/db-inserters";
import { PlayerAlreadyExistsError } from '../utilities/error.utility';
import { Trade, TradeStatuses } from '../types/trade.types';
import { getRandomNumber } from '../../../utilities/random-utils';
import { TradeRepository } from './trade.repository';

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
 * Creates a mock player object with default values for optional properties.
 * @param options - An object with the following properties:
 * @param options.id - The ID of the player.
 * @param options.currentName - The current name of the player.
 * @param options.publishedName - The published name of the player.
 * @param options.tokens - The number of tokens the player has.
 * @param options.role - The role of the player.
 * @param options.inventory - The player's inventory.
 * @param options.lastClaimedRefillTime - The last time the player claimed a refill.
 * @returns A mock player object with the given properties and default values for optional properties.
 */
export const createMockPlayerObject = ({
	id,
	currentName = "",
	publishedName = null,
	tokens = 0,
	role = null,
	inventory = "",
	lastClaimedRefillTime = null
}: WithAtLeast<Player, "id">): Player => {
	if (id === undefined || typeof id !== "string")
		throw new InvalidArgumentError(`createMockPlayerObject: player id must be a string, but got ${id}.`);

	return {id, currentName, publishedName, tokens, role, inventory, lastClaimedRefillTime};
}

/**
 * An array of mock player data for use in tests.
 */
export const mockPlayers: Player[] = [
	createMockPlayerObject({
		id: "1234567890",
		currentName: "John Doe",
		publishedName: "John Doe",
		tokens: 10,
		role: "magician",
		inventory: "John Doe",
		lastClaimedRefillTime: null,
	}),
	createMockPlayerObject({
		id: "1234567891",
		currentName: "abcdefgh",
		publishedName: "abcd",
		tokens: 0,
		role: "magician",
		inventory: "abcdefghijklmnopqrstuvwxyz",
		lastClaimedRefillTime: null,
	}),
	createMockPlayerObject({
		id: "1234567892",
		currentName: "UNPUBLISHED",
		publishedName: null,
		tokens: 0,
		role: "magician",
		inventory: "UNPUBLISHED",
		lastClaimedRefillTime: null,
	}),
	createMockPlayerObject({
		id: "1234567893",
		currentName: "non-voter",
		publishedName: "non-voter",
		tokens: 0,
		role: "magician",
		inventory: "non-voter",
		lastClaimedRefillTime: null,
	})
];

/**
 * Creates a mock player repository instance with an in-memory database for testing purposes.

 * The mock repository is populated with mock player data from the mockPlayers array.
 * @param mockDB - An optional mock database instance.
 * @param players - An optional array of mock player data.
 * @returns A mock instance of the PlayerRepository.
 */
export const createMockPlayerRepo =
(mockDB?: DatabaseQuerier, players?: Player[]): PlayerRepository => {
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
 * An array of mock votes for testing purposes.
 */
export const mockVotes: Vote[] = [
	{
		voterID: mockPlayers[0].id,
		playerVotedForID: mockPlayers[1].id,
	},
	{
		voterID: mockPlayers[1].id,
		playerVotedForID: mockPlayers[2].id,
	},
	{
		voterID: mockPlayers[2].id,
		playerVotedForID: mockPlayers[1].id,
	},
];

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
	players?: Player[],
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

export const mockRecipes: Recipe[] = [
	{
		id: 1,
		inputCharacters: "nn",
		outputCharacters: "m",
	},
	{
		id: 2,
		inputCharacters: "vv",
		outputCharacters: "w",
	},
	{
		id: 3,
		inputCharacters: "abc",
		outputCharacters: "def",
	},
	{
		id: 4,
		inputCharacters: "nn",
		outputCharacters: "N",
	},
];

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
 * Creates a mock trade object with default values for optional properties.
 * @param parameters - An object with optional parameters for the mock trade object.
 * @param parameters.id - The ID of the trade. If not provided, a random number will be generated.
 * @param parameters.initiatingPlayer - The ID of the player who initiated the trade.
 * @param parameters.recipientPlayer - The ID of the player who received the trade.
 * @param parameters.offeredCharacters - The characters offered in the trade.
 * @param parameters.requestedCharacters - The characters requested in the trade.
 * @param parameters.status - The status of the trade.
 * @returns A mock trade object with default values for optional properties.
 */
export const createMockTradeObject = ({
	id = undefined,
	initiatingPlayer = mockPlayers[0].id,
	recipientPlayer = mockPlayers[1].id,
	offeredCharacters = "abc",
	requestedCharacters = "edf",
	status = TradeStatuses.AWAITING_RECIPIENT,
}: Partial<Trade>): Trade => {
	if (id === undefined)
		id = getRandomNumber();

	return { id, initiatingPlayer, recipientPlayer, offeredCharacters, requestedCharacters, status };
}

export const mockTrades: Trade[] = [
	createMockTradeObject({
		id: 1,
		initiatingPlayer: mockPlayers[0].id,
		recipientPlayer: mockPlayers[1].id,
		offeredCharacters: "abc",
		requestedCharacters: "edf",
		status: TradeStatuses.AWAITING_RECIPIENT,
	}),
];

export const createMockTradeRepo = (
	mockDB?: DatabaseQuerier,
	trades?: Trade[],
	players?: Player[]
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
			...trades.map(trade => trade.initiatingPlayer),
			...trades.map(trade => trade.recipientPlayer)
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
		players?: Player[],
		votes?: Vote[],
		recipes?: Recipe[],
		trades?: Trade[],
	} = {}
): {
	db: DatabaseQuerier,
	characterRepository: CharacterRepository,
	gameStateRepository: GameStateRepository,
	mysteryBoxRepository: MysteryBoxRepository,
	playerRepository: PlayerRepository,
	voteRepository: VoteRepository,
	recipeRepository: RecipeRepository,
	tradeRepository: TradeRepository
} {
	if (mockDB === undefined || !(mockDB instanceof DatabaseQuerier))
		mockDB = createMockDB();

	return {
		db: mockDB,
		characterRepository: createMockCharacterRepo(mockDB),
		gameStateRepository: createMockGameStateRepo(mockDB),
		mysteryBoxRepository: createMockMysteryBoxRepo(mockDB),
		playerRepository: createMockPlayerRepo(mockDB, players),
		voteRepository: createMockVoteRepo(mockDB, players, votes),
		recipeRepository: createMockRecipeRepo(mockDB, recipes),
		tradeRepository: createMockTradeRepo(mockDB, trades),
	}
}