import { logSetup } from "../../../utilities/logging-utils";
import { setupDatabase } from "../database/setup-database";
import { regenerateChooseARoleMessage } from "../interfaces/choose-a-role-message";
import { regeneratePickAPerkMessage } from "../interfaces/pick-a-perk-message";
import { regenerateDailyQuestsMessages } from "../interfaces/quests/daily-quests-message";
import { regenerateHiddenQuestsMessages } from "../interfaces/quests/hidden-quests-message";
import { regenerateWeeklyQuestsMessages } from "../interfaces/quests/weekly-quests-message";
import { regenerateAllTradeMessages } from "../interfaces/trading/trade-message";
import { regenerateVotingDisplay } from "../interfaces/voting/voting-display";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { NamesmithDependencies } from "../types/namesmith.types";
import { createRepositoriesFromDB, createServicesFromDB } from "../utilities/dependency.utility";
import { setupEventListeners } from "./setup-event-listeners";

/**
 * Initializes all the dependencies required for the Namesmith game to run.
 * This sets up all the repositories and services with the correct dependencies.
 * It should be called before any of the event listeners are set up, and before any tests are run.
 * @returns The dependencies required for the Namesmith game to run.
 */
export const initializeDependencies = async (): Promise<NamesmithDependencies> => {
	const db = await setupDatabase();
	const repositories = createRepositoriesFromDB(db);
	const services = createServicesFromDB(db);

	const namesmithDependencies: NamesmithDependencies = {
		db,
		...repositories,
		...services,
	};

	global.namesmith = namesmithDependencies;

	return namesmithDependencies
};

/**
 * Sets up Namesmith by loading and setting up the necessary repositories and services when the bot starts up.
 */
export const setupNamesmith = async () => {
	await initializeDependencies();

	const { gameStateService } = getNamesmithServices();

	setupEventListeners();
 
	if (gameStateService.hasStarted()) {
		gameStateService.scheduleGameEvents();

		await Promise.all([
			logSetup('[TRADE MESSAGES]', regenerateAllTradeMessages()),
			logSetup('[ROLE MESSAGES]', regenerateChooseARoleMessage()),
			logSetup('[PERK MESSAGES]', regeneratePickAPerkMessage()),
			logSetup('[DAILY QUEST MESSAGES]', regenerateDailyQuestsMessages()),
			logSetup('[HIDDEN QUEST MESSAGES]', regenerateHiddenQuestsMessages()),
			logSetup('[WEEKLY QUEST MESSAGES]', regenerateWeeklyQuestsMessages()),
			logSetup('[VOTE ENTRY MESSAGES]', regenerateVotingDisplay()),
		]);
	}
}