import { attempt } from '../../../utilities/error-utils';
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "./mock-database";
import { CharacterRepository } from "../repositories/character.repository";
import { GameStateRepository } from "../repositories/game-state.repository";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { VoteRepository } from "../repositories/vote.repository";
import { RecipeRepository } from "../repositories/recipe.repository";
import { PlayerAlreadyExistsError } from '../utilities/error.utility';
import { TradeRepository } from '../repositories/trade.repository';
import { NamesmithRepositories } from '../types/namesmith.types';
import { addMockPlayer, createMockPlayerObject, mockPlayers } from './mock-data/mock-players';
import { addMockVote, mockVotes } from './mock-data/mock-votes';
import { mockRecipes } from './mock-data/mock-recipes';
import { addMockTrade, mockTrades } from './mock-data/mock-trades';
import { PerkRepository } from '../repositories/perk.repository';
import { RoleRepository } from '../repositories/role.repository';
import { syncRecipesToDB } from '../database/static-data-synchronizers/sync-recipes';
import { QuestRepository } from '../repositories/quest.repository';
import { ActivityLogRepository } from '../repositories/activity-log.repository';

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
 * @param mockRoleRepo - An optional mock role repository instance.
 * @param mockPerkRepo - An optional mock perk repository instance.
 * @returns A mock instance of the PlayerRepository.
 */
export const createMockPlayerRepo = (
	mockDB?: DatabaseQuerier,
	mockRoleRepo?: RoleRepository,
	mockPerkRepo?: PerkRepository,
): PlayerRepository => {
	const sharedDB =
		mockDB ??
		mockRoleRepo?.db ??
		mockPerkRepo?.db ??
		createMockDB();

	mockPerkRepo = mockPerkRepo ?? createMockPerkRepo(sharedDB);
	mockRoleRepo = mockRoleRepo ?? createMockRoleRepo(sharedDB, mockPerkRepo);

	for (const player of mockPlayers) {
		attempt(() => addMockPlayer(sharedDB, player))
			.ignoreError(PlayerAlreadyExistsError)
			.execute();
	}
	return new PlayerRepository(sharedDB, mockRoleRepo, mockPerkRepo);
}

/**
 * Creates a mock vote repository instance with an in-memory database for testing purposes.

 * The mock repository is populated with mock vote data from the mockVotes array.
 * @param mockDB - An optional mock database instance.
 * @param mockPlayerRepo - An optional mock player repository instance.
 * @returns A mock instance of the VoteRepository.
 */
export const createMockVoteRepo = (
	mockDB?: DatabaseQuerier,
	mockPlayerRepo?: PlayerRepository
): VoteRepository => {
	const sharedDB =
		mockDB ??
		mockPlayerRepo?.db ??
		createMockDB();

	mockPlayerRepo =
		mockPlayerRepo ??
		createMockPlayerRepo(sharedDB);

		// Get a list of unique player IDs used in votes
	const requiredPlayerIDs = [
		...new Set(mockVotes.map(vote =>
			mockPlayerRepo.resolveID(vote.playerVotedFor)
		)),
	];

	for (const player of mockPlayers) {
		attempt(() => addMockPlayer(sharedDB, player))
			.ignoreError(PlayerAlreadyExistsError)
			.execute();
	}

	// Insert dummy players if they don't exist yet
	for (const playerID of requiredPlayerIDs) {
		attempt(() =>
			addMockPlayer(sharedDB,
				createMockPlayerObject({id: playerID})
			)
		)
			.ignoreError(PlayerAlreadyExistsError)
			.execute();
	}

	for (const vote of mockVotes) {
		addMockVote(sharedDB, vote);
	}
	return new VoteRepository(sharedDB, mockPlayerRepo);
}

/**
 * Creates a mock recipe repository instance with an in-memory database for testing purposes.
 * The mock repository is populated with mock recipe data from the mockRecipes array.
 * @param mockDB - An optional mock database instance.
 * @returns A mock instance of the RecipeRepository.
 */
export const createMockRecipeRepo = (
	mockDB?: DatabaseQuerier,
): RecipeRepository => {
	if (mockDB === undefined)
		mockDB = createMockDB();

	syncRecipesToDB(mockDB, mockRecipes);

	return new RecipeRepository(mockDB);
}

