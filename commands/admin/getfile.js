const fs = require('node:fs/promises');

module.exports = {
    name: 'getfile',
	usages: ["FILE NAME"],
	description: "Get the contents of a file.",
	hasCommaArgs: true,
	comma_arg_count: 1,
	isRestrictedToMe: true,
    required_permission: 'ADMINISTRATOR',

	async execute(message, args) {

		let file_path = args.join(" ");

		const messages_json = fs.readFile(`./${file_path}`);
		await message.channel.send({ files: [{ attachment: messages_json, name: `./${file_path}` }] });
	},
};