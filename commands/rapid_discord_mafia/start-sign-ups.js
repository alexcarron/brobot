const SlashCommand = require("../../modules/commands/SlashCommand");
const { GameStates } = require("../../modules/enums");
const

	{ PermissionFlagsBits } = require('discord.js'),
	{ getChannel, getRole, getUnixTimestamp, wait } = require("../../modules/functions"),
	ids = require(`${global.paths.databases_dir}/ids.json`),
	{
		rdm_server_id,
		channels: channel_ids,
		roles:  role_ids,
		living_role_id,
	}
		= require("../../databases/ids.json").rapid_discord_mafia,

	{ wait_times, min_player_count } = require("../../databases/rapid_discord_mafia/constants.json");



const command = new SlashCommand({
	name: "start-sign-ups",
	description: "Starts an Rapid Discord Mafia game by starting sign-ups",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.required_servers = [ids.servers.rapid_discord_mafia];
command.execute = async function execute(interaction) {
	if (interaction) {
		try {
			await interaction.reply({content: "Starting Sign-ups...", ephemeral: true});
		}
		catch {
			console.log("Failed Defer: Reply Already Exists");
			await interaction.editReply({ content: "Sending Command...", ephemeral: true});
		}
	}

	if ( [GameStates.SignUp, GameStates.InProgress].includes(global.Game.state) ) {
		return interaction.editReply("There's already a game in sign-ups or in progress.");
	}
	else {
		interaction.editReply("Attemping to start sign-ups. Once sign-ups is over, use the command `<startgame ROLE IDENTIFIER, ROLE IDENTIFIER, ROLE IDENTIFIER...` to begin the game.");
	}

	let game_announce_chnl = await getChannel((await global.Game.getGuild()), channel_ids.game_announce),
		join_chat_channel = await getChannel((await global.Game.getGuild()), channel_ids.join_chat),
		living_role = await getRole((await global.Game.getGuild()), "Living"),
		resetgame = require("./reset-game.js");

	await resetgame.execute(interaction);

	game_announce_chnl.permissionOverwrites.set([
		{
			id: (await global.Game.getGuild()).id,
			// ! TESTING MODE - OFF
			// allow: [PermissionFlagsBits.ViewChannel],
			// deny: [PermissionFlagsBits.SendMessages],
			// * TESTING MODE - ON
			deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
		},
	]);

	join_chat_channel.permissionOverwrites.set([
		{
			id: (await global.Game.getGuild()).id,
			// ! TESTING MODE - OFF
			// allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
			// * TESTING MODE - ON
			allow: [PermissionFlagsBits.SendMessages],
			deny: [PermissionFlagsBits.ViewChannel],
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


	// phase = JSON.parse(fs.readFile("./databases/rapid_discord_mafia/phase.json"));
	if (global.Game.state !== GameStates.SignUp) return

	game_announce_chnl.send(`@here The game will begin <t:${getUnixTimestamp() + 5*60}:R>! \nTo join the game, go to <#${channel_ids.join_chat}> and send the command \`<join NAME\`.`);
	await wait(4, "min");

	if (global.Game.state !== GameStates.SignUp) return

	game_announce_chnl.send(`@here Final call to sign up for the game. \nTo join the game, go to <#${channel_ids.join_chat}> and send the command \`<join NAME\`. \nSign-ups close and the game begins <t:${getUnixTimestamp() + 60}:R>.`);
	await wait(60, "sec");

	if (global.Game.state !== GameStates.SignUp) return

	let player_count = global.Game.Players.getPlayerCount();

	if (player_count >= min_player_count) {
		game_announce_chnl.send(`<@${ids.users.LL}> <@&${living_role_id}> Sign-ups are now closed. Standby for role assignments in your player action channel.`);
		global.Game.state = GameStates.ReadyToBegin;
	}
	else {
		game_announce_chnl.send(`Unfortunately we didn't get enough players. Game cancelled.`);
		game_announce_chnl.permissionOverwrites.create( (await global.Game.getGuild()).roles.everyone, { ViewChannel: false } );

		await resetgame.execute(interaction, []);
	}

	join_chat_channel.permissionOverwrites.edit(
		(await global.Game.getGuild()).roles.everyone,
		{
			ViewChannel: false,
			SendMessages: false,
		}
	);
}
module.exports = command;