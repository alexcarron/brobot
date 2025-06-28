const { PermissionFlagsBits } = require("discord.js");
const ids = require("../../bot-config/discord-ids");
const SlashCommand = require("../../services/command-creation/slash-command");
const { getNamesmithServices } = require("../../services/namesmith/services/get-namesmith-services");
const { deferInteraction } = require("../../utilities/discord-action-utils");


const command = new SlashCommand({
	name: "start-namesmith-game",
	description: "Start a Namesmith game",
});
command.required_servers = [ids.servers.namesmith];
command.required_permissions = [PermissionFlagsBits.Administrator];
command.isInDevelopment = true;
command.execute = async function execute(interaction) {
	await deferInteraction(interaction);

	const { gameStateService } = getNamesmithServices();
	await gameStateService.startGame();

	await interaction.editReply(`Namesmith game has started!`);
}

module.exports = command;