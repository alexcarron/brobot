const { PermissionFlagsBits } = require("discord.js");
const { Parameter } = require("../../../services/command-creation/parameter");
const { SlashCommand } = require("../../../services/command-creation/slash-command");
const { deferInteraction, editReplyToInteraction } = require("../../../utilities/discord-action-utils");

const Parameters = {
	NumMessagesDeleting: new Parameter({
		type: "integer",
		name: "num-messages-deleting",
		description: "The number of messages you want to mass delete",
	}),
}

const command = new SlashCommand({
	name: "purge",
	description: "Mass delete multiple messages at a time",
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		Parameters.NumMessagesDeleting
	],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		const numMessagesDeleting = interaction.options.getInteger(Parameters.NumMessagesDeleting.name);
		const times_purging = Math.floor(numMessagesDeleting / 100)
		const lastNumMessagesDeleting = numMessagesDeleting % 100;

		for (let num_purge = 0; num_purge < times_purging; num_purge++) {
			try {
				await interaction.channel.bulkDelete(100);
			}
			catch {
				interaction.editReply("Couldn't bulk delete");
			}
		}

		if (lastNumMessagesDeleting > 0) {
			await interaction.channel.bulkDelete(lastNumMessagesDeleting);
		}

		await editReplyToInteraction(interaction,
			`Deleted \`${numMessagesDeleting}\` messages.`
		)
	}
});
module.exports = command;