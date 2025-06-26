const { loadObjectFromJsonInGitHub, saveObjectToJsonInGitHub } = require("../../../utilities/github-json-storage-utils");
const { logInfo, logSuccess } = require("../../../utilities/logging-utils");
const CharacterRepository = require("../repositories/character.repository");
const MysteryBoxRepository = require("../repositories/mysteryBox.repository");
const PlayerRepository = require("../repositories/player.repository");
const MysteryBoxService = require("../services/mysteryBox.service");
const PlayerService = require("../services/player.service");
const GITHUB_JSON_FILE_NAME = "namesmith";

/**
 * Sets up Namesmith by loading the Namesmith data from a GitHub JSON file into the global object.
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

	global.namesmith.mysteryBoxService = new MysteryBoxService(
		global.namesmith.mysteryBoxRepository,
		global.namesmith.characterRepository
	);

	global.namesmith.playerService = new PlayerService(
		global.namesmith.playerRepository
	);

	logSuccess("Namesmith set up");
}

module.exports = { setupNamesmith };