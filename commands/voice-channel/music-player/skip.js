const { PermissionFlagsBits, PermissionsBitField, Embed } = require("discord.js");
const SlashCommand = require("../../../services/command-creation/slash-command");
const { deferInteraction } = require("../../../utilities/discord-action-utils");
const { EmbedBuilder } = require("@discordjs/builders");

const command = new SlashCommand({
	name: "skip",
	description: "Skips current song",
});
// command.required_permissions = [PermissionFlagsBits.Administrator];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const queue = await global.client.player.queues.get(interaction.channel.guild);

	if (!queue || !queue.isPlaying()) {
		return await interaction.editReply("There's no songs in the queue");
	}

	const curr_song = queue.currentTrack;

	queue.node.skip();

	await interaction.editReply({
		content: "",
		embeds: [
			new EmbedBuilder()
				.setDescription(`${curr_song.title} has been skipped!`)
				.setThumbnail(curr_song.thumbnail)
		]
	});
}
module.exports = command;