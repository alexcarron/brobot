import { logInfo, logSuccess } from "../../../utilities/logging-utils";
import { setupDatabase } from "../database/setup-database";
import { regenerateChooseARoleMessage } from "../interfaces/choose-a-role-message";
import { regeneratePickAPerkMessage } from "../interfaces/pick-a-perk-message";
import { regenerateDailyQuestsMessage } from "../interfaces/quests/daily-quests-message";
import { regenerateRecipeSelectMenu } from "../interfaces/recipe-select-menu";
import { regenerateAllTradeMessages } from "../interfaces/trading/trade-message";
import { regenerateVoteDisplay } from "../interfaces/voting/voting-messages";
import { ActivityLogRepository } from "../repositories/activity-log.repository";
import { CharacterRepository } from "../repositories/character.repository";
import { GameStateRepository } from "../repositories/game-state.repository";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { PerkRepository } from "../repositories/perk.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { QuestRepository } from "../repositories/quest.repository";
import { RecipeRepository } from "../repositories/recipe.repository";
import { RoleRepository } from "../repositories/role.repository";
import { TradeRepository } from "../repositories/trade.repository";
import { VoteRepository } from "../repositories/vote.repository";
import { ActivityLogService } from "../services/activity-log.service";
import { CharacterService } from "../services/character.service";
import { GameStateService } from "../services/game-state.service";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { MysteryBoxService } from "../services/mystery-box.service";
import { PerkService } from "../services/perk.service";
import { PlayerService } from "../services/player.service";
import { QuestService } from "../services/quest.service";
import { RecipeService } from "../services/recipe.service";
import { RoleService } from "../services/role.service";
import { TradeService } from "../services/trade.service";
import { VoteService } from "../services/vote.service";
import { NamesmithDependencies } from "../types/namesmith.types";
import { setupEventListeners } from "./setup-event-listeners";

/**
 * Initializes all the dependencies required for the Namesmith game to run.
 * This sets up all the repositories and services with the correct dependencies.
 * It should be called before any of the event listeners are set up, and before any tests are run.
 * @returns The dependencies required for the Namesmith game to run.
 */
export const initializeDependencies = async (): Promise<NamesmithDependencies> => {
	const db = await setupDatabase();

	const mysteryBoxRepository = new MysteryBoxRepository(db);
	const characterRepository = new CharacterRepository(db);
	const gameStateRepository = new GameStateRepository(db);
	const recipeRepository = new RecipeRepository(db);
	const perkRepository = new PerkRepository(db);
	const roleRepository = new RoleRepository(db, perkRepository);
	const playerRepository = new PlayerRepository(db, roleRepository, perkRepository);
	const tradeRepository = new TradeRepository(db, playerRepository);
	const voteRepository = new VoteRepository(db, playerRepository);
	const questRepository = new QuestRepository(db);
	const activityLogRepository = new ActivityLogRepository(db, playerRepository, recipeRepository, questRepository);

	const mysteryBoxService = new MysteryBoxService(mysteryBoxRepository, characterRepository);
	const characterService = new CharacterService(characterRepository);
	const playerService = new PlayerService(playerRepository);
	const voteService = new VoteService(voteRepository, playerService);
	const recipeService = new RecipeService(recipeRepository, playerService);
	const tradeService = new TradeService(tradeRepository, playerService);
	const gameStateService = new GameStateService(gameStateRepository, playerService, voteService, recipeService);
	const perkService = new PerkService(perkRepository, roleRepository, playerService);
	const roleService = new RoleService(roleRepository, playerService)
	const activityLogService = new ActivityLogService(activityLogRepository);
	const questService = new QuestService(questRepository, activityLogService, playerService);

	const namesmithDependencies: NamesmithDependencies = {
		db,
		mysteryBoxRepository, characterRepository, playerRepository, gameStateRepository, voteRepository, recipeRepository, tradeRepository, perkRepository, roleRepository, questRepository, activityLogRepository,
		mysteryBoxService, characterService, playerService, voteService, recipeService, tradeService, gameStateService, perkService, roleService, questService, activityLogService,
	};

	global.namesmith = namesmithDependencies;

	return namesmithDependencies
};

/**
 * Sets up Namesmith by loading and setting up the necessary repositories and services when the bot starts up.
 */
export const setupNamesmith = async () => {
	logInfo("Setting up Namesmith...");
	await initializeDependencies();

	const { gameStateService } = getNamesmithServices();

	setupEventListeners();

	if (gameStateService.hasStarted()) {
		gameStateService.scheduleGameEvents();

		await regenerateRecipeSelectMenu();
		await regenerateVoteDisplay();
		await regenerateAllTradeMessages();
		await regenerateChooseARoleMessage();
		await regeneratePickAPerkMessage();
		await regenerateDailyQuestsMessage();
	}

	logSuccess("Namesmith set up");
}