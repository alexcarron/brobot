const Parameter = require("../../modules/commands/Paramater");
const ids = require("../../databases/ids.json");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { deferInteraction, confirmAction } = require("../../modules/functions");
const { GameStates } = require("../../modules/enums");

const command = new SlashCommand({
	name: "leave-game",
	description: "Leave the game, committing suicide and making it impossible for you to win.",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_roles = [ids.rapid_discord_mafia.roles.living];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const player = global.Game.Players.getPlayerFromId(interaction.user.id);

	if (global.Game.state === GameStates.SignUp) {
		// Undo global.Game.addPlayerToGame
	}
	else if (global.Game.state !== GameStates.InProgress) {
		return await interaction.editReply("The game has to be in progress for yo to leave");
	}

	if (!player.isAlive) {
		return await interaction.editReply("Dead people can't leave the game");
	}

	if (
		!await confirmAction({
			interaction,
			message: `Are you sure you want to leave the game and never return? You should only do so if absolutely necessary!`,
			confirm_txt: "Yes, Leave the Game",
			cancel_txt: "No, Stay in the Game",
			confirm_update_txt: "Left the game.",
			cancel_update_txt: "Canceled.",
		})
	) {
		return
	}

	player.leaveGame();
};

module.exports = command;