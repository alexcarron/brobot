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

	if (global.Game && global.Game instanceof Game) {
		await global.Game.data_manger.loadFromGithub();
		global.Game.logger.logDebug(global.Game);
		editReplyToInteraction(interaction, "Game successfully loaded.");
	}
	else {
		editReplyToInteraction(interaction, "Couldn't load the game.");
	}
}

module.exports = command;