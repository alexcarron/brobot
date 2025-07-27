const { PermissionFlagsBits } = require("discord.js");
const { Parameter } = require("../../../services/command-creation/parameter");
const { SlashCommand } = require("../../../services/command-creation/slash-command");
const { fetchGuild, fetchMessage, fetchTextChannel, getRequiredStringParam } = require("../../../utilities/discord-fetch-utils");
const { deferInteraction } = require("../../../utilities/discord-action-utils");

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

module.exports = new SlashCommand({
	name: "react",
	description: "React to a message with an emoji",
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		Parameters.MessageLink,
		Parameters.Reaction,
	],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		const message_link = getRequiredStringParam(interaction, Parameters.MessageLink.name);
		const reaction_str = getRequiredStringParam(interaction, Parameters.Reaction.name);

		const guild_id = message_link.split('/').at(-3); // @ TODO Finish v
		const channel_id = message_link.split('/').at(-2); // @ TODO Finish v
		const message_id = message_link.split('/').at(-1); // @ TODO Finish v
		// https://discord.com/channels/GUILD_ID/CHANNEL_ID/MESSAGE_ID

		if (!guild_id || !channel_id || !message_id) {
			interaction.editReply(`We could not parse the message link: ${message_link}. Please try again.`);
			return;
		}

		const guild = await fetchGuild(guild_id);
		const channel = await fetchTextChannel(guild, channel_id);
		const message = await fetchMessage(channel, message_id);

		try {
			message.react(reaction_str).catch(console.error);
			interaction.editReply(`Reacted to ${message_link} with ${reaction_str}`);
		}
		catch {
			interaction.editReply(`Can't access message`);
		}
	}
});