const


	{ GameStates } = require("../modules/enums.js"),
	{
		rdm_server_id,
		player_actions_category_id,
	}
		= require("../databases/ids.json").rapid_discord_mafia;

module.exports = {
	name: 'deathnote',
    aliases: ['dn'],
	usages: ["DEATH NOTE"],
    description: 'Create a death note for RDM.',
	hasCommaArgs: true,
	required_servers: [rdm_server_id],
    required_categories: [player_actions_category_id],
    required_roles: ["Living"],
	async execute(message, args, isTest=false) {

		// let players = JSON.parse(fs.readFileSync("./databases/rapid_discord_mafia/players.json"));

		// let phase = JSON.parse(fs.readFileSync("./databases/rapid_discord_mafia/phase.json"));

		let player_name, death_note_content;

		if (!isTest) {
			player_name = global.Game.Players.getPlayerFromId(message.author.id).name;

			death_note_content = args.join(" ");

		}
		else {
			let comma_args = args;
			player_name = comma_args[0];
			death_note_content = comma_args.slice(1).join(", ");
		}

		console.log({player_name, death_note_content});

		if (global.Game.state === GameStates.SignUp) {
			return message.channel.send(`The game hasn't started yet.`)
		}

		if (death_note_content.includes("`")) {
			return message.channel.send("You can't have backticks (\\`) in your death note.")
		}

		if (global.Game.Players.get(player_name).death_note)
			message.channel.send("You're replacing your previous death note.");

		message.channel.send(`Your death note is now: \`\`\`${death_note_content}\`\`\``);

		global.Game.Players.get(player_name).death_note = death_note_content;


    }
};