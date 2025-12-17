import { sendChooseARoleMessage } from '../interfaces/choose-a-role-message';
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
	const { gameStateService, playerService, perkService, questService } = getNamesmithServices();

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

	// Set up the quests
	questService.reset();

	// Send the recipe select menu in the recipes channel
	await sendChooseARoleMessage();

	// Set the game start and end times
	const now = new Date();
	gameStateService.setupTimings(now);
	gameStateService.scheduleGameEvents();
}