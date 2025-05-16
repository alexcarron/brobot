const { PermissionFlagsBits, PermissionsBitField } = require("discord.js");
const SlashCommand = require("../../../services/command-creation/slash-command");
const { deferInteraction } = require("../../../utilities/discord-action-utils");
const Parameter = require("../../../services/command-creation/parameter");
const { QueryType, Player, QueueRepeatMode } = require("discord-player");
const { EmbedBuilder } = require("@discordjs/builders");
const { YouTubeExtractor } = require('@discord-player/extractor');

const Subparameters = {
	VideoUrl: new Parameter({
		type: "string",
		name: "video-url",
		description: "The link to the video you want to play",
	}),
	PlaylistUrl: new Parameter({
		type: "string",
		name: "playlist-url",
		description: "The link to the playlist you want to play",
	}),
	SearchKeywords: new Parameter({
		type: "string",
		name: "search-keywords",
		description: "The keywords used to search for a youtube video to play",
	}),
}

const Parameters = {
	Video: new Parameter({
		type: "subcommand",
		name: "video",
		description: "Play a video",
		subparameters: [
			Subparameters.VideoUrl,
		],
	}),
	Playlist: new Parameter({
		type: "subcommand",
		name: "playlist",
		description: "Play a playlist of videos",
		subparameters: [
			Subparameters.PlaylistUrl,
		],
	}),
	Search: new Parameter({
		type: "subcommand",
		name: "search",
		description: "Search for a video to play",
		subparameters: [
			Subparameters.SearchKeywords,
		],
	}),
}

const command = new SlashCommand({
	name: "play",
	description: "Play a song",
});
command.parameters = [
	Parameters.Video,
	Parameters.Playlist,
	Parameters.Search,
];
// command.required_permissions = [PermissionFlagsBits.Administrator]
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const vc = interaction.member.voice.channel;

	if (!vc) {
		return await interaction.editReply("You need to be in a VC!");
	}

	const brobot_perms = vc.permissionsFor(interaction.client.user);

	if (
		!brobot_perms.has(PermissionsBitField.Flags.Connect) ||
		!brobot_perms.has(PermissionsBitField.Flags.Speak)
	) {
		return await interaction.editReply("I can't connect or speak!");
	}

	const player = global.client.player;
	if (!(player instanceof Player)) {
		global.client.player = new Player(global.client, {
			ytdlOptions: {
				quality: "highestaudio",
				highWaterMark: 1 << 25
			}
		});
	}
	if (player instanceof Player) {
		const queue = await global.client.player.nodes.create(interaction.guild);
		if (!queue.connection) {
			console.log("connecting");
			await queue.connect(vc);
			console.log("connecting");
		}

		await global.client.player.extractors.register(YouTubeExtractor);

		let embed = new EmbedBuilder();

		const subcommand = interaction.options.getSubcommand();

		console.log(subcommand)
		console.log(Parameters.Video.name)

		switch (subcommand) {
			case Parameters.Video.name: {
				console.log("GETTING VIDEO");
				const video_url = interaction.options.getString(Subparameters.VideoUrl.name);

				console.log({video_url});

				const result = await global.client.player.search(video_url, {
					requestedBy: interaction.user,
					searchEngine: QueryType.YOUTUBE_VIDEO,
				});

				console.log({result});
				console.log(result.tracks);
				console.log(result.tracks.length);

				if (result.tracks.length === 0) {
					return await interaction.editReply(`No result for ${video_url}`);
				}

				const song = result.tracks[0];
				await queue.addTrack(song);

				embed
					.setDescription(`**${song.title}: ${song.url}** has been added to the queue`)
					.setThumbnail(song.thumbnail)
					.setFooter({ text: `Duration: ${song.duration}`});

				console.log({queue, song});
				break;
			};


			case Parameters.Playlist.name: {
				console.log("GETTING PLAYLIST");
				const playlist_url = interaction.options.getString(Subparameters.PlaylistUrl.name);

				const result = await global.client.player.search(playlist_url, {
					requestedBy: interaction.user,
					fallbackSearchEngine: 'youtubePlaylist',
					searchEngine: QueryType.YOUTUBE_PLAYLIST,
				});

				console.log(result.tracks);

				if (result.tracks.length === 0 || !result.playlist) {
					return await interaction.editReply(`No result for ${playlist_url}`);
				}

				const playlist = result.playlist;
				await queue.addTrack(result.tracks);
				embed
					.setDescription(`${result.tracks.length} songs from **${playlist.title}: ${playlist.url}** has been added to the queue`)
					.setThumbnail(playlist.thumbnail)

				console.log({queue, playlist});
				break;
			};

			case Parameters.Search.name: {
				const search_keywords = interaction.options.getString(Subparameters.SearchKeywords.name);

				console.log({search_keywords});

				const result = await global.client.player.search(search_keywords, {
					requestedBy: interaction.user,
					searchEngine: QueryType.AUTO,
				});

				console.log({result});

				if (result.tracks.length === 0) {
					return await interaction.editReply(`No result for ${search_keywords}`);
				}

				const song = result.tracks[0];

				console.log({song});

				await queue.addTrack(song);

				console.log({queue});

				embed
					.setDescription(`**${song.title}: ${song.url}** has been added to the queue`)
					.setThumbnail(song.thumbnail)
					.setFooter({ text: `Duration: ${song.duration}`});

				console.log({queue, song});
				break;
			};
		}

		if (!queue.isPlaying()) {
			queue.setRepeatMode(QueueRepeatMode.OFF);
			await queue.play(queue.tracks.data[0]);
		}

		await interaction.editReply({
			content: "",
			embeds: [embed]
		});
	}
	else {
		return await interaction.editReply("Sorry, something went wrong?");
	}
}
module.exports = command;