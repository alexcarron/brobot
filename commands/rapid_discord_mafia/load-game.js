const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../modules/commands/SlashCommand");
const ids = require(`../../data/ids.json`)

const command = new SlashCommand({
	name: "load-game",
	description: "Load Rapid Discord Mafia game from last save",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.required_servers = [ids.servers.rapid_discord_mafia];
command.execute = async function execute(interaction) {
	await interaction.deferReply({ephemeral: true});

	if (global.game_manager && global.game_manager instanceof Game) {
		await global.game_manager.data_manger.loadFromGithub();
		global.game_manager.logger.logDebug(global.game_manager);
		editReplyToInteraction(interaction, "Game successfully loaded.");
	}
	else {
		editReplyToInteraction(interaction, "Couldn't load the game.");
	}
}

module.exports = command;