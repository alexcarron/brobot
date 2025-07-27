import { logInfo, logSuccess } from "../../../utilities/logging-utils";
import { setupDatabase } from "../database/setup-database";
import { CharacterRepository } from "../repositories/character.repository";
import { GameStateRepository } from "../repositories/game-state.repository";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { VoteRepository } from "../repositories/vote.repository";
import { GameStateService } from "../services/game-state.service";
import { MysteryBoxService } from "../services/mystery-box.service";
import { PlayerService } from "../services/player.service";
import { VoteService } from "../services/vote.service";

/**
 * Sets up Namesmith by loading and setting up the necessary repositories and services when the bot starts up.
 */
export const setupNamesmith = () => {
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