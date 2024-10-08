const { PermissionFlagsBits } = require("discord.js");
const Parameter = require("../../modules/commands/Paramater");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { deferInteraction, getGuild, getChannel, getMessage } = require("../../modules/functions");

const Parameters = {
	MessageLink: new Parameter({
		type: "string",
		name: "message-link",
		description: "The link to the message your reacting to"
	}),
	Reaction: new Parameter({
		type: "string",
		name: "reaction",
		description: "The emoji your reacting with"
	}),
}

const command = new SlashCommand({
	name: "react",
	description: "React to a message with an emoji",
});
command.required_permissions = [PermissionFlagsBits.Administrator]
command.parameters = [
	Parameters.MessageLink,
	Parameters.Reaction,
]
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const message_link = interaction.options.getString(Parameters.MessageLink.name);
	const reaction_str = interaction.options.getString(Parameters.Reaction.name);

	const guild_id = message_link.split('/').at(-3); // @ TODO Finish v
	const channel_id = message_link.split('/').at(-2); // @ TODO Finish v
	const message_id = message_link.split('/').at(-1); // @ TODO Finish v
	// https://discord.com/channels/GUILD_ID/CHANNEL_ID/MESSAGE_ID

	const guild = await getGuild(guild_id);
	const channel = await getChannel(guild, channel_id);
	const message = await getMessage(channel, message_id);

	try {
		message.react(reaction_str).catch(console.error);
		interaction.editReply(`Reacted to ${message_link} with ${reaction_str}`);
	}
	catch {
		interaction.editReply(`Can't access message`);
	}
}

module.exports = command;