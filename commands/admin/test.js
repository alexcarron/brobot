const ids = require(`${global.paths.databases_dir}/ids.json`);

module.exports = {
	name: 'test',
	usages: [
		"join, <user-id>, <player-name>, [isFakeUser]",
		"do, <player-name>, <ability-name>, [ability-args]",
		"vote, <player-name>, <vote>",
		"fakejoins <name> <name> <name> ...",
	],
    description: 'Test a command at any point as any person',
	isServerOnly: true,
	args: true,
	hasCommaArgs: true,
	isRestrictedToMe: true,
	async execute(message, args) {

		if (args[0] === "fakejoins") {
			args = args.slice(1)
			const join_command = require(`./join.js`);
			const delete_chnls_command = require(`./deletechannels.js`);

			await delete_chnls_command.execute(message, ["1031365761320624132"], true);
			for (let arg of args) {
				join_command.execute(message, [ids.users.LL, arg, true], true);
			}
		}
		else {
			let comma_args = args.join(' ').split(', '),
				command_name = comma_args[0],
				command;

			try {
				command = require(`./${command_name}.js`);
			}
			catch {
				return message.channel.send(`\`${command_name}\` is an invalid command name.`)
			}

			let command_args = comma_args.length > 1 ? comma_args.slice(1) : [];

			command.execute(message, command_args, true);
		}

    }
};