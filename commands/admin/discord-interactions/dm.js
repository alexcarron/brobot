const { PermissionFlagsBits } = require("discord.js")
const { Parameter } = require("../../../services/command-creation/parameter")
const { SlashCommand } = require("../../../services/command-creation/slash-command");
const { deferInteraction } = require("../../../utilities/discord-action-utils");
const { getRequiredUserParam, getRequiredStringParam } = require("../../../utilities/discord-fetch-utils");

const Parameters = {
	UserDMing: new Parameter({
		type: "user",
		name: "user-dming",
		description: "The user you want Brobot to DM"
	}),
	Message: new Parameter({
		type: "string",
		name: "message",
		description: "The message you want DMed to the user"
	}),
}

module.exports = new SlashCommand({
	name: "dm",
	description: "DM a user a message",
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		Parameters.UserDMing,
		Parameters.Message,
	],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		const user_dming = getRequiredUserParam(interaction, Parameters.UserDMing.name);
		const message_dming = getRequiredStringParam(interaction, Parameters.Message.name);
		user_dming.send(message_dming);

		interaction.editReply(`DMed <@${user_dming.id}>: ${message_dming}`);
	}
});