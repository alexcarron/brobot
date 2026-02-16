import { ids } from "../../../../bot-config/discord-ids";
import { toUnixTimestamp } from "../../../../utilities/date-time-utils";
import { DiscordButtons } from "../../../../utilities/discord-interfaces/discord-buttons";
import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { getSeeMyVotesButton } from "./see-my-votes-button";

export function getInitialVotingMessage() {
	const {gameStateService} = getNamesmithServices();
	const voteEndDate = gameStateService.timeVotingEnds;
	
	const initialVotingMessage = new DiscordButtons({
		promptText: joinLines(
			`The game has ended. Now you can vote on the players' final names.`,
			``,
			`Select your top three favorite names using the buttons below each name:`,
			`🥇 **Vote 1st** (Your favorite)`,
			`🥈 **Vote 2nd** (Your next favorite)`,
			`🥉 **Vote 3rd** (Your third next favorite)`,
			``,
			`You can vote for just one or two names, but it's recommend you vote for your top 3.`,
			`-# Voting ends <t:${toUnixTimestamp(voteEndDate)}:R>`,
		),
		buttons: [
			getSeeMyVotesButton(),
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
	await initialVotingMessage.regenerate({channel: namesToVoteOnChannel});
}