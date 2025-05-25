const { PermissionFlagsBits } = require('discord.js');
const { Parameter } = require('../../../services/command-creation/parameter');
const SlashCommand = require('../../../services/command-creation/slash-command');
const { deferInteraction } = require('../../../utilities/discord-action-utils');
const DailyMessageHandler = require('../../../services/discussion-prompts/daily-message-handler');

const command = new SlashCommand({
	name: "send-question",
	description: "Send a contraversial or philosophical question",
});
command.required_permissions = [PermissionFlagsBits.Administrator]
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const dailyMessageHandler = new DailyMessageHandler(global.channelsToMessages);
	dailyMessageHandler.sendDailyMessage();

	return await interaction.editReply("Done");
}

module.exports = command