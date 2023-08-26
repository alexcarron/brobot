const
	{ PermissionFlagsBits } = require('discord.js'),

	Game = require("../modules/game.js"),
	Players = require("../modules/players.js"),
	{ getChannel, getRole, getCategoryChildren } = require("../modules/functions"),
	{ rdm_server_id, night_chat_category_id}
		= require("../databases/ids.json").rapid_discord_mafia,
	{ rapid_discord_mafia: rdm_ids } = require("../databases/ids.json");


module.exports = {
	name: 'resetgame',
    description: 'Reset an RDM game',
	isRestrictedToMe: true,
    required_permission: 'ADMINISTRATOR',
	required_servers: [rdm_server_id],
	// eslint-disable-next-line no-unused-vars
	async execute(message, args) {

		const guild = await global.Game.getGuild();
		const staff_chat = await global.Game.getStaffChnl();

		console.log("Removing Living/Ghosts Role From Members");
		let members = await guild.members.fetch();
		await members.forEach(
			async (member) => {
				let isNonSpectator = false,
					spectator_role = await getRole(guild, "Spectators"),
					{ player_roles } = require("../databases/rapid_discord_mafia/constants.json");

				player_roles.forEach(
					async (role_name) => {
						let role_id = rdm_ids.roles[role_name.toLowerCase().replace(" ", "_")];

						if (member._roles.includes(role_id)) {
							console.log(`Removing role ${role_name}`);

							isNonSpectator = true;
							let role_to_remove = await getRole(guild, role_name);
							await member.roles.remove(role_to_remove);
						}
					}
				)

				if (isNonSpectator)
					await member.roles.add(spectator_role);
			}
		)

		// Delete Channels
		const
			player_action_chnls = await getCategoryChildren(guild, rdm_ids.category.player_action),
			archive_category = await getChannel(guild, rdm_ids.category.archive ).catch(console.error)

		for (let player_name of global.Game.Players.getPlayerNames()) {
			let player = global.Game.Players.get(player_name);

			// ! Delete Action Channels
			try {
				const player_channel = await getChannel(guild, player.channel_id).catch(console.error);
				// await player_channel.delete()
					// .then(() => {
						// console.log(`Deleted ${player_channel.name}`);
					// });

				await player_channel.setParent(archive_category)
					.then(() => {
						console.log(`Moved ${player_channel.name} to category ${archive_category.name}`);
					});
			}
			catch {
				await staff_chat.send(`**${player_name}**'s channel could not be deleted`);
			}
		}

		await player_action_chnls.forEach(
			async (channel) => {
				await channel.setParent(archive_category)
					.then(() => {
						console.log(`Moved ${channel.name} to category ${archive_category.name}`);
					})
					.catch(console.error);
			}
		);


		// ! Close All Chats
		let night_channels = await getCategoryChildren(guild, night_chat_category_id);
		await night_channels.forEach(
			async (channel) => {
				await channel.permissionOverwrites.set([{
					id: guild.id,
					deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
				}])
			}
		);

		let living_role = await getRole(guild, "Living"),
			ghosts_role = await getRole(guild, "Ghosts"),
			on_trial_role = await getRole(guild, "On Trial"),
			ghost_chat_chnl = await getChannel(guild, rdm_ids.channels.ghost_chat),
			town_discussion_chnl = await getChannel(guild, rdm_ids.channels.town_discussion),
			defense_stand_chnl = await getChannel(guild, rdm_ids.channels.defense_stand),
			voting_booth_chnl = await getChannel(guild, rdm_ids.channels.voting_booth),
			game_announce_chnl = await getChannel(guild, rdm_ids.channels.game_announce),
			join_chat_chnl = await getChannel(guild, rdm_ids.channels.join_chat),
			mafia_chat_chnl = await getChannel(guild, rdm_ids.channels.mafia_chat),
			pre_game_channels = await getCategoryChildren(guild, rdm_ids.category.pre_game);


		await pre_game_channels.forEach(
			async (channel) => {
				await channel.permissionOverwrites.set([
					{
						id: living_role,
						allow: [PermissionFlagsBits.ViewChannel],
					},
					{
						id: ghosts_role,
						allow: [PermissionFlagsBits.ViewChannel],
					},
				]);
			}
		);

		await ghost_chat_chnl.permissionOverwrites.set([
			{
				id: guild.id,
				deny: [PermissionFlagsBits.SendMessages],
			},
			{
				id: living_role,
				deny: [PermissionFlagsBits.ViewChannel],
			},
			{
				id: ghosts_role,
				allow: [PermissionFlagsBits.SendMessages],
			},
		]);

		await town_discussion_chnl.permissionOverwrites.set([
			{
				id: guild.id,
				deny: [PermissionFlagsBits.SendMessages],
			},
			{
				id: living_role,
				deny: [PermissionFlagsBits.SendMessages],
			},
		]);

		await defense_stand_chnl.permissionOverwrites.set([
			{
				id: guild.id,
				deny: [PermissionFlagsBits.SendMessages],
			},
			{
				id: on_trial_role,
				allow: [PermissionFlagsBits.SendMessages],
			},
		]);

		await voting_booth_chnl.permissionOverwrites.set([
			{
				// TESTING MODE
				id: guild.id,
				deny: [PermissionFlagsBits.SendMessages],
				// deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
			}
		]);

		await game_announce_chnl.permissionOverwrites.set([
			{
				// TESTING MODE
				id: guild.id,
				allow: [PermissionFlagsBits.ViewChannel],
				deny: [PermissionFlagsBits.SendMessages],
				// deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
			},
		]);

		await join_chat_chnl.permissionOverwrites.set([
			{
				id: guild.id,
				deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
			},
			{
				id: living_role,
				deny: [PermissionFlagsBits.ViewChannel],
			},
		]);

		await mafia_chat_chnl.permissionOverwrites.set([
			{
				id: guild.id,
				deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
			},
		]);

		global.Game = new Game( new Players() );
		global.Roles = require("../modules/roles");
		staff_chat.send("Reset everything.")
    }
};