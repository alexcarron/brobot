const { PermissionFlagsBits } = require('discord.js');
const Parameter = require('../../../modules/commands/Paramater');
const SlashCommand = require('../../../modules/commands/SlashCommand');
const { deferInteraction } = require('../../../modules/functions');
const DailyMessageHandler = require('../../../modules/DailyMessageHandler');

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