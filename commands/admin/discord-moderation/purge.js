const { PermissionFlagsBits } = require("discord.js");
const Parameter = require("../../../services/command-creation/Paramater");
const SlashCommand = require("../../../services/command-creation/slash-command");
const { deferInteraction } = require("../../../utilities/discord-action-utils");

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
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.parameters = [
	Parameters.NumMessagesDeleting
]
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const num_messages_deleting = interaction.options.getInteger(Parameters.NumMessagesDeleting.name);
	const times_purging = Math.floor(num_messages_deleting / 100)
	const last_num_messages_deleting = num_messages_deleting % 100;


	console.log({num_messages_deleting, times_purging, last_num_messages_deleting});

	for (let num_purge = 0; num_purge < times_purging; num_purge++) {
		try {
			await interaction.channel.bulkDelete(100);
		}
		catch {
			interaction.editReply("Couldn't bulk delete");
		}
	}

	if (last_num_messages_deleting > 0) {
		await interaction.channel.bulkDelete(last_num_messages_deleting);
	}
}
module.exports = command;