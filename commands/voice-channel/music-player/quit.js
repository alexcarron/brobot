const { PermissionFlagsBits, PermissionsBitField } = require("discord.js");
const SlashCommand = require("../../../modules/commands/SlashCommand");
const { deferInteraction } = require("../../../utilities/discord-action-utils");

const command = new SlashCommand({
	name: "quit",
	description: "Quit playing music and clear queue",
});
// command.required_permissions = [PermissionFlagsBits.Administrator];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const queue = await global.client.player.queues.get(interaction.channel.guild);

	if (!queue || !queue.isPlaying()) {
		return await interaction.editReply("There's no songs in the queue");
	}

	queue.delete();

	await interaction.editReply("I quit!");
}
module.exports = command;