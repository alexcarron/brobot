const { PermissionFlagsBits } = require("discord.js");
const Parameter = require("../../../modules/commands/Paramater");
const SlashCommand = require("../../../modules/commands/SlashCommand");
const { deferInteraction } = require("../../../utilities/discord-action-utils");

const Parameters = {
	Channel: new Parameter({
		type: "channel",
		name: "channel",
		description: "The channel the message will be sent to"
	}),
	Message: new Parameter({
		type: "string",
		name: "message",
		description: "The message that will be sent"
	}),
}

const command = new SlashCommand({
	name: "send",
	description: "Sends a message to a certain channel",
});
command.required_permissions = [PermissionFlagsBits.Administrator]
command.parameters = [
	Parameters.Channel,
	Parameters.Message,
]
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const channel = interaction.options.getChannel(Parameters.Channel.name);
	const message = interaction.options.getString(Parameters.Message.name);
	channel.send(message);

	await interaction.editReply(`Sent \`${message}\` to **${channel}**`)
}

module.exports = command;