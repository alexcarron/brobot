import { ButtonInteraction } from "discord.js";
import { getNamesmithServices } from "../services/get-namesmith-services";

/**
 * Checks if an interaction is a vote button press event.
 * @param interaction - The interaction to check.
 * @returns `true` if the interaction is a vote button press event, `false` otherwise.
 */
export const isVoteButtonInteraction = (interaction: ButtonInteraction): boolean => {
	if (
		interaction instanceof ButtonInteraction &&
		interaction.isButton() &&
		interaction.customId.startsWith("vote-")
	)
		return true;

	return false;
}

/**
 * Handles a vote button press event. This is used to vote for a name submitted to the Names to Vote On channel.
 * @param buttonInteraction - The interaction that triggered the event.
 */
export const onVoteButtonPressed = (buttonInteraction: ButtonInteraction) => {
	const buttonID = buttonInteraction.customId;
	const userID = buttonInteraction.user.id;


	const votedPlayerID = buttonID.split('-')[1];

	const { playerService, voteService } = getNamesmithServices();
	const playerName = playerService.getPublishedName(votedPlayerID);
	let feedbackMessage = `You have voted for ${playerName}!`;
	try {
		feedbackMessage = voteService.addVote({
			voterID: userID,
			playerVotedForID: votedPlayerID
		});
	}
	catch (error) {
		buttonInteraction.reply({
			content: error.message, ephemeral: true
		});
		return;
	}

	buttonInteraction.reply({ content: feedbackMessage, ephemeral: true });
};