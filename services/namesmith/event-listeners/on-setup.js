const { loadObjectFromJsonInGitHub, saveObjectToJsonInGitHub } = require("../../../utilities/github-json-storage-utils");
const { logInfo, logSuccess } = require("../../../utilities/logging-utils");
const CharacterRepository = require("../repositories/character.repository");
const GameStateRepository = require("../repositories/gameState.repository");
const MysteryBoxRepository = require("../repositories/mysteryBox.repository");
const PlayerRepository = require("../repositories/player.repository");
const GameStateService = require("../services/gameState.service");
const MysteryBoxService = require("../services/mysteryBox.service");
const PlayerService = require("../services/player.service");
const GITHUB_JSON_FILE_NAME = "namesmith";

/**
 * Sets up Namesmith by loading and setting up the necessary repositories and services when the bot starts up.
 * @returns {Promise<void>} A promise that resolves once the Namesmith data has been loaded and set up.
 */
const setupNamesmith = async () => {
	logInfo("Setting up Namesmith...");

	global.namesmith = {};
	global.namesmith.mysteryBoxRepository =
		new MysteryBoxRepository();

	global.namesmith.characterRepository =
		new CharacterRepository();

	global.namesmith.playerRepository =
		new PlayerRepository();

	global.namesmith.gameStateRepository =
		new GameStateRepository();

	global.namesmith.mysteryBoxService = new MysteryBoxService(
		global.namesmith.mysteryBoxRepository,
		global.namesmith.characterRepository
	);

	global.namesmith.playerService = new PlayerService(
		global.namesmith.playerRepository
	);

	global.namesmith.gameStateService = new GameStateService(
		global.namesmith.gameStateRepository,
		global.namesmith.playerService,
	);

	logSuccess("Namesmith set up");
}

module.exports = { setupNamesmith };