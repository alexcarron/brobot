const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../modules/commands/SlashCommand");
const ids = require(`../../databases/ids.json`)

const command = new SlashCommand({
	name: "load-game",
	description: "Load Rapid Discord Mafia game from last save",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.required_servers = [ids.servers.rapid_discord_mafia];
command.execute = async function execute(interaction) {
	await interaction.deferReply({ephemeral: true});

	await global.Game.loadGameDataFromDatabase();
	interaction.editReply("Game succesfully loaded.");
	global.Game.logGame();
}

module.exports = command;