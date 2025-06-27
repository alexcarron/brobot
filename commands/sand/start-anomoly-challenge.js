const { PermissionFlagsBits, ChatInputCommandInteraction } = require("discord.js");
const ids = require("../../bot-config/discord-ids");
const SlashCommand = require("../../services/command-creation/slash-command");
const { deferInteraction, editReplyToInteraction, removePermissionFromChannel } = require("../../utilities/discord-action-utils");
const { fetchGuild, fetchChannel, fetchGuildMember } = require("../../utilities/discord-fetch-utils");
const getAnomolyService = require("../../services/sand-season-3/anomoly/get-anomoly-service");

const command =new SlashCommand({
	name: "start-anomoly-challenge",
	description: "Start the SAND Season 3 anomoly challenge",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.required_servers = [ids.servers.sandSeason3];

/**
 * @param {ChatInputCommandInteraction} interaction
 */
command.execute = async function execute(interaction) {
	await deferInteraction(interaction);

	const now = new Date();
	const anomolyService = getAnomolyService();
	anomolyService.startChallenge(now);

	await editReplyToInteraction(interaction,
		`Successfully started the SAND Season 3 anomoly challenge`
	);
};

module.exports = command;