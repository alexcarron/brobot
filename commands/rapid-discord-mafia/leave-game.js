const ids = require("../../bot-config/discord-ids.js");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { GameState } = require("../../services/rapid-discord-mafia/game-state-manager.js");
const { deferInteraction } = require("../../utilities/discord-action-utils");
const { confirmInteractionWithButtons } = require("../../utilities/discord-action-utils.js");

module.exports = new SlashCommand({
	name: "leave-game",
	description: "Leave the game, committing suicide and making it impossible for you to win.",
	required_servers: [ids.servers.rapid_discord_mafia],
	required_roles: [ids.rapid_discord_mafia.roles.living],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		const player = global.game_manager.player_manager.getPlayerFromId(interaction.user.id);

		if (global.game_manager.state === GameState.SIGN_UP) {
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
		else if (global.game_manager.state === GameState.IN_PROGRESS) {
			if (!player.isAlive) {
				return await interaction.editReply("Dead people can't leave the game");
			}

			if (
				!await confirmInteractionWithButtons({
					interaction,
					message: `Are you sure you want to leave the game and never return? You should only do so if absolutely necessary!`,
					confirmText: "Yes, Leave the Game",
					cancelText: "No, Stay in the Game",
					confirmUpdateText: "Left the game.",
					cancelUpdateText: "Canceled.",
				})
			) {
				return
			}

			global.game_manager.player_manager.havePlayerLeave(player);
		}
		else {
			return await interaction.editReply("The game has to be in progress or in sign-ups for you to leave");
		}
	},
})