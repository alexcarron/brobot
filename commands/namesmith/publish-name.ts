import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { confirmInteractionWithButtons } from "../../utilities/discord-action-utils";

export const command = new SlashCommand({
	name: "publish-name",
	description: "Publishes your current name to eventually be automatically submitted for voting",
	required_servers: [ids.servers.NAMESMITH],
	required_roles: [
		[ids.namesmith.roles.namesmither, ids.namesmith.roles.noName, ids.namesmith.roles.smithedName],
	],
	execute: async function execute(interaction) {
		const { playerService, activityLogService } = getNamesmithServices();

		const playerID = interaction.user.id;

		const currentName = playerService.getCurrentName(playerID);
		const currentPublishedName = playerService.getPublishedName(playerID);

		const didConfirmAction = await confirmInteractionWithButtons({
			interaction,
			message:
				`Are you sure you want to publish your current name: \`${currentName}\`?` +
				(currentPublishedName !== null ?
					`\nCurrently, your published name is ${currentPublishedName}`
					: ""
				),
			confirmText: "Yes, Publish My Name",
			cancelText: "No, Don't Publish My Name",
			confirmUpdateText: `You just published your current name: \`${currentName}\``,
			cancelUpdateText: "Canceled",
		});

		if (!didConfirmAction)
			return;

		playerService.publishName(playerID);
		activityLogService.logPublishName({
			playerPublishingName: playerID,
		});
	},
});