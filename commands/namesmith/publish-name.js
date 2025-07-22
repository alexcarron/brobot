const ids = require("../../bot-config/discord-ids");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { getNamesmithServices } = require("../../services/namesmith/services/get-namesmith-services");
const { confirmInteractionWithButtons, deferInteraction } = require("../../utilities/discord-action-utils");

module.exports = new SlashCommand({
	name: "publish-name",
	description: "Publishes your current name to eventually be automatically submitted for voting",
	required_servers: [ids.servers.namesmith],
	required_roles: [
		[ids.namesmith.roles.namesmither, ids.namesmith.roles.noName, ids.namesmith.roles.smithedName],
	],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const { playerService } = getNamesmithServices();

		const playerID = interaction.user.id;

		const currentName = await playerService.getCurrentName(playerID);
		const currentPublishedName = await playerService.getPublishedName(playerID);

		const didConfirmAction = await confirmInteractionWithButtons({
			interaction,
			message:
				`Are you sure you want to publish your current name: \`${currentName}\`?` +
				(currentPublishedName !== undefined ?
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

		await playerService.publishName(playerID);
	}
});