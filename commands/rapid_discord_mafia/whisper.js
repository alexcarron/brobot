const Parameter = require("../../modules/commands/Paramater");
const ids = require("../../data/ids.json");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { deferInteraction } = require("../../modules/functions");
const { Phases, GameStates } = require("../../modules/enums");

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

const command = new SlashCommand({
	name: "whisper",
	description: "Secretly talk to another player, without anyone knowing what you said.",
});
command.required_roles = [ids.rapid_discord_mafia.roles.living];
command.parameters = [
	Parameters.PlayerWhisperingTo,
	Parameters.WhisperContents,
];
command.required_servers = [ids.servers.rapid_discord_mafia];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	if (global.Game.state !== GameStates.InProgress)
		return await interaction.editReply("Wait for the game to start!");

	const player_whispering = global.Game.player_manager.getPlayerFromId(interaction.user.id);
	const player_whispering_to_name = interaction.options.getString(Parameters.PlayerWhisperingTo.name);
	const whisper_contents = interaction.options.getString(Parameters.WhisperContents.name);
	const player_whispering_to = global.Game.player_manager.getPlayerFromName(player_whispering_to_name);

	if (player_whispering.name === player_whispering_to.name) {
		return await interaction.editReply("Don't you think it's a bit weird to whisper to yourself?");
	}

	if (player_whispering.isMuted) {
		return await interaction.editReply("Sorry, but you've been prevented from whispering.");
	}

	await player_whispering.whisper(player_whispering_to, whisper_contents);

	interaction.editReply(`**You** whispered to **${player_whispering_to.name}** the following\n>>> ${whisper_contents}`);
};
command.autocomplete = async function(interaction) {
	let autocomplete_values;
	const focused_param = await interaction.options.getFocused(true);
	if (!focused_param) return;
	const entered_value = focused_param.value;
	const player_using_cmd = global.Game.player_manager.getPlayerFromId(interaction.user.id);

	autocomplete_values = global.Game.player_manager.getAlivePlayers()
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
};

module.exports = command;