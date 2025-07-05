const DatabaseQuerier = require("../database/database-querier");
const { createMockDB, addMockPlayer, addMockVote } = require("../database/mock-database");
const CharacterRepository = require("./character.repository");
const GameStateRepository = require("./gameState.repository");
const MysteryBoxRepository = require("./mysteryBox.repository");
const PlayerRepository = require("./player.repository");
const VoteRepository = require("./vote.repository");

/**
 * Creates a mock character repository instance with an in-memory database for testing purposes.
 *
 * @param {DatabaseQuerier | undefined} mockDB - An optional mock database instance.
 * @returns {CharacterRepository} A mock instance of the CharacterRepository.
 */
const createMockCharacterRepo = (mockDB) => {
	if (mockDB === undefined || !(mockDB instanceof DatabaseQuerier))
		mockDB = createMockDB();
	return new CharacterRepository(mockDB);
}

/**
 * Creates a mock game state repository instance with an in-memory database for testing purposes.
 *
 * @param {DatabaseQuerier | undefined} mockDB - An optional mock database instance.
 * @returns {GameStateRepository} A mock instance of the GameStateRepository.
 */
const createMockGameStateRepo = (mockDB) => {
	if (mockDB === undefined || !(mockDB instanceof DatabaseQuerier))
		mockDB = createMockDB();
	return new GameStateRepository(mockDB);
}

/**
 * Creates a mock mystery box repository instance with an in-memory database for testing purposes.
 *
 * @param {DatabaseQuerier | undefined} mockDB - An optional mock database instance.
 * @returns {MysteryBoxRepository} A mock instance of the MysteryBoxRepository.
 */
const createMockMysteryBoxRepo = (mockDB) => {
	if (mockDB === undefined || !(mockDB instanceof DatabaseQuerier))
		mockDB = createMockDB();
	return new MysteryBoxRepository(mockDB);
}

const createMockPlayerObject = ({id, currentName, publishedName, tokens, role, inventory}) => {
	if (id === undefined || typeof id !== "string")
		throw new TypeError(`createMockPlayerObject: player id must be a string, but got ${id}.`);

	if (currentName === undefined)
		currentName = "";

	if (publishedName === undefined)
		publishedName = null;

	if (tokens === undefined)
		tokens = 0;

	if (role === undefined)
		role = null;

	if (inventory === undefined)
		inventory = "";

	return {id, currentName, publishedName, tokens, role, inventory};
}

/**
 * An array of mock player data for use in tests.
 * @type {Array<{
	 * 	id: string,
	 * 	currentName: string,
	 * 	publishedName: string | null,
	 * 	tokens: number,
	 * 	role: string | null,
	 * 	inventory: string,
	 * }>}
 */
const mockPlayers = [
	{
		id: "1234567890",
		currentName: "John Doe",
		publishedName: "John Doe",
		tokens: 10,
		role: "magician",
		inventory: "John Doe",
	},
	{
		id: "1234567891",
		currentName: "abcdefgh",
		publishedName: "abcd",
		tokens: 0,
		role: "magician",
		inventory: "abcdefghijklmnopqrstuvwxyz",
	},
	{
		id: "1234567892",
		currentName: "UNPUBLISHED",
		publishedName: null,
		tokens: 0,
		role: "magician",
		inventory: "UNPUBLISHED",
	}
];

/**
 * Creates a mock player repository instance with an in-memory database for testing purposes.
 *
 * The mock repository is populated with mock player data from the mockPlayers array.
 *
 * @param {DatabaseQuerier | undefined} mockDB - An optional mock database instance.
 * @param {Array<{id: string, currentName: string, publishedName: string, tokens: number, role: string, inventory: string}> | undefined} players - An optional array of mock player data.
 * @returns {PlayerRepository} A mock instance of the PlayerRepository.
 */
