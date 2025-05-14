const { PermissionFlagsBits, PermissionsBitField } = require("discord.js");
const SlashCommand = require("../../../modules/commands/SlashCommand");
const { deferInteraction } = require("../../../utilities/discord-action-utils");
const { EmbedBuilder } = require("@discordjs/builders");

const command = new SlashCommand({
	name: "currently-playing",
	description: "Get info of current song",
});
command.execute = async function(interaction) {
	await deferInteraction(interaction);


	const queue = await global.client.player.queues.get(interaction.channel.guild);

	if (!queue || !queue.isPlaying()) {
		return await interaction.editReply("There's no songs in the queue");
	}

	const progress_bar = queue.node.createProgressBar({
		queue: false,
		length: 19
	});

	const song = queue.currentTrack

	await interaction.editReply({
		content: "",
		embeds: [
			new EmbedBuilder()
				.setThumbnail(song.thumbnail)
				.setDescription(
					`Currently Playing ${song.title} ${song.url}` + "\n" +
					"\n" +
					progress_bar
				)
		]
	});
}
module.exports = command;