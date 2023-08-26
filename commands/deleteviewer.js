// eslint-disable-next-line no-unused-vars
const fs = require('fs');
const { autocomplete } = require("../modules/functions.js");


module.exports = {
    name: 'deleteviewer',
	aliases: ['-viewer', 'removeviewer', 'deletefan', '-fan', 'removefan'],
	usages: ["NAME"],
	description: "Remove an existing viewer from the LL Point Manager.",
	hasCommaArgs: true,
	comma_arg_count: 1,
	isRestrictedToMe: true,
	// eslint-disable-next-line no-unused-vars
	async execute(message, args) {

		const viewer_name = args.join(" ");

		let existing_viewer = await global.LLPointManager.getViewerByName(viewer_name);

		if (!existing_viewer) {
			message.channel.send(`The viewer, **${viewer_name}**, doesn't exist in the database.`);

			const autocomplete_viewer_name = await autocomplete(viewer_name, global.LLPointManager.getViewerNames());
			if (autocomplete_viewer_name) {
				message.channel.send(`Did you mean **${autocomplete_viewer_name}**?`);
			}

			return
		}
		else {
			global.LLPointManager.removeViewer(existing_viewer);
			return message.channel.send(`The viewer, **${viewer_name}**, is being deleted from the database.`);
		}
	},
};