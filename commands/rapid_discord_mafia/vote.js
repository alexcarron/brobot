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
		= require("../../databases/ids.json").rapid_discord_mafia,
	ids = require("../../databases/ids.json");

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

	let player_voting, max_voters_count

	if (isTest) {
		player_voting = global.Game.Players.getPlayerFromName(interaction.options.getString("player-voting"));
	}
	else {
		player_voting = global.Game.Players.getPlayerFromId(interaction.user.id);
	}

	const
		subcommand_name = interaction.options.getSubcommand();
	let
		vote,
		curr_votes,
		total_vote_count,
		isMajorityVote = false;

	const curr_days_passed = global.Game.days_passed;
	const announce_chnl = await getChannel(interaction.guild, ids.rapid_discord_mafia.channels.game_announce);

	// Vote For Player
	if (subcommand_name === Parameters.ForPlayer.name) {
		vote = interaction.options.getString(Subparameters.PlayerVotingFor.name);
		curr_votes = global.Game.votes
		max_voters_count = global.Game.Players.getAlivePlayers().length;

		console.log(global.Game.phase)
		console.log(global.Game.subphase)

		if (global.Game.subphase !== Subphases.Voting) {
			return await interaction.editReply(`We're not in the voting phase yet.`);
		}

		if (player_voting.name === vote) {
			return await interaction.editReply("You can't vote for yourself!");
		}

		if (!player_voting.canVote) {
			return await interaction.editReply("Sorry, you have been prevented from voting.");
		}

		if (curr_votes[player_voting.name]) {
			await Game.log(`**${player_voting.name}** changed their vote to **${vote}**`);
			announce_chnl.send(`**${player_voting.name}** changed their vote to **${vote}**`);
			interaction.editReply(`You are replacing your previous vote, **${curr_votes[player_voting.name]}**, with **${vote}**`);
		}
		else {
			await Game.log(`**${player_voting.name}** voted **${vote}**.`);
			announce_chnl.send(`**${player_voting.name}** voted **${vote}**.`);
			interaction.editReply(`You voted **${vote}**.`);
		}

		curr_votes[player_voting.name] = vote;
		global.Game.votes = curr_votes;

		player_voting.resetInactivity();
	}
	// Vote For Trial Outcome
	else if (subcommand_name === Parameters.ForTrialOutcome.name) {
		vote = interaction.options.getString(Subparameters.TrialOutcome.name);
		curr_votes = global.Game.trial_votes;
		max_voters_count = global.Game.Players.getAlivePlayers().length - 1;

		if (global.Game.subphase !== Subphases.Trial) {
			return await interaction.editReply(`We're not in the trial phase yet.`);
		}

		if (
			global.Game.on_trial === player_voting.name
		) {
			return await interaction.editReply(`You can't vote for your own trial.`);
		}

		if (curr_votes[player_voting.name]) {
			await Game.log(`**${player_voting.name}** changed their vote to **${toTitleCase(vote)}**`);
			announce_chnl.send(`**${player_voting.name}** changed their vote.`);
			interaction.editReply(`You are replacing your previous vote, **${toTitleCase(curr_votes[player_voting.name])}**, with **${toTitleCase(vote)}**`);
		}
		else {
			await Game.log(`**${player_voting.name}** voted **${toTitleCase(vote)}**.`);
			announce_chnl.send(`**${player_voting.name}** voted.`);
			interaction.editReply(`You voted **${toTitleCase(vote)}**.`);
		}

		curr_votes[player_voting.name] = vote;
		global.Game.trial_votes = curr_votes;
	}

	total_vote_count = Object.keys(curr_votes).length;

	console.log("Checking For Early Majority Vote");
	const majority_player_count = Math.ceil((max_voters_count) * Game.MAJORITY_VOTE_RATIO);
	console.log({max_voters_count, majority_player_count, total_vote_count});

	if (total_vote_count >= majority_player_count) {
		let vote_counts = {};

		for (let voter in curr_votes) {
			let vote = curr_votes[voter];


			if (vote.toLowerCase() == Enums.TrialVotes.Abstain.toLowerCase())
				continue;

			if (!vote_counts[vote])
				vote_counts[vote] = 1;
			else
				vote_counts[vote] += 1;

			if (vote_counts[vote] >= majority_player_count) {
				isMajorityVote = true;
				break
			}
		}
	}

	if (isMajorityVote || total_vote_count == max_voters_count) {
		if (global.Game.subphase === Subphases.Trial) {
			global.Game.startTrialResults(curr_days_passed, interaction);
		}
		else if (global.Game.subphase === Subphases.Voting) {
			global.Game.startTrial(curr_days_passed, interaction);
		}
	}

	player_voting.resetInactivity();
}
command.autocomplete = async function(interaction) {
	let autocomplete_values;
	const focused_param = await interaction.options.getFocused(true);
	if (!focused_param) return;
	const entered_value = focused_param.value;

	autocomplete_values = global.Game.Players.getAlivePlayers()
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