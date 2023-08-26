const validator = require('../utilities/validator.js');
const { rdm_server_id } = require("../databases/ids.json"),
	ids = require("../databases/ids.json"),
	{ RDMRoles, GameStates } = require("../modules/enums");

module.exports = {
	name: 'rename',
	usages: ['NAME'],
    description: 'Change your name in a Rapid Discord Mafia Game',
    hasCommaArgs: true,
    isServerOnly: true,
	comma_arg_count: 1,
	required_servers: [rdm_server_id],
	required_categories: [ids.rapid_discord_mafia.category.player_action],
    required_roles: [RDMRoles.Living],
	async execute(message, args) {
		let player_id = message.author.id,
			old_player_name = global.Game.Players.getPlayerFromId(player_id),
			new_player_name = args.join(" ");

		if ( global.Game.state !== GameStates.SignUp ) {
			return await message.channel.send(`Sorry, you can only change your name during sign-ups.`);
		}

		if ( this.Players && this.Players.get(new_player_name) ) {
			return await message.channel.send(`The name, **${new_player_name}**, already exists.`)
		}

		const validator_result = validator.validateName(new_player_name);
		if (validator_result !== true)
			return await message.channel.send(validator_result);

		global.Game.Players.renamePlayer(old_player_name, new_player_name);

		message.channel.send(`You, **${old_player_name}**, changed your name to **${new_player_name}**.`);
		global.Game.announceMessages(`**${old_player_name}** changed their name to  **${new_player_name}**.`);
    }
};