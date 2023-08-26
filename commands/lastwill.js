const { GameStates } = require("../modules/enums");

const


	{
		rdm_server_id,
		player_actions_category_id,
	}
		= require("../databases/ids.json").rapid_discord_mafia;

module.exports = {
	name: 'lastwill',
    aliases: ['lw'],
	usages: ["", "delete", "LAST WILL TEXT", "append, LAST WILL TEXT"],
    description: 'Create a last will for RDM.',
	required_servers: [rdm_server_id],
    required_categories: [player_actions_category_id],
    required_roles: ["Living"],
	async execute(message, args, isTest=false) {

		let comma_args, player_name, isAppend, isDelete, last_will_content;

		if (!isTest) {
			comma_args = args.join(" ").split(", ");

			player_name = global.Game.Players.getPlayerFromId(message.author.id).name;
		}
		else {
			player_name = args[0];
			comma_args = args.slice(1);
		}

		isAppend = comma_args[0].toLowerCase() == "append";
		isDelete = comma_args[0].toLowerCase() == "delete";

		if (isAppend) {
			if (comma_args.length <= 1)
				return message.channel.send(`You need to include something to append to your last will.`);

			if (!global.Game.Players.get(player_name).last_will)
				return message.channel.send(`You don't have an existing last will to append to.`);

			last_will_content = global.Game.Players.get(player_name).last_will + comma_args.slice(1).join(", ");
		} else
			last_will_content = comma_args.join(", ");

		if (isDelete) {
			if (global.Game.Players.get(player_name).last_will !== "") {
				message.channel.send(`Deleting this last will: \`\`\`\n${global.Game.Players.get(player_name).last_will}\n\`\`\``);
				global.Game.Players.get(player_name).last_will = "";

				return message.channel.send(`Your last will was deleted.`);
			}
			else
				return message.channel.send(`You have no last will.`);
		}

		if (!last_will_content) {
			if (!isAppend) {
				if (!global.Game.Players.get(player_name).last_will)
					return message.channel.send(`You don't have a last will.`);
				else
					return message.channel.send(`\`\`\`\n${global.Game.Players.get(player_name).last_will}\n\`\`\``);
			}
			else
				return message.channel.send(`You need to include something to append to your last will.`);
		}

		console.log({player_name, isAppend, isDelete, last_will_content});

		if (global.Game.state === GameStates.SignUp) {
			return message.channel.send(`The game hasn't started yet.`)
		}

		if (last_will_content.includes("`")) {
			return message.channel.send("You can't have backticks (\\`) in your last will.")
		}

		if (global.Game.Players.get(player_name).last_will)
			message.channel.send("You're replacing your previous last will.");

		message.channel.send(`Your last will is now: \`\`\`\n${last_will_content}\n\`\`\``);

		global.Game.Players.get(player_name).last_will = last_will_content;

    }
};