const { Parameter } = require("../../services/command-creation/parameter");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const ids = require("../../bot-config/discord-ids.js");
const { Vote, TrialVote } = require("../../services/rapid-discord-mafia/vote-manager.js");
const { deferInteraction } = require("../../utilities/discord-action-utils.js");
const { getStringParamValue } = require("../../utilities/discord-fetch-utils");

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
		autocomplete: TrialVote
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

module.exports = new SlashCommand({
	name: "vote",
	description: "Vote for a player to put on trial or whether or not to execute the person on trial",
	required_servers: [ids.servers.rapid_discord_mafia],
	required_roles: [ids.rapid_discord_mafia.roles.living],
	parameters: [
		Parameters.ForPlayer,
		Parameters.ForTrialOutcome,
	],
	execute: async function execute(interaction, isTest=false) {
		await deferInteraction(interaction);

		let voter_player;

		if (isTest) {
			voter_player = global.game_manager.player_manager.getPlayerFromName(getStringParamValue(interaction, "player-voting"));
		}
		else {
			voter_player = global.game_manager.player_manager.getPlayerFromId(interaction.user.id);
		}

		const subcommand_name = interaction.options.getSubcommand();
		let nameOfVoter;

		// Vote For Player
		if (subcommand_name === Parameters.ForPlayer.name) {
			nameOfVoter = getStringParamValue(interaction, Subparameters.PlayerVotingFor.name);

			const can_vote_player_feedback = global.game_manager.vote_manager.canPlayerVotePlayer(voter_player, nameOfVoter);
			if (can_vote_player_feedback !== true)
				return await interaction.editReply(can_vote_player_feedback);

			const player_voting_for = global.game_manager.player_manager.get(nameOfVoter);
			const vote_player_feedback = global.game_manager.vote_manager.addVoteForPlayer(voter_player, player_voting_for);
			await interaction.editReply(vote_player_feedback);
		}
		// Vote For Trial Outcome
		else if (subcommand_name === Parameters.ForTrialOutcome.name) {
			nameOfVoter = getStringParamValue(interaction, Subparameters.TrialOutcome.name);


			const can_vote_feedback = global.game_manager.vote_manager.canVoteForTrialOutcome(voter_player, nameOfVoter);

			if (can_vote_feedback !== true)
				return await interaction.editReply(can_vote_feedback);


			const vote_feedback = global.game_manager.vote_manager.addVoteForTrialOutcome(voter_player, nameOfVoter);
			await interaction.editReply(vote_feedback);
		}
	},
	autocomplete: async function(interaction) {
		let autocomplete_values;
		const focused_param = await interaction.options.getFocused(true);
		if (!focused_param) return;
		const entered_value = focused_param.value;

		autocomplete_values = global.game_manager.player_manager.getAlivePlayers()
			.map((player) => {return {name: player.name, value: Vote.PLAYER(player.name)}})

		autocomplete_values.push({name: "Abstain", value: Vote.ABSTAIN});
		autocomplete_values.push({name: "Nobody", value: Vote.NOBODY});

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
	}
})