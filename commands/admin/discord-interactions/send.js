const { PermissionFlagsBits } = require("discord.js");
const { Parameter } = require("../../../services/command-creation/parameter");
const { SlashCommand } = require("../../../services/command-creation/slash-command");
const { deferInteraction } = require("../../../utilities/discord-action-utils");
const { getChannelParamValue } = require("../../../utilities/discord-fetch-utils");

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

module.exports = new SlashCommand({
	name: "send",
	description: "Sends a message to a certain channel",
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		Parameters.Channel,
		Parameters.Message,
	],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		const channel = getChannelParamValue(interaction,Parameters.Channel.name);
		const message = interaction.options.getString(Parameters.Message.name);

		await channel.send(message);

		await interaction.editReply(`Sent \`${message}\` to **${channel}**`)
	}
});