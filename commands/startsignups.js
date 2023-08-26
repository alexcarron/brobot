const { GameStates } = require("../modules/enums");

const

	{ PermissionFlagsBits } = require('discord.js'),
	{ getChannel, getRole, getUnixTimestamp, wait } = require("../modules/functions"),
	{ ll_user_id } = require("../databases/ids.json"),
	{
		rdm_server_id,
		channels: channel_ids,
		roles:  role_ids,
		living_role_id,
	}
		= require("../databases/ids.json").rapid_discord_mafia,

	{ wait_times, min_player_count } = require("../databases/rapid_discord_mafia/constants.json");

module.exports = {
	name: 'startsignups',
    description: 'Start an RDM game',
	// isRestrictedToMe: true,
    // required_permission: 'ADMINISTRATOR',
	required_servers: [rdm_server_id],
	// eslint-disable-next-line no-unused-vars
	async execute(message, args) {

		if ( [GameStates.SignUp, GameStates.InProgress].includes(global.Game.state) ) {
			return message.channel.send("There's already a game in sign-ups or in progress.");
		}
		else {
			message.channel.send("Attemping to start sign-ups. Once sign-ups is over, use the command `<startgame ROLE IDENTIFIER, ROLE IDENTIFIER, ROLE IDENTIFIER...` to begin the game.");
		}

		let game_announce_chnl = await getChannel(message.guild, channel_ids.game_announce),
			join_chat_channel = await getChannel(message.guild, channel_ids.join_chat),
			living_role = await getRole(message.guild, "Living"),
			resetgame = require("./resetgame.js");

		await resetgame.execute(message);

		game_announce_chnl.permissionOverwrites.set([
			{
				id: message.guild.id,
				allow: [PermissionFlagsBits.ViewChannel],
				// TESTING MODE - OFF
				deny: [PermissionFlagsBits.SendMessages],
				// TESTING MODE - ON
				// deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
			},
		]);

		join_chat_channel.permissionOverwrites.set([
			{
				id: message.guild.id,
				// TESTING MODE - OFF
				allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
				// TESTING MODE - ON
				// allow: [PermissionFlagsBits.SendMessages],
				// deny: [PermissionFlagsBits.ViewChannel],
			},
			{
				id: living_role,
				deny: [PermissionFlagsBits.ViewChannel],
			},
		]);

		global.Game.state = GameStates.SignUp;

		game_announce_chnl.send(`<@&${role_ids.sign_up_ping}> A Rapid Discord Mafia game is starting <t:${getUnixTimestamp() + wait_times.sign_up[0]*60}:R>.`);
		game_announce_chnl.send(`To join the game, go to <#${channel_ids.join_chat}> and send the command \`<join NAME\`.`);
		await wait(wait_times.sign_up[0] - 5, "min");


		// phase = JSON.parse(fs.readFileSync("./databases/rapid_discord_mafia/phase.json"));
		if (global.Game.state !== GameStates.SignUp) return

		game_announce_chnl.send(`@here The game will begin <t:${getUnixTimestamp() + 5*60}:R>! \nTo join the game, go to <#${channel_ids.join_chat}> and send the command \`<join NAME\`.`);
		await wait(4, "min");

		if (global.Game.state !== GameStates.SignUp) return

		game_announce_chnl.send(`@here Final call to sign up for the game. \nTo join the game, go to <#${channel_ids.join_chat}> and send the command \`<join NAME\`. \nSign-ups close and the game begins <t:${getUnixTimestamp() + 60}:R>.`);
		await wait(60, "sec");

		if (global.Game.state !== GameStates.SignUp) return

		let player_count = global.Game.Players.getPlayerCount();

		if (player_count >= min_player_count) {
			game_announce_chnl.send(`<@${ll_user_id}> <@&${living_role_id}> Sign-ups are now closed. Standby for role assignments in your player action channel.`);
			global.Game.state = GameStates.ReadyToBegin;
		}
		else {
			game_announce_chnl.send(`Unfortunately we didn't get enough players. Game cancelled.`);
			game_announce_chnl.permissionOverwrites.create( message.guild.roles.everyone, { ViewChannel: false } );

			await resetgame.execute(message, []);
		}

		join_chat_channel.permissionOverwrites.edit(
			message.guild.roles.everyone,
			{
				ViewChannel: false,
				SendMessages: false,
			}
		);
    }
};