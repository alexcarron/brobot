const { InitializationError } = require("../../../utilities/error-utils");
const GameStateService = require("./gameState.service");
const MysteryBoxService = require("./mysteryBox.service");
const PlayerService = require("./player.service");
const VoteService = require("./vote.service");

/**
 * Returns the Namesmith services that have been set up.
 * @returns {{
 *  mysteryBoxService: MysteryBoxService,
 *  playerService: PlayerService,
 *  gameStateService: GameStateService,
 *  voteService: VoteService,
 * }} The Namesmith services.
 * @throws {Error} If Namesmith, MysteryBoxService, PlayerService, GameStateService, or VoteService is not set up yet.
 */
const getNamesmithServices = () => {
	if (!global.namesmith)
		throw new InitializationError("getNamesmithServices: Namesmith is not set up yet.");

	if (!global.namesmith.mysteryBoxService)
		throw new InitializationError("getNamesmithServices: MysteryBoxService is not set up yet.");

	if (!global.namesmith.playerService)
		throw new InitializationError("getNamesmithServices: PlayerService is not set up yet.");

	if (!global.namesmith.gameStateService)
		throw new InitializationError("getNamesmithServices: GameStateService is not set up yet.");

	if (!global.namesmith.voteService)
		throw new InitializationError("getNamesmithServices: VoteService is not set up yet.");

	return {
		mysteryBoxService: global.namesmith.mysteryBoxService,
		playerService: global.namesmith.playerService,
		gameStateService: global.namesmith.gameStateService,
		voteService: global.namesmith.voteService
	}
}

module.exports = { getNamesmithServices };