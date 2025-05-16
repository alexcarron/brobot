const { PermissionFlagsBits, PermissionsBitField } = require("discord.js");
const SlashCommand = require("../../../services/command-creation/slash-command");
const { deferInteraction } = require("../../../utilities/discord-action-utils");
const { QueueRepeatMode } = require("discord-player");

const command = new SlashCommand({
	name: "loop",
	description: "Loop the queue",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const queue = await global.client.player.queues.get(interaction.channel.guild);

	if (!queue || !queue.isPlaying()) {
		return await interaction.editReply("There's no songs in the queue");
	}

	if (queue.repeatMode === QueueRepeatMode.OFF) {
		queue.setRepeatMode(QueueRepeatMode.QUEUE);
		await interaction.editReply(`Turned on looping for the queue`);
	} else {
		queue.setRepeatMode(QueueRepeatMode.OFF);
		await interaction.editReply(`Turned off looping for the queue`);
	}

}
module.exports = command;