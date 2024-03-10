const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../modules/commands/SlashCommand");
const ids = require(`../../data/ids.json`);
const { editReplyToInteraction } = require("../../modules/functions");
const Game = require("../../modules/rapid_discord_mafia/game");

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

	if (global.Game && global.Game instanceof Game) {
		await global.Game.data_manger.saveToGithub();
		global.Game.logger.logDebug(global.Game);
		editReplyToInteraction(interaction, "Game successfully saved.");
	}
	else {
		editReplyToInteraction(interaction, "Couldn't save the game.");
	}

}

module.exports = command;