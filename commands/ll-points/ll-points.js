
const { EmbedBuilder } = require('discord.js');
const { Parameter } = require("../../services/command-creation/parameter.js");
const { SlashCommand } = require("../../services/command-creation/slash-command.js");
const { LLPointManager } = require("../../services/ll-points/ll-point-manager.js");
const { deferInteraction } = require("../../utilities/discord-action-utils.js");
const { LLPointTier } = require('../../services/ll-points/ll-point-enums.js');
const { logInfo } = require('../../utilities/logging-utils.js');


const Parameters = {
	ViewerName: new Parameter({
		type: "string",
		name: "viewer-name",
		description: "The name of the viewer whose LL point amount you want to see. (Leave blank to check your own)",
		isRequired: false,
		isAutocomplete: true,
	}),
}

const command = new SlashCommand({
	name: "ll-points",
	description: "Check how many LL points you or others have",
	parameters: [
		Parameters.ViewerName,
	],
	allowsDMs: true,
	execute: async function(interaction) {
		await deferInteraction(interaction);

		const
			specified_viewer_name = interaction.options.getString(Parameters.ViewerName.name),
			noSpecifiedUser = !specified_viewer_name,
			num_total_viewers = global.LLPointManager.getNumViewers(),
			getViewer = async function(viewer_name) {
				if (noSpecifiedUser) {
					let viewer = await global.LLPointManager.getViewerById(interaction.user.id);
					if (viewer)
						return viewer;
				}

				viewer = global.LLPointManager.getViewerByName(viewer_name);
				if (viewer)
					return viewer;

				logInfo(`No viewer with name ${viewer_name} or id ${interaction.user.id}`);
				return undefined;
			}

		let viewer,
			viewer_name,
			viewer_display_name = "",
			avatar,
			ll_points,
			rank,
			tier;

		if (!noSpecifiedUser) {
			viewer_name = specified_viewer_name; // @ TODO FIX ARGS
		}
		else {
			viewer_name = interaction.user.username;
			avatar = interaction.user.avatarURL();
		}

		viewer = await getViewer(viewer_name);

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
			tier = LLPointTier.VIEWER;
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

		interaction.editReply({ content: "", embeds: [embed_msg] });
	},
	autocomplete: LLPointManager.getViewersAutocompleteValues,
});

module.exports = command;