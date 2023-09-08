const { PermissionFlagsBits } = require("discord.js")
const Parameter = require("../../modules/commands/Paramater")
const SlashCommand = require("../../modules/commands/SlashCommand");
const { deferInteraction } = require("../../modules/functions");

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

const command = new SlashCommand({
	name: "dm",
	description: "DM a user a message",
});
command.required_permissions = [PermissionFlagsBits.Administrator]
command.parameters = [
	Parameters.UserDMing,
	Parameters.Message,
];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const user_dming = interaction.options.getUser(Parameters.UserDMing.name);
	const message_dming = interaction.options.getString(Parameters.Message.name);
	user_dming.send(message_dming);

	interaction.editReply(`DMed <@${user_dming.id}>: ${message_dming}`);
}

module.exports = command;