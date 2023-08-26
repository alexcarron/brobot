// eslint-disable-next-line no-unused-vars
const fs = require('fs');
const songs = require("../modules/songs.js");
const ids = require("../databases/ids.json");
const { getChannel, getGuild } = require('../modules/functions.js');
module.exports = {
    name: 'getsong',
	description: "Get a random song.",
	isRestrictedToMe: true,
    required_permission: 'ADMINISTRATOR',
	// eslint-disable-next-line no-unused-vars
	async execute(message, args) {
		const llgs_server = await getGuild(ids.ll_game_shows.server_id);
		const song_chnl = await getChannel(llgs_server, ids.ll_game_shows.channels.song_sharing);
		songs.sendRandomLinkedSong(song_chnl);
	},
};