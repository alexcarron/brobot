import { sendChooseARoleMessage } from '../interfaces/choose-a-role-message';
import { sendPickAPerkMessage } from '../interfaces/pick-a-perk-message';
import { sendDailyQuestsMessage } from '../interfaces/quests/daily-quests-message';
import { sendRecipeSelectMenu } from '../interfaces/recipe-select-menu';
import { getNamesmithServices } from '../services/get-namesmith-services';
import { clearNamesToVoteOnChannel, clearPublishedNamesChannel, clearTheWinnerChannel, closeNamesToVoteOnChannel, closeTheWinnerChannel, openPublishedNamesChannel } from '../utilities/discord-action.utility';

/**
 * Starts a new game by doing the following
 * - Resetting the channel permissions
 * - Setting up the players
 * - Sending the recipe select menu
 * - Setting the game start and end times
 * - Starting the cron jobs to end the game and end voting at the times stored in the game state
 */
export async function startGame(): Promise<void> {
	const { gameStateService, playerService, perkService } = getNamesmithServices();

	// Reset the channel permissions
	await closeNamesToVoteOnChannel();
	await clearNamesToVoteOnChannel();

	await closeTheWinnerChannel();
	await clearTheWinnerChannel();

	await clearPublishedNamesChannel();
	await openPublishedNamesChannel();

	// Set up the players
	playerService.reset();
	await playerService.addEveryoneInServer();

	// Set up the perks
	perkService.reset();

	// Send the recipe select menu in the recipes channel
	await sendRecipeSelectMenu();
	await sendChooseARoleMessage();
	await sendPickAPerkMessage();
	await sendDailyQuestsMessage();

	// Set the game start and end times
	const now = new Date();
	gameStateService.setupTimings(now);
	gameStateService.scheduleGameEvents();
}