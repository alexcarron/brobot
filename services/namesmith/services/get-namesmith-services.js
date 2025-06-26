const MysteryBoxService = require("./mysteryBox.service");
const PlayerService = require("./player.service");

/**
 * Returns the Namesmith services that have been set up.
 * @returns {{
 *  mysteryBoxService: MysteryBoxService,
 *  playerService: PlayerService,
 * }}
 * @throws {Error} If Namesmith, MysteryBoxService, or PlayerService is not set up yet.
 */
const getNamesmithServices = () => {
	if (!global.namesmith)
		throw new Error("getNamesmithServices: Namesmith is not set up yet.");

	if (!global.namesmith.mysteryBoxService)
		throw new Error("getNamesmithServices: MysteryBoxService is not set up yet.");

	if (!global.namesmith.playerService)
		throw new Error("getNamesmithServices: PlayerService is not set up yet.");

	return {
		mysteryBoxService: global.namesmith.mysteryBoxService,
		playerService: global.namesmith.playerService,
	}
}

module.exports = { getNamesmithServices };