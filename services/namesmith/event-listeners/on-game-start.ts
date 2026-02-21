import { ids } from '../../../bot-config/discord-ids';
import { toUnixTimestamp } from '../../../utilities/date-time-utils';
import { logSetup } from '../../../utilities/logging-utils';
import { joinLines } from '../../../utilities/string-manipulation-utils';
import { sendChooseARoleMessage } from '../interfaces/choose-a-role-message';
import { getNamesmithServices } from '../services/get-namesmith-services';
import { clearChooseARoleChannel, clearNamesToVoteOnChannel, clearPickAPerkChannel, clearPublishedNamesChannel, clearQuestsChannel, clearTheResultsChannel, closeNamesToVoteOnChannel, closeTheResultsChannel, isNonPlayer, openPublishedNamesChannel, resetMemberToNewPlayer, sendToNamesmithChannel } from '../utilities/discord-action.utility';
import { fetchNamesmithGuildMembers } from '../utilities/discord-fetch.utility';
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
	await Promise.all([
		logSetup('[CLEAR CHOOSE A ROLE CHANNEL]', clearChooseARoleChannel()),
		logSetup('[CLEAR PICK A PERK CHANNEL]', clearPickAPerkChannel()),
		logSetup('[CLEAR QUESTS CHANNEL]', clearQuestsChannel()),
		logSetup('[CLOSE NAMES TO VOTE ON CHANNEL]', closeNamesToVoteOnChannel()),
		logSetup('[CLEAR NAMES TO VOTE ON CHANNEL]', clearNamesToVoteOnChannel()),
		logSetup('[CLOSE THE RESULTS CHANNEL]', closeTheResultsChannel()),
		logSetup('[CLEAR THE RESULTS CHANNEL]', clearTheResultsChannel()),
		logSetup('[CLEAR PUBLISHED NAMES CHANNEL]', clearPublishedNamesChannel()),
		logSetup('[OPEN PUBLISHED NAMES CHANNEL]', openPublishedNamesChannel()),
	]);

	// Set up the players
	playerService.reset();
	const guildMembers = await fetchNamesmithGuildMembers();

	for (const guildMember of guildMembers) {
		if (await isNonPlayer(guildMember))
			continue;

		if (playerService.isPlayer(guildMember.id))
			continue;

		playerService.addNewPlayer(guildMember.id);
		await resetMemberToNewPlayer(guildMember);
	}

	perkService.reset();
	questService.reset();

	await sendChooseARoleMessage();

	// Set the game start and end times
	gameStateService.reset();
	const now = new Date();
	gameStateService.setupTimings(now);
	gameStateService.scheduleGameEvents();

	const timeVotingStarts = gameStateService.timeVotingStarts;
	
	await sendToNamesmithChannel(ids.namesmith.channels.DEVELOPMENT_NEWS, joinLines(
		`<@&${ids.namesmith.roles.smithedName}> <@&${ids.namesmith.roles.noName}>`,
		`A new Namesmith game has started!`,
		`The theme is: **${theme}**`,
		``,
		`-# The time to build your name ends and voting starts <t:${toUnixTimestamp(timeVotingStarts)}:R>`,
	));

	NamesmithEvents.DayStart.triggerEvent({});
	NamesmithEvents.WeekStart.triggerEvent({});
}