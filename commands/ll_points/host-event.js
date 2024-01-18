const SlashCommand = require('../../modules/commands/SlashCommand.js');
const { deferInteraction, confirmAction, getUser } = require("../../modules/functions.js");
const { ModalBuilder } = require('discord.js');

const command = new SlashCommand({
	name: "host-event",
	description: "Host your own custom event on your own",
});
command.parameters = [
]
command.allowsDMs = true;
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	if (interaction.channel.type !== 'dm')
		return interaction.editReply("You may only use this command in my DMs.");

		if (
			!await confirmAction({
				interaction,
				message:
					`Are you absolutely sure you want to host an event?\n` +
					`You will be responsible for\n` +
					`- Determining the rules of the event and how it will exactly play out\n` +
					`- Writing instructions for how to participate in the event\n` `- Being present during the time you choose and hosting the event yourself`,
				confirm_txt: `I'm Sure`,
				cancel_txt: `I Don't Want To Host An Event`,
				confirm_update_txt: `Confirmed. You will now start the process of creating the event`,
				cancel_update_txt: `Canceled.`
			})
		) {
			return
		}

		const modal = new ModalBuilder()
			.setCustomId('myModal')
			.setTitle('My Modal');

		// Create the text input components
		const favoriteColorInput = new TextInputBuilder()
			.setCustomId('favoriteColorInput')
				// The label is the prompt the user sees for this input
			.setLabel("What's your favorite color?")
				// Short means only a single line of text
			.setStyle(TextInputStyle.Short);

		const hobbiesInput = new TextInputBuilder()
			.setCustomId('hobbiesInput')
			.setLabel("What's some of your favorite hobbies?")
				// Paragraph means multiple lines of text.
			.setStyle(TextInputStyle.Paragraph);

		// An action row only holds one text input,
		// so you need one action row per text input.
		const firstActionRow = new ActionRowBuilder().addComponents(favoriteColorInput);
		const secondActionRow = new ActionRowBuilder().addComponents(hobbiesInput);

		// Add inputs to the modal
		modal.addComponents(firstActionRow, secondActionRow);

		// Show the modal to the user
		await interaction.showModal(modal);

		interaction.followUp("Test");
}
module.exports = command;