const Parameter = require("../../modules/commands/Paramater");
const SlashCommand = require("../../modules/commands/SlashCommand");
const Enums = require("../../modules/enums");
const { Subphases, RDMRoles } = require("../../modules/enums");
const Game = require("../../modules/rapid_discord_mafia/game");

const
	{
		getChannel,
		toTitleCase,
		deferInteraction
	} = require("../../modules/functions"),
	{
		rdm_server_id,
		player_actions_category_id,
	}
		= require("../../data/ids.json").rapid_discord_mafia,
	ids = require("../../data/ids.json");

const Subparameters = {
	PlayerVotingFor: new Parameter({
		type: "string",
		name: "player-voting-for",
		description: "The player you want to put on trial",
		isAutocomplete: true,
	}),
	TrialOutcome: new Parameter({
		type: "string",
		name: "trial-outcome",
		description: "The vote you want to cast for the current trial",
		autocomplete: Enums.TrialVotes
	}),
}
const Parameters = {
	ForPlayer: new Parameter({
		type: "subcommand",
		name: "for-player",
		description: "Vote for a player to put on trial",
		subparameters: [
			Subparameters.PlayerVotingFor
		]
	}),
	ForTrialOutcome: new Parameter({
		type: "subcommand",
		name: "for-trial-outcome",
		description: "Vote for whether or not you want to execute the player on trial",
		subparameters: [
			Subparameters.TrialOutcome,
		]
	}),
}

const command = new SlashCommand({
	name: "vote",
	description: "Vote for a player to put on trial or whether or not to execute the person on trial",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_roles = [ids.rapid_discord_mafia.roles.living];
command.parameters = [
	Parameters.ForPlayer,
	Parameters.ForTrialOutcome,
];
command.execute = async function execute(interaction, isTest=false) {
	await deferInteraction(interaction);

	let voter_player, max_voters_count

	if (isTest) {
		voter_player = global.Game.player_manager.getPlayerFromName(interaction.options.getString("player-voting"));
	}
	else {
		voter_player = global.Game.player_manager.getPlayerFromId(interaction.user.id);
	}

	const subcommand_name = interaction.options.getSubcommand();
	let vote;

	// Vote For Player
	if (subcommand_name === Parameters.ForPlayer.name) {
		vote = interaction.options.getString(Subparameters.PlayerVotingFor.name);

		const can_vote_player_feedback = voter_player.canVotePlayer(vote, global.Game);
		if (can_vote_player_feedback !== true)
			return await interaction.editReply(can_vote_player_feedback);

		const vote_player_feedback = voter_player.votePlayer(vote, global.Game);
		await interaction.editReply(vote_player_feedback);
	}
	// Vote For Trial Outcome
	else if (subcommand_name === Parameters.ForTrialOutcome.name) {
		vote = interaction.options.getString(Subparameters.TrialOutcome.name);

		const can_vote_feedback = voter_player.canVoteForTrialOutcome(vote);
		if (can_vote_feedback !== true)
			return await interaction.editReply(can_vote_feedback);

		const vote_feedback = voter_player.voteForTrialOutcome(vote);
		await interaction.editReply(vote_feedback);
	}
}
command.autocomplete = async function(interaction) {
	let autocomplete_values;
	const focused_param = await interaction.options.getFocused(true);
	if (!focused_param) return;
	const entered_value = focused_param.value;

	autocomplete_values = global.Game.player_manager.getAlivePlayers()
		.map((player) => {return {name: player.name, value: Enums.Votes.Player(player.name)}})

	autocomplete_values.push({name: "Abstain", value: Enums.Votes.Abstain});
	autocomplete_values.push({name: "Nobody", value: Enums.Votes.Nobody});

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