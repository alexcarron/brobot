import { ids } from '../../../bot-config/discord-ids';
import { joinLines } from '../../../utilities/string-manipulation-utils';
import { sendChooseARoleMessage } from '../interfaces/choose-a-role-message';
import { getNamesmithServices } from '../services/get-namesmith-services';
import { clearChooseARoleChannel, clearNamesToVoteOnChannel, clearPickAPerkChannel, clearPublishedNamesChannel, clearQuestsChannel, clearTheWinnerChannel, closeNamesToVoteOnChannel, closeTheWinnerChannel, openPublishedNamesChannel, sendToNamesmithChannel } from '../utilities/discord-action.utility';
import { NamesmithEvents } from './namesmith-events';

/**
 * Starts a new game by doing the following
 * - Resetting the channel permissions
 * - Setting up the players
 * - Sending the recipe select menu
 * - Setting the game start and end times
 * - Starting the cron jobs to end the game and end voting at the times stored in the game state
 * @param theme - The theme to use for this game
 */
export async function startGame(theme: string): Promise<void> {
	const { gameStateService, playerService, perkService, questService } = getNamesmithServices();

	// Reset the channel permissions
	await closeNamesToVoteOnChannel();
	await clearNamesToVoteOnChannel();

	await closeTheWinnerChannel();
	await clearTheWinnerChannel();

	await clearPublishedNamesChannel();
	await openPublishedNamesChannel();

	await clearChooseARoleChannel();
	await clearPickAPerkChannel();
	await clearQuestsChannel();

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

	await sendToNamesmithChannel(ids.namesmith.channels.DEVELOPMENT_NEWS, joinLines(
		`<@&${ids.namesmith.roles.smithedName}> <@&${ids.namesmith.roles.noName}>`,
		`A new Namesmith game has started!`,
		`The theme is: **${theme}**`,
	));

	NamesmithEvents.DayStart.triggerEvent({});
	NamesmithEvents.WeekStart.triggerEvent({});
}