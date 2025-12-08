import { logInfo, logSuccess } from "../../../utilities/logging-utils";
import { setupDatabase } from "../database/setup-database";
import { regenerateChooseARoleMessage } from "../interfaces/choose-a-role-message";
import { regeneratePickAPerkMessage } from "../interfaces/pick-a-perk-message";
import { regenerateDailyQuestsMessage } from "../interfaces/quests/daily-quests-message";
import { regenerateAllTradeMessages } from "../interfaces/trading/trade-message";
import { regenerateVoteDisplay } from "../interfaces/voting/voting-messages";
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
	logInfo("Setting up Namesmith...");
	await initializeDependencies();

	const { gameStateService } = getNamesmithServices();

	setupEventListeners();

	if (gameStateService.hasStarted()) {
		gameStateService.scheduleGameEvents();

		await regenerateVoteDisplay();
		await regenerateAllTradeMessages();
		await regenerateChooseARoleMessage();
		await regeneratePickAPerkMessage();
		await regenerateDailyQuestsMessage();
	}

	logSuccess("Namesmith set up");
}