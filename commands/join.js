const { GameStates } = require("../modules/enums");

const
	{ ll_user_id } = require("../databases/ids.json"),
	{ rdm_server_id, channels: channel_ids } = require("../databases/ids.json").rapid_discord_mafia;

module.exports = {
	name: 'join',
	usages: ['NAME'],
    description: 'Join a game of Rapid Discord Mafia and choose your name',
    hasCommaArgs: true,
    isServerOnly: true,
	comma_arg_count: 1,
	required_servers: [rdm_server_id],
	required_channels: [channel_ids.join_chat],
    required_roles: ['Spectators'],
	async execute(message, args, isTest=false) {

		global.Game.logPlayers();

		let player_id, player_name, isFakeUser;

		if (!isTest) {
			player_id = message.author.id;
			player_name = args.join(" ");
			isFakeUser = false;
		}
		else {
			[player_id, player_name, isFakeUser] = args;

			if (isFakeUser) {
				isFakeUser = true;
				player_id = ll_user_id;
			}
			else
				isFakeUser = false;

			global.Game.state = GameStates.ReadyToBegin;
		}

		console.log({player_id, player_name, isFakeUser})
		global.Game.addPlayerToGame(player_name, player_id, isFakeUser);
    }
};