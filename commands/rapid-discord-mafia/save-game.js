const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../services/command-creation/slash-command");
const ids = require(`../../bot-config/discord-ids.js`);
const { GameManager } = require("../../services/rapid-discord-mafia/game-manager");
const { editReplyToInteraction } = require("../../utilities/discord-action-utils.js");

const command = new SlashCommand({
	name: "save-game",
	description: "Save Rapid Discord Mafia game data.",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_permissions = [PermissionFlagsBits.Administrator];
command.execute = async function execute(interaction) {
	await interaction.deferReply({ephemeral: true});

	if (global.game_manager && global.game_manager instanceof GameManager) {
		await global.game_manager.data_manager.saveToGithub();
		editReplyToInteraction(interaction, "Game successfully saved.");
	}
	else {
		editReplyToInteraction(interaction, "Couldn't save the game.");
	}

}

module.exports = command;