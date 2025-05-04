const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../modules/commands/SlashCommand");
const ids = require(`../../bot-config/discord-ids.js`);
const { editReplyToInteraction } = require("../../modules/functions");
const GameManager = require("../../modules/rapid_discord_mafia/GameManager");

module.exports = {

};

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