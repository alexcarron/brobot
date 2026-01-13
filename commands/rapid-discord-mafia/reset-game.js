const { SlashCommand } = require('../../services/command-creation/slash-command');
const { ids } = require(`../../bot-config/discord-ids`);
const { PermissionFlagsBits } = require('discord.js');
const { editReplyToInteraction, deferInteraction } = require('../../utilities/discord-action-utils');
const { GameManager } = require('../../services/rapid-discord-mafia/game-manager.js');

module.exports = new SlashCommand({
	name: "reset-game",
	description: "Resets the current Rapid Discord Mafia game",
	required_servers: [ids.servers.rapid_discord_mafia],
	required_permissions: [PermissionFlagsBits.Administrator],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		await GameManager.reset();

		await editReplyToInteraction(interaction, "Reset everything.");
	},
});