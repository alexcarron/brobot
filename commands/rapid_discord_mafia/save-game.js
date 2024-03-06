const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../modules/commands/SlashCommand");
const ids = require(`../../data/ids.json`);
const { editReplyToInteraction } = require("../../modules/functions");

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

	await global.Game.saveGameDataToDatabase();
	console.log(this);

	editReplyToInteraction(interaction, "Game successfully saved.")
}

module.exports = command;