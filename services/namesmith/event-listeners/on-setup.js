const { logInfo, logSuccess } = require("../../../utilities/logging-utils");
const { setupDatabase } = require("../database/setup-database");
const {CharacterRepository} = require("../repositories/character.repository");
const GameStateRepository = require("../repositories/gameState.repository");
const MysteryBoxRepository = require("../repositories/mysteryBox.repository");
const PlayerRepository = require("../repositories/player.repository");
const VoteRepository = require("../repositories/vote.repository");
const GameStateService = require("../services/gameState.service");
const MysteryBoxService = require("../services/mysteryBox.service");
const PlayerService = require("../services/player.service");
const VoteService = require("../services/vote.service");

/**
 * Sets up Namesmith by loading and setting up the necessary repositories and services when the bot starts up.
 */
const setupNamesmith = () => {
	logInfo("Setting up Namesmith...");

	const db = setupDatabase();

	global.namesmith = {};
	global.namesmith.mysteryBoxRepository =
		new MysteryBoxRepository(db);

	global.namesmith.characterRepository =
		new CharacterRepository(db);

	global.namesmith.playerRepository =
		new PlayerRepository(db);

	global.namesmith.gameStateRepository =
		new GameStateRepository(db);

	global.namesmith.voteRepository =
		new VoteRepository(db);

	global.namesmith.mysteryBoxService = new MysteryBoxService(
		global.namesmith.mysteryBoxRepository,
		global.namesmith.characterRepository,
	);

	global.namesmith.playerService = new PlayerService(
		global.namesmith.playerRepository,
	);

	global.namesmith.voteService = new VoteService(
		global.namesmith.voteRepository,
		global.namesmith.playerService,
	);

	global.namesmith.gameStateService = new GameStateService(
		global.namesmith.gameStateRepository,
		global.namesmith.playerService,
		global.namesmith.voteService,
	);

	logSuccess("Namesmith set up");
}

module.exports = { setupNamesmith };