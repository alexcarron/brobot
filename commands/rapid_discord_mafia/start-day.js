const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { Abilities } = require("../../modules/rapid_discord_mafia/ability");
const ids = require("../../data/ids.json");
const { Announcements, MessageDelays, PhaseWaitTimes } = require("../../modules/enums");


const
	{ factions, max_timeout } = require("../../data/rapid_discord_mafia/constants"),
	{
		getChannel,
		getRole,
		logColor,
		wait,
		getUnixTimestamp,
		deferInteraction,
	} = require("../../modules/functions"),
	{
		living_role_id,
		town_discussion_channel_id: day_chat_chnl_id,
		channels: channel_ids,
	} = require("../../data/ids.json").rapid_discord_mafia;

const command = new SlashCommand({
	name: "start-day",
	description: "Start the day phase in RDM.",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_permissions = [PermissionFlagsBits.Administrator];
command.execute = async function execute(interaction, args, isTest=false) {
	await deferInteraction(interaction);
	await global.Game.startDay();
}
module.exports = command;