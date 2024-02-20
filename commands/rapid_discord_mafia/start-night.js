const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { Feedback, AbilityTypes, Announcements, PhaseWaitTimes } = require("../../modules/enums");
const { Abilities } = require("../../modules/rapid_discord_mafia/ability");
const Game = require("../../modules/rapid_discord_mafia/game");
const
	roles = require("../../modules/rapid_discord_mafia/roles"),
	{
		getChannel,
		getCategoryChildren,
		getRole,
		logColor,
		wait,
		getUnixTimestamp,
		deferInteraction,
	} = require("../../modules/functions"),
	{
		rdm_server_id,
		town_discussion_channel_id: day_chat_chnl_id,
		living_role_id,
		night_chat_category_id,
		channels: channel_ids
	} = require("../../data/ids.json").rapid_discord_mafia,
	ids = require("../../data/ids.json");

const command = new SlashCommand({
	name: "start-night",
	description: "Start the night phase in RDM",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.required_servers = [ids.servers.rapid_discord_mafia];

command.execute = async function execute(interaction, args, isTest=false) {
	await deferInteraction(interaction);
	await global.Game.startNight();
}

module.exports = command;