const { PermissionFlagsBits, PermissionsBitField } = require("discord.js");
const SlashCommand = require("../../../services/command-creation/slash-command");
const { deferInteraction } = require("../../../utilities/discord-action-utils");

const command = new SlashCommand({
	name: "shuffle",
	description: "Shuffles the queue",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const queue = await global.client.player.queues.get(interaction.channel.guild);

	if (!queue || !queue.isPlaying()) {
		return await interaction.editReply("There's no songs in the queue");
	}

	queue.tracks.shuffle();

	await interaction.editReply(`Queue shuffled with ${queue.tracks.size} songs`);
}
module.exports = command;