const ids = require("../../bot-config/discord-ids");
const SlashCommand = require("../../services/command-creation/slash-command");
const { fetchPlayerName, getPublishedNameOfPlayer, publishNameOfPlayer } = require("../../services/namesmith/namesmith-utilities");
const { confirmInteractionWithButtons, deferInteraction, editReplyToInteraction } = require("../../utilities/discord-action-utils");
const { getNicknameOfInteractionUser, fetchChannel } = require("../../utilities/discord-fetch-utils");

const command = new SlashCommand({
	name: "publish-name",
	description: "Publishes your current name to eventually be automatically submitted for voting",
});
command.required_servers = [ids.servers.namesmith];
command.required_roles = [
	[ids.namesmith.roles.namesmither, ids.namesmith.roles.noName, ids.namesmith.roles.smithedName],
];
command.isInDevelopment = true;

command.execute = async function execute(interaction) {
	await deferInteraction(interaction);

	const playerID = interaction.user.id;

	const currentName = await fetchPlayerName(playerID);
	const currentPublishedName = getPublishedNameOfPlayer(playerID);

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

	await publishNameOfPlayer(playerID);
}

module.exports = command;