/**
 * Creates a mock trade repository instance with an in-memory database for testing purposes.
 * The mock repository is populated with mock trade data from the trades array.
 * If any of the mock repository parameters are undefined, a default mock repository
 * instance is created for the respective service.
 * @param mockDB - An optional mock database instance.
 * @param mockPlayerRepo - An optional mock player repository instance.
 * @returns A mock instance of the TradeRepository.
 */
export const createMockTradeRepo = (
	mockDB?: DatabaseQuerier,
	mockPlayerRepo?: PlayerRepository
): TradeRepository => {
	mockDB =
		mockDB
		?? createMockDB();

	mockPlayerRepo =
		mockPlayerRepo
		?? createMockPlayerRepo(mockDB);

	// Get a list of unique player IDs used in votes
	const requiredPlayerIDs = [
		...new Set([
			...mockTrades.map(trade =>
				mockPlayerRepo.resolveID(trade.initiatingPlayer)
			),
			...mockTrades.map(trade =>
				mockPlayerRepo.resolveID(trade.recipientPlayer)
			)
		])
	];

	for (const player of mockPlayers) {
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


	for (const trade of mockTrades) {
		addMockTrade(mockDB, trade);
	}

	return new TradeRepository(mockDB, mockPlayerRepo);
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
 * @param mockPerkRepo - An optional mock perk repository instance.
 * @returns A mock instance of the RoleRepository.
 */
export const createMockRoleRepo = (
	mockDB?: DatabaseQuerier,
	mockPerkRepo?: PerkRepository
): RoleRepository => {
	mockDB =
		mockDB
		?? createMockDB();

	mockPerkRepo =
		mockPerkRepo
		?? createMockPerkRepo(mockDB);

	return new RoleRepository(mockDB, mockPerkRepo);
}

/**
 * Creates a mock quest repository instance with an in-memory database for testing purposes.
 * If the mockDB parameter is undefined, a default mock database instance is created.
 * @param mockDB - An optional mock database instance.
 * @returns A mock instance of the QuestRepository.
 */
export function createMockQuestRepo(
	mockDB?: DatabaseQuerier,
): QuestRepository {
	mockDB =
		mockDB
		?? createMockDB();

	return new QuestRepository(mockDB);
}

/**
 * Creates a mock activity log repository instance with an in-memory database for testing purposes.
 * @param mockDB - An optional mock database instance.
 * @param mockPlayerRepo - An optional mock player repository instance.
 * @param mockRecipeRepo - An optional mock recipe repository instance.
 * @returns A mock instance of the ActivityLogRepository.
 */
export function createMockActivityLogRepo(
	mockDB?: DatabaseQuerier,
	mockPlayerRepo?: PlayerRepository,
	mockRecipeRepo?: RecipeRepository
): ActivityLogRepository {
	mockDB =
		mockDB
		?? createMockDB();

	mockPlayerRepo =
		mockPlayerRepo
		?? createMockPlayerRepo(mockDB);

	mockRecipeRepo =
		mockRecipeRepo
		?? createMockRecipeRepo(mockDB);

	return new ActivityLogRepository(mockDB, mockPlayerRepo, mockRecipeRepo);
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
 * @returns A mock instance of the repositories and the in-memory database.
 */
export function createMockRepositories(
	mockDB?: DatabaseQuerier
): NamesmithRepositories {
	if (mockDB === undefined || !(mockDB instanceof DatabaseQuerier))
		mockDB = createMockDB();

	const characterRepository = createMockCharacterRepo(mockDB);
	const gameStateRepository = createMockGameStateRepo(mockDB);
	const mysteryBoxRepository = createMockMysteryBoxRepo(mockDB);
	const voteRepository = createMockVoteRepo(mockDB);
	const recipeRepository = createMockRecipeRepo(mockDB);
	const perkRepository = createMockPerkRepo(mockDB);
	const roleRepository = createMockRoleRepo(mockDB, perkRepository);
	const playerRepository = createMockPlayerRepo(mockDB, roleRepository, perkRepository);
	const tradeRepository = createMockTradeRepo(mockDB, playerRepository);
	const questRepository = createMockQuestRepo(mockDB);
	const activityLogRepository = createMockActivityLogRepo(mockDB, playerRepository, recipeRepository);

	return {
		characterRepository,
		gameStateRepository,
		mysteryBoxRepository,
		voteRepository,
		recipeRepository,
		tradeRepository,
		perkRepository,
		roleRepository,
		playerRepository,
		questRepository,
		activityLogRepository
	}
}