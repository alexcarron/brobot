const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../modules/commands/SlashCommand");
const
	{
		deferInteraction,
	} = require("../../modules/functions"),
	ids = require("../../data/ids.json");

const command = new SlashCommand({
	name: "start-night",
	description: "Start the night phase in RDM",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.required_servers = [ids.servers.rapid_discord_mafia];

command.execute = async function execute(interaction, args, isTest=false) {
	await deferInteraction(interaction);
	await global.game_manager.startNight();
}

module.exports = command;