const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../services/command-creation/slash-command.js");
const ids = require(`../../bot-config/discord-ids.js`);
const { GameManager } = require("../../services/rapid-discord-mafia/game-manager.js");
const { editReplyToInteraction } = require("../../utilities/discord-action-utils.js");

const command = new SlashCommand({
	name: "load-game",
	description: "Load Rapid Discord Mafia game from last save",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.required_servers = [ids.servers.rapid_discord_mafia];
command.execute = async function execute(interaction) {
	await interaction.deferReply({ephemeral: true});

	if (global.game_manager && global.game_manager instanceof GameManager) {
		await global.game_manager.data_manager.loadFromGithub();
		editReplyToInteraction(interaction, "Game successfully loaded.");
	}
	else {
		editReplyToInteraction(interaction, "Couldn't load the game.");
	}
}

module.exports = command;