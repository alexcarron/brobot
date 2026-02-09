import { ids } from "../../../../bot-config/discord-ids";
import { toUnixTimestamp } from "../../../../utilities/date-time-utils";
import { sendMessageInChannel } from "../../../../utilities/discord-action-utils";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";

export const sendInitialVotingMessage = async () => {
	const {gameStateService} = getNamesmithServices();
	const voteEndDate = gameStateService.timeVotingEnds;
	
	const namesToVoteOnChannel = await fetchNamesmithChannel(ids.namesmith.channels.NAMES_TO_VOTE_ON);
	await sendMessageInChannel(namesToVoteOnChannel, 
		`The game has ended. Now you can vote on the players' final names.`,
		``,
		`Select your top three favorite names using the buttons below each name:`,
		`🥇 **Vote 1st** (Your favorite)`,
		`🥈 **Vote 2nd** (Your next favorite)`,
		`🥉 **Vote 3rd** (Your third next favorite)`,
		``,
		`You can vote for just one or two names, but it's recommend you vote for your top 3.`,
		`-# Voting ends <t:${toUnixTimestamp(voteEndDate)}:R>`,
	);
}