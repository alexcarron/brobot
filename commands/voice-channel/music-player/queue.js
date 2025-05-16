const { PermissionFlagsBits, PermissionsBitField } = require("discord.js");
const SlashCommand = require("../../../services/command-creation/slash-command");
const { deferInteraction } = require("../../../utilities/discord-action-utils");
const Parameter = require("../../../services/command-creation/parameter");
const { EmbedBuilder } = require("@discordjs/builders");

const Parameters = {
	PageNumber: new Parameter({
		type: "integer",
		name: "page-number",
		description: "Page number for queue",
		min_value: 1,
		isRequried: false,
	}),
}

const command = new SlashCommand({
	name: "queue",
	description: "Displays current song queue",
});
command.parameters = [
	Parameters.PageNumber
]
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const queue = await global.client.player.queues.get(interaction.channel.guild);

	if (!queue || !queue.isPlaying()) {
		return await interaction.editReply("There's no songs in the queue");
	}

	const total_pages = Math.ceil(queue.tracks.size / 10) || 1
	const page_number = (interaction.options.getInteger(Parameters.PageNumber.name) || 1) - 1;

	if (page_number > total_pages) {
		return await interaction.editReply(`Invalid page number ${page_number} is higher than total ${total_pages}`)
	}

	const queue_string =
		queue.tracks.store.slice(page_number * 10, page_number * 10 + 10)
		.map((song, index) => {
			return `**${page_number * 10 + index + 1}**: \`${song.duration}\` ${song.title} - <@${song.requestedBy.id}>\n`
		});

	const curr_song = queue.currentTrack;

	await interaction.editReply({
		content: "",
		embeds: [
			new EmbedBuilder()
				.setDescription(
					"**Currently Playing**" + "\n" +
					(curr_song ? `\`${curr_song.duration}\` ${curr_song.title} - <@${curr_song.requestedBy.id}>` : "None") + "\n" +
					"\n" +
					`**Queue**` + "\n" +
					`${queue_string.join("")}`
				)
				.setFooter({
					text: `Page ${page_number + 1} of  ${total_pages}`
				})
				.setThumbnail(curr_song.thumbnail)
		]
	});
}
module.exports = command;