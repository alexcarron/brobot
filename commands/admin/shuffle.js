const { PermissionFlagsBits, PermissionsBitField } = require("discord.js");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { deferInteraction } = require("../../modules/functions");

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