const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../services/command-creation/slash-command");

const ids = require("../../bot-config/discord-ids.js");
const { deferInteraction } = require("../../utilities/discord-action-utils.js");

const command = new SlashCommand({
	name: "start-trial",
	description: "Start the trial phase in RDM",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.required_servers = [ids.servers.rapid_discord_mafia];
command.execute = async function execute(interaction, args, isTest=false) {
	await deferInteraction(interaction);
	await global.game_manager.startTrial();
}
module.exports = command;