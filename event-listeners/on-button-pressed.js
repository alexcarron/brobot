const { ButtonInteraction } = require("discord.js");
const { isVoteButtonInteraction, onVoteButtonPressed } = require("../services/namesmith/event-listeners/on-vote-button-pressed");

/**
 * Event listener for when a button is pressed
 * @param {ButtonInteraction} buttonInteraction - The button interaction that was pressed
 */
const onButtonPressed = async function(buttonInteraction) {
	if (isVoteButtonInteraction(buttonInteraction))
		await onVoteButtonPressed(buttonInteraction);
}

module.exports = { onButtonPressed };