const fs = require('fs');

module.exports = {
    name: 'getfile',
	usages: ["FILE NAME"],
	description: "Get the contents of a file.",
	hasCommaArgs: true,
	comma_arg_count: 1,
	isRestrictedToMe: true,
    required_permission: 'ADMINISTRATOR',
	// eslint-disable-next-line no-unused-vars
	async execute(message, args) {

		let file_path = args.join(" ");

		const messages_json = fs.readFileSync(`./${file_path}`);
		await message.channel.send({ files: [{ attachment: messages_json, name: `./${file_path}` }] });
	},
};