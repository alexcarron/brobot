import { ids } from "../../../../bot-config/discord-ids";
import { toUnixTimestamp } from "../../../../utilities/date-time-utils";
import { DiscordButtons } from "../../../../utilities/discord-interfaces/discord-buttons";
import { ignoreError } from "../../../../utilities/error-utils";
import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { getPingForAllPlayers } from "../../utilities/player-message.utility";
import { getClearMyVotesButton } from "./clear-my-votes-button";
import { getSeeMyVotesButton } from "./see-my-votes-button";

export const INITIAL_VOTING_TEXT = (
	{ voteEndDate, theme }: { voteEndDate: Date, theme: string | null }
) => joinLines(
	getPingForAllPlayers(),
	`The game has ended.`,
	``,
	theme ? [`The theme players had to follow was **${theme}**.`, ``] : undefined,
	`Now you can vote on the players' published names.`,
	``,
	`Select your top three favorite names using the buttons below each name:`,
	`🥇 **Vote 1st** (Your favorite)`,
	`🥈 **Vote 2nd** (Your next favorite)`,
	`🥉 **Vote 3rd** (Your third next favorite)`,
	``,
	`You can vote for just one or two names, but it's recommend you vote for your top 3.`,
	`-# Voting ends <t:${toUnixTimestamp(voteEndDate)}:R>`,
);

export function getInitialVotingMessage() {
	const {gameStateService} = getNamesmithServices();
	const voteEndDate = gameStateService.getTimeVotingEnds();
	const theme = gameStateService.getTheme();

	const initialVotingMessage = new DiscordButtons({
		promptText: INITIAL_VOTING_TEXT({ voteEndDate, theme }),
		buttons: [
			getSeeMyVotesButton(),
			getClearMyVotesButton(),
		],
	});
	return initialVotingMessage;
}

export const sendInitialVotingMessage = async () => {
	const namesToVoteOnChannel = await fetchNamesmithChannel(ids.namesmith.channels.NAMES_TO_VOTE_ON);
	const initialVotingMessage = getInitialVotingMessage();
	await initialVotingMessage.sendIn(namesToVoteOnChannel);
}

export async function regenerateInitialVotingMessage() {
	const namesToVoteOnChannel = await fetchNamesmithChannel(ids.namesmith.channels.NAMES_TO_VOTE_ON);
	const initialVotingMessage = getInitialVotingMessage();
	await ignoreError(initialVotingMessage.regenerate({channel: namesToVoteOnChannel}));
}