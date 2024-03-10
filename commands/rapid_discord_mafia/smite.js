const Parameter = require("../../modules/commands/Paramater");
const SlashCommand = require("../../modules/commands/SlashCommand");
const ids = require("../../data/ids.json");
const { deferInteraction } = require("../../modules/functions");

const Parameters = {
	PlayerSmiting: new Parameter({
		type: "string",
		name: "player-smiting",
		description: "The player you want to smite",
		isAutocomplete: true,
	}),
}

const command = new SlashCommand({
	name: "smite",
	description: "Smite a player who is inactive or breaking the rules",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.parameters = [
	Parameters.PlayerSmiting,
];
command.execute = async function execute(interaction, isTest=false) {
	await deferInteraction(interaction);

	const player_name = interaction.options.getString(Parameters.PlayerSmiting.name);
	const player = global.game_manager.player_manager.getPlayerFromName(player_name);
	await global.game_manager.player_manager.smitePlayer(player);
	await interaction.editReply(`You have smited **${player.name}**`);
}
command.autocomplete = async function(interaction) {
	let autocomplete_values;
	const focused_param = await interaction.options.getFocused(true);
	if (!focused_param) return;
	const entered_value = focused_param.value;

	autocomplete_values = global.game_manager.player_manager.getAlivePlayers()
		.map((player) => {return {name: player.name, value: player.name}})

	autocomplete_values = autocomplete_values
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