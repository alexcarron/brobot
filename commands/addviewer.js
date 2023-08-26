// eslint-disable-next-line no-unused-vars
const fs = require('fs');
const Viewer = require('../modules/viewer.js');
const { autocomplete } = require("../modules/functions.js");

module.exports = {
    name: 'addviewer',
	aliases: ['+viewer', 'newviewer', 'addfan', '+fan', 'newfan'],
	usages: ["NAME, [USER ID]"],
	description: "Add a new viewer to the LL Point Manager.",
	hasCommaArgs: true,
	isRestrictedToMe: true,
	// eslint-disable-next-line no-unused-vars
	async execute(message, args) {

		const
			comma_args = args.join(" ").split(", "),
			new_viewer_name = comma_args[0],
			new_viewer_id = comma_args[1] ? comma_args[1] : null;

		let existing_new_viewer = await global.LLPointManager.getViewerByName(new_viewer_name);
		let existing_new_viewer_by_id = await global.LLPointManager.getViewerById(new_viewer_id);


		console.log({existing_new_viewer, existing_new_viewer_by_id});

		console.log(!existing_new_viewer && !existing_new_viewer_by_id);

		if (!existing_new_viewer && !existing_new_viewer_by_id) {
			let new_viewer_obj = {
				name: new_viewer_name,
				ll_points: 0,
			};

			if (new_viewer_id)
				new_viewer_obj.user_id = new_viewer_id;
			else
				message.channel.send("Are you sure you don't want to include the user id?");

			const new_viewer = new Viewer(new_viewer_obj);
			await global.LLPointManager.addViewer(new_viewer);
			await global.LLPointManager.updateDatabase();
			return message.channel.send(`The viewer, **${new_viewer_name}**, is being added to the database.`);
		}
		else {
			let message_txt = `The viewer name, **${new_viewer_name}**, is already in the database.`

			if (!existing_new_viewer)
				message_txt = `The viewer id, \`${new_viewer_id}\`, is already in the database and it belongs to **${existing_new_viewer_by_id.name}**`

			message.channel.send(message_txt);

			const autocomplete_viewer_name = await autocomplete(new_viewer_name, global.LLPointManager.getViewerNames());
			if (autocomplete_viewer_name) {
				message.channel.send(`Did you mean **${autocomplete_viewer_name}**?`);
			}

			return
		}
	},
};