const createMockPlayerRepo = (mockDB, players) => {
	if (mockDB === undefined || !(mockDB instanceof DatabaseQuerier))
		mockDB = createMockDB();

	if (players === undefined || !Array.isArray(players))
		players = mockPlayers;

	for (const player of players) {
		addMockPlayer(mockDB, player);
	}
	return new PlayerRepository(mockDB);
}

/**
 * An array of mock votes for testing purposes.
 * @type {Array<{voterID: string, playerVotedForID: string}>}
 */
const mockVotes = [
	{
		voterID: "1234567890",
		playerVotedForID: "1234567891",
	},
	{
		voterID: "1234567891",
		playerVotedForID: "1234567892",
	},
	{
		voterID: "1234567892",
		playerVotedForID: "1234567891",
	},
];

/**
 * Creates a mock vote repository instance with an in-memory database for testing purposes.
 *
 * The mock repository is populated with mock vote data from the mockVotes array.
 *
 * @param {DatabaseQuerier | undefined} mockDB - An optional mock database instance.
 * @returns {VoteRepository} A mock instance of the VoteRepository.
 */
const createMockVoteRepo = (mockDB, votes) => {
	if (mockDB === undefined || !(mockDB instanceof DatabaseQuerier))
		mockDB = createMockDB();

	if (votes === undefined || !Array.isArray(votes))
		votes = mockVotes;

		// Get a list of unique player IDs used in votes
	const requiredPlayerIDs = [
		...new Set(votes.map(v => v.playerVotedForID))
	];

	// Insert dummy players if they don't exist yet
	for (const playerID of requiredPlayerIDs) {
		const existing = mockDB.getRow(
			"SELECT id FROM player WHERE id = ?",
			[playerID]
		);

		if (existing === undefined) {
			addMockPlayer(mockDB,
				createMockPlayerObject({id: playerID})
			);
		}
	}

	for (const vote of votes) {
		addMockVote(mockDB, vote);
	}
	return new VoteRepository(mockDB);
}

/**
 * Creates an object containing mock instances of the repositories and the in-memory database for testing purposes.
 *
 * The returned object contains the following properties:
 * - db: The mock database instance.
 * - characterRepository: A mock instance of the CharacterRepository.
 * - gameStateRepository: A mock instance of the GameStateRepository.
 * - mysteryBoxRepository: A mock instance of the MysteryBoxRepository.
 * - playerRepository: A mock instance of the PlayerRepository.
 * - voteRepository: A mock instance of the VoteRepository.
 *
 * @param {DatabaseQuerier | undefined} mockDB - An optional mock database instance.
 * @param {{players: Array<{id: string, currentName: string, publishedName: string, tokens: number, role: string, inventory: string}> | undefined, votes: Array<{voterID: string, playerVotedForID: string}> | undefined}} [options] - An optional object with properties for players and votes to be added to the mock repositories.
 * @returns {{db: DatabaseQuerier, characterRepository: CharacterRepository, gameStateRepository: GameStateRepository, mysteryBoxRepository: MysteryBoxRepository, playerRepository: PlayerRepository, voteRepository: VoteRepository}} A mock instance of the repositories and the in-memory database.
 */
const createMockRepositories = (mockDB, {players, votes}) => {
	if (mockDB === undefined || !(mockDB instanceof DatabaseQuerier))
		mockDB = createMockDB();

	return {
		db: mockDB,
		characterRepository: createMockCharacterRepo(mockDB),
		gameStateRepository: createMockGameStateRepo(mockDB),
		mysteryBoxRepository: createMockMysteryBoxRepo(mockDB),
		playerRepository: createMockPlayerRepo(mockDB, players),
		voteRepository: createMockVoteRepo(mockDB, votes),
	}
};

module.exports = {
	createMockCharacterRepo,
	createMockGameStateRepo,
	createMockMysteryBoxRepo,
	mockPlayers,
	createMockPlayerRepo,
	mockVotes,
	createMockVoteRepo,
	createMockRepositories
};