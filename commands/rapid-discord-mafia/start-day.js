const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../modules/commands/SlashCommand");
const ids = require("../../bot-config/discord-ids.js");


const
	{
		deferInteraction,
	} = require("../../modules/functions");

const command = new SlashCommand({
	name: "start-day",
	description: "Start the day phase in RDM.",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_permissions = [PermissionFlagsBits.Administrator];
command.execute = async function execute(interaction, args, isTest=false) {
	await deferInteraction(interaction);
	await global.game_manager.startDay();
}
module.exports = command;