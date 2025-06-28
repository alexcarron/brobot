const { ButtonInteraction } = require("discord.js");
const { getNamesmithServices } = require("../services/get-namesmith-services");

/**
 * Checks if an interaction is a vote button press event.
 * @param {ButtonInteraction} interaction - The interaction to check.
 * @returns {boolean} `true` if the interaction is a vote button press event, `false` otherwise.
 */
const isVoteButtonInteraction = (interaction) => {
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
 * @param {ButtonInteraction} buttonInteraction - The interaction that triggered the event.
 * @returns {Promise<void>} A promise that resolves once the event has been handled.
 */
const onVoteButtonPressed = async (buttonInteraction) => {
	const buttonID = buttonInteraction.customId;
	const userID = buttonInteraction.user.id;


	const votedPlayerID = buttonID.split('-')[1];

	const { playerService, voteService } = getNamesmithServices();
	const playerName = await playerService.getPublishedName(votedPlayerID);
	let feedbackMessage = `You have voted for ${playerName}!`;
	try {
		feedbackMessage = await voteService.addVote({
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

module.exports = { isVoteButtonInteraction, onVoteButtonPressed };