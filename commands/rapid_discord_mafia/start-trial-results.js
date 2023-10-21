const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { MessageDelays } = require("../../modules/enums");
const Game = require("../../modules/rapid_discord_mafia/game");
const Death = require("../../modules/rapid_discord_mafia/death");

const
	{ factions } = require("../../databases/rapid_discord_mafia/constants"),
	{
		getChannel,
		getGuildMember,
		getRole,
		logColor,
		wait,
		addRole,
		removeRole,
		toTitleCase,
		deferInteraction,
	} = require("../../modules/functions"),
	{
		rdm_server_id,
		channels: channel_ids,
	} = require("../../databases/ids.json").rapid_discord_mafia,
	ids = require("../../databases/ids.json");

const command = new SlashCommand({
	name: "start-trial-results",
	description: "Start the trial results phase in RDM",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.required_servers = [ids.servers.rapid_discord_mafia];
command.execute = async function execute(interaction, args, isTest=false) {
	await deferInteraction(interaction);
	await global.Game.startTrialResults();
}

module.exports = command;