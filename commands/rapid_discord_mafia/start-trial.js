const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { Announcements, PhaseWaitTimes, MessageDelays, VotingOutcomes } = require("../../modules/enums");
const Game = require("../../modules/rapid_discord_mafia/game");

const
	{
		getChannel,
		getGuildMember,
		getRole,
		logColor,
		wait,
		addRole,
		getUnixTimestamp,
		deferInteraction,
	} = require("../../modules/functions"),
	{
		rdm_server_id,
		roles: role_ids,
		channels: channel_ids,
	} = require("../../data/ids.json").rapid_discord_mafia,
	ids = require("../../data/ids.json");

const command = new SlashCommand({
	name: "start-trial",
	description: "Start the trial phase in RDM",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.required_servers = [ids.servers.rapid_discord_mafia];
command.execute = async function execute(interaction, args, isTest=false) {
	await deferInteraction(interaction);
	await global.Game.startTrial();
}
module.exports = command;