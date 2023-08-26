// eslint-disable-next-line no-unused-vars
const fs = require('fs');
const { autocomplete } = require("../modules/functions.js");

module.exports = {
    name: 'addllpoints',
	aliases: ['addllp', '+llp', 'plusllp', 'givellp', '+llpoints', 'plusllpoints', 'givellpoints'],
	usages: ["NAME, AMOUNT"],
	description: "Give LL Points to a viewer.",
	hasCommaArgs: true,
	comma_arg_count: 2,
	isRestrictedToMe: true,
	// eslint-disable-next-line no-unused-vars
	async execute(message, args) {

		const
			comma_args = args.join(" ").split(", "),
			added_points = parseFloat(comma_args[1]);

		let viewer_name = comma_args[0],
			viewer = await global.LLPointManager.getViewerByName(viewer_name);


		if (!viewer) {
			const autocomplete_viewer_name = await autocomplete(viewer_name, global.LLPointManager.getViewerNames());

			if (autocomplete_viewer_name) {
				viewer_name = autocomplete_viewer_name;
				viewer = await global.LLPointManager.getViewerByName(viewer_name);
			}

			if (!viewer) {
				return message.channel.send(`The viewer, **${viewer_name}**, doesn't exist.`);
			}
		}

		console.log({comma_args, viewer, viewer_name, added_points});

		await global.LLPointManager.viewers.get(viewer_name).addLLPoints(added_points);
		await global.LLPointManager.updateDatabase();
		let current_ll_points = await global.LLPointManager.viewers.get(viewer_name).ll_points;

		await message.channel.send(
			`Giving **${viewer_name}** \`${added_points}\` LL Point(s)...\n` +
			`They now have \`${current_ll_points}\` LL Point(s).`
		);
	},
};