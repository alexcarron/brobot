module.exports = {
	name: 'testfunction',
	usages: [
		"function_name, [arguments]",
	],
    description: 'Test a function at any point as any person',
	isServerOnly: true,
	args: true,
	hasCommaArgs: true,
	isRestrictedToMe: true,
	async execute(message, args) {

		let functions = require("../../modules/functions"),
			comma_args = args.join(' ').split(' | '),
			fucntion_name = comma_args[0],
			fucntion_args,
			func;

		try {
			func = functions[fucntion_name];
		}
		catch {
			return message.channel.send(`\`${fucntion_name}\` is an invalid function name.`)
		}

		fucntion_args = comma_args.length > 1 ? comma_args.slice(1) : [];
		fucntion_args = fucntion_args.map(arg => eval(arg));

		func(fucntion_args);
    }
};