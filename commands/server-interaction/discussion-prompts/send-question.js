const { PermissionFlagsBits } = require('discord.js');
const { SlashCommand } = require('../../../services/command-creation/slash-command');
const { deferInteraction } = require('../../../utilities/discord-action-utils');
const DailyMessageHandler = require('../../../services/discussion-prompts/daily-message-handler');

module.exports = new SlashCommand({
	name: "send-question",
	description: "Send a contraversial or philosophical question",
	required_permissions: [PermissionFlagsBits.Administrator],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		const dailyMessageHandler = new DailyMessageHandler(global.channelsToMessages);
		dailyMessageHandler.sendDailyMessage();

		return await interaction.editReply("Done");
	}
});