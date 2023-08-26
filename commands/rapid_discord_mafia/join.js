const SlashCommand = require("../../modules/commands/SlashCommand");
const { GameStates } = require("../../modules/enums");


const
	ids = require(`${global.paths.databases_dir}/ids.json`),
	{ rdm_server_id, channels: channel_ids } = require("../../databases/ids.json").rapid_discord_mafia;

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
    }
};

const command = new SlashCommand({})
command.name = "join";
command.description = "Join a game of Rapid Discord Mafia and choose your name";
command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_channels = [ids.rapid_discord_mafia.channels.join_chat];
command.required_roles = ['Spectators'];
command.execute = async function execute(interaction) {
	global.Game.logPlayers();

	let player_id, player_name, isFakeUser;

	if (!isTest) {
		player_id = interaction.user.id;
		player_name = args.join(" ");
		isFakeUser = false;
	}
	else {
		[player_id, player_name, isFakeUser] = args;

		if (isFakeUser) {
			isFakeUser = true;
			player_id = ids.users.LL;
		}
		else
			isFakeUser = false;

		global.Game.state = GameStates.ReadyToBegin;
	}

	console.log({player_id, player_name, isFakeUser})
	global.Game.addPlayerToGame(player_name, player_id, interaction, isFakeUser);
}


module.exports = command;
// module.exports = command.getSlashCommand();