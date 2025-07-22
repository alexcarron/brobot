const { PermissionFlagsBits } = require("discord.js");
const ids = require("../../bot-config/discord-ids");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { deferInteraction, editReplyToInteraction } = require("../../utilities/discord-action-utils");
const getAnomolyService = require("../../services/sand-season-3/anomoly/get-anomoly-service");

const command =new SlashCommand({
	name: "start-anomoly-challenge",
	description: "Start the SAND Season 3 anomoly challenge",
	required_permissions: [PermissionFlagsBits.Administrator],
	required_servers: [ids.servers.sandSeason3],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const anomolyService = getAnomolyService();
		anomolyService.startChallenge();

		await editReplyToInteraction(interaction,
			`Successfully started the SAND Season 3 anomoly challenge`
		);
	}
});

module.exports = command;