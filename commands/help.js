const
	{ prefix } = require('../config.json'),
	{ ll_user_id } = require("../databases/ids.json");


module.exports = {
	name: 'help',
	aliases: ['commands', "command", "cmds", "cmd", '?', ],
	usages: ['', '<command-name>'],
	description: "Learn what all the commands are and what they do.",
	isServerOnly: true,
	async execute(message, args) {
		const { commands } = message.client;

		const getCmdAliasMsgs = function(command) {
			if (command.aliases) {
				return command.aliases.map(
					(alias) => {
						return `*${prefix}${alias}*`
					}
				)
			}
			else
				return [];
		}

		if (!args.length) {
			let command_msgs =
				commands
				.filter(
					(command) => {
						if (message.author.id == ll_user_id)
							return true
						else if (command.isRestrictedToMe)
							return false
						else if (!command.required_servers)
							return true
						else
							return command.required_servers.includes(message.guild.id);
					}
				)
				.map(
					(command) => {
						return `\`${prefix}${command.name}\` ${getCmdAliasMsgs(command).join(", ")}`
					}
				)

			message.channel.send(
				command_msgs.join("\n") + "\n" +
				"\n" +
				`Send \`${prefix}help COMMAND-NAME\` to get info on a specific command.`
			);
		}
		else {
			const
				name = args[0].toLowerCase(),
				command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

			let isValidCommand;

			if (message.author.id == ll_user_id)
				isValidCommand = true
			else if (command.isRestrictedToMe)
				isValidCommand = false
			else if (!command.required_servers)
				isValidCommand = true
			else
				isValidCommand = command.required_servers.includes(message.guild.id);

			if (!command || !isValidCommand)
				return message.channel.send(`\`<${name}\` is not a command.`);

			let cmd_alias_msgs = getCmdAliasMsgs(command),
				cmd_usage_msgs = [],
				cmd_description_msg = "";

			if (command.usages)
				cmd_usage_msgs = command.usages.map(
					(usage) => {
						if (usage) {
							return `\n\t\`${usage}\``
						}
						else
							return "\n\t`(No Arguments)`"
					}
				);

			if (command.description)
				cmd_description_msg = `\n\n${command.description}`;

			message.channel.send(
				`**${prefix}${command.name}** ` + cmd_alias_msgs.join(", ") +
				cmd_usage_msgs.join("") +
				cmd_description_msg
			);
		}
	},
};
