
const { LLPointTiers } = require("../../modules/enums.js");
const { EmbedBuilder } = require('discord.js');
const { autocomplete } = require("../../modules/functions.js");

module.exports = {
    name: 'llpoints',
	aliases: ['llp', 'viewllpoints', 'seellpoints'],
	usages: ["", "NAME"],
	description: "See your own or other people's LL Point count.",

	async execute(message, args) {

		const
			noSpecifiedUser = args.length <= 0,
			num_total_viewers = global.LLPointManager.getNumViewers(),
			getViewer = function getViewer(viewer_name) {
				if (noSpecifiedUser) {
					let viewer = global.LLPointManager.getViewerById(message.author.id);
					if (viewer)
						return viewer;
				}

				viewer = global.LLPointManager.getViewerByName(viewer_name);
				if (viewer)
					return viewer;

				const autocomplete_name = autocomplete(viewer_name, global.LLPointManager.getViewerNames());
				if (autocomplete_name) {
					viewer = global.LLPointManager.getViewerByName(autocomplete_name);

					if (viewer)
						return viewer;
				}

			}

		let viewer,
			viewer_name,
			viewer_display_name = "",
			avatar,
			ll_points,
			rank,
			tier;

		if (!noSpecifiedUser) {
			viewer_name = args.join(" ");
		}
		else {
			viewer_name = message.author.username;
			avatar = message.author.avatarURL();
		}

		viewer = getViewer(viewer_name);

		if (viewer) {
			viewer_display_name = viewer.name;
			ll_points = viewer.ll_points;
			rank = global.LLPointManager.getRankOfViewer(viewer.name);
			tier = viewer.tier;
		}
		else {
			viewer_display_name = viewer_name + " (Unknown Viewer)";
			ll_points = 0;
			rank = num_total_viewers + 1;
			tier = LLPointTiers.LLViewer;
		}

		const embed_msg = new EmbedBuilder()
			.setColor(0x1cc347)
			.setTitle(viewer_display_name)
			.setDescription(
				`**LL Points**: \`${ll_points}\`\n` +
				`**Tier**: ${tier}\n` +
				`**Rank**: \`${rank}\` out of \`${num_total_viewers}\``
			)

		if (avatar)
			embed_msg.setThumbnail(avatar);

		message.channel.send({ embeds: [embed_msg] });
	},
};