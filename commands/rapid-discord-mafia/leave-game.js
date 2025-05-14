const ids = require("../../bot-config/discord-ids.js");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { deferInteraction } = require("../../utilities/discord-action-utils");
const { GameStates, RDMRoles } = require("../../modules/enums");
const { confirmInteractionWithButtons } = require("../../utilities/discord-action-utils.js");

const command = new SlashCommand({
	name: "leave-game",
	description: "Leave the game, committing suicide and making it impossible for you to win.",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_roles = [ids.rapid_discord_mafia.roles.living];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const player = global.game_manager.player_manager.getPlayerFromId(interaction.user.id);

	if (global.game_manager.state === GameStates.SignUp) {
		if (
			!await confirmInteractionWithButtons({
				interaction,
				message: `Are you sure you want to leave the game?`,
				confirmText: "Yes, Leave the Game",
				cancelText: "No, Stay in the Game",
				confirmUpdateText: "Left the game.",
				cancelUpdateText: "Canceled.",
			})
		) {
			return
		}

		global.game_manager.player_manager.havePlayerLeaveSignUps(player);
	}
	else if (global.game_manager.state === GameStates.InProgress) {
		if (!player.isAlive) {
			return await interaction.editReply("Dead people can't leave the game");
		}

		if (
			!await confirmInteractionWithButtons({
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

		global.game_manager.player_manager.havePlayerLeave(player);
	}
	else {
		return await interaction.editReply("The game has to be in progress or in sign-ups for you to leave");
	}
};

module.exports = command;