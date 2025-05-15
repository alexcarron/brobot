const { PermissionFlagsBits, PermissionsBitField } = require("discord.js");
const SlashCommand = require("../../../services/command-creation/SlashCommand");
const { deferInteraction } = require("../../../utilities/discord-action-utils");

const command = new SlashCommand({
	name: "resume",
	description: "Resumes the currently playing music",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const queue = await global.client.player.queues.get(interaction.channel.guild);

	if (!queue || !queue.isPlaying()) {
		return await interaction.editReply("There's no songs in the queue");
	}

	queue.node.setPaused(false);

	await interaction.editReply(`Resume! Use \`/pause\` to return to pausing`);
}
module.exports = command;