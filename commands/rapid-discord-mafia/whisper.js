const { Parameter } = require("../../services/command-creation/parameter");
const { ids } = require("../../bot-config/discord-ids");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { deferInteraction } = require('../../utilities/discord-action-utils');
const { GameState } = require("../../services/rapid-discord-mafia/game-state-manager.js");
const { getRequiredStringParam } = require("../../utilities/discord-fetch-utils");

const Parameters = {
	PlayerWhisperingTo: new Parameter({
		type: "string",
		name: "player-whispering-to",
		description: "The player you want to whisper to",
		isAutocomplete: true,
	}),
	WhisperContents: new Parameter({
		type: "string",
		name: "whisper-contents",
		description: "What you want to whisper to the other player"
	})
}

module.exports = new SlashCommand({
	name: "whisper",
	description: "Secretly talk to another player, without anyone knowing what you said.",
	required_roles: [ids.rapid_discord_mafia.roles.living],
	parameters: [
		Parameters.PlayerWhisperingTo,
		Parameters.WhisperContents,
	],
	required_servers: [ids.servers.rapid_discord_mafia],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		if (global.game_manager.state !== GameState.IN_PROGRESS)
			return await interaction.editReply("Wait for the game to start!");

		const player_whispering = global.game_manager.player_manager.getPlayerFromId(interaction.user.id);
		const player_whispering_to_name = getRequiredStringParam(interaction, Parameters.PlayerWhisperingTo.name);
		const whisper_contents = getRequiredStringParam(interaction, Parameters.WhisperContents.name);
		const player_whispering_to = global.game_manager.player_manager.getPlayerFromName(player_whispering_to_name);

		if (player_whispering === undefined)
			return await interaction.editReply("You're not in the game!");

		if (player_whispering_to === undefined)
			return await interaction.editReply("That player isn't in the game!");

		if (player_whispering.name === player_whispering_to.name) {
			return await interaction.editReply("Don't you think it's a bit weird to whisper to yourself?");
		}

		if (player_whispering.isMuted) {
			return await interaction.editReply("Sorry, but you've been prevented from whispering.");
		}

		await player_whispering.whisper(player_whispering_to, whisper_contents);

		interaction.editReply(`**You** whispered to **${player_whispering_to.name}** the following\n>>> ${whisper_contents}`);
	},
	autocomplete: async function(interaction) {
		let autocomplete_values;
		const focused_param = await interaction.options.getFocused(true);
		if (!focused_param) return;
		const entered_value = focused_param.value;
		const player_using_cmd = global.game_manager.player_manager.getPlayerFromId(interaction.user.id);

		if (player_using_cmd === undefined) return;

		autocomplete_values = global.game_manager.player_manager.getAlivePlayers()
			.filter(player => player.name !== player_using_cmd.name)
			.map((player) => {return {name: player.name, value: player.name}})
			.filter(autocomplete_entry => autocomplete_entry.value.toLowerCase().startsWith(entered_value.toLowerCase()));

		if (Object.values(autocomplete_values).length <= 0) {
			autocomplete_values = [{name: "Sorry, there are no alive players to choose from", value: "N/A"}];
		}
		else if (Object.values(autocomplete_values).length > 25) {
			autocomplete_values.splice(25);
		}

		await interaction.respond(
			autocomplete_values
		);
	}
});