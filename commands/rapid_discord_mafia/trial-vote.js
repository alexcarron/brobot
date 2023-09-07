const Parameter = require("../../modules/commands/Paramater");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { Subphases, RDMRoles } = require("../../modules/enums");

const
	{
		getChannel,
		toTitleCase
	} = require("../../modules/functions"),
	{
		rdm_server_id,
		player_actions_category_id,
		voting_booth_id
	}
		= require("../../databases/ids.json").rapid_discord_mafia,
	ids = require("../../databases/ids.json");

const command = new SlashCommand({
	name: "trial-vote",
	description: "Vote for whether or not the player on trial should be hung",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_categories = [player_actions_category_id];
command.required_roles = RDMRoles.Living;
command.parameters = [
	new Parameter({
		type: "string",
		name: "vote",
		description: "The vote you want to cast for the current trial",
		autocomplete: {
			Guilty: "Guilty",
			Innocent: "Innocent",
			Abstain: "Abstain",
		}
	})
];
command.execute = async function execute(interaction, args, isTest=false) {
	try {
		await interaction.deferReply({ephemeral: true});
	}
	catch {
		console.log("Failed Defer: Reply Already Exists");
		await interaction.editReply({ content: "Sending Command...", ephemeral: true});
	}

	let player_name, vote;
	const curr_days_passed = global.Game.days_passed;

	if (!isTest) {
		player_name = global.Game.Players.getPlayerFromId(interaction.user.id).name;

		vote = interaction.options.getString(command.parameters[0].name).toLowerCase();
	}
	else {
		player_name = args[0];
		vote = args.slice(1).join(" ").toLowerCase();
	}

	if (global.Game.subphase !== Subphases.Trial) {
		interaction.editReply(`We're not in the trial phase yet.`);
		return;
	}

	if (global.Game.on_trial === player_name) {
		interaction.editReply(`You can't vote for your own trial.`);
		return;
	}

	if ( !["guilty", "innocent", "abstain"].includes(vote) ) {
		interaction.editReply(
			`**${vote}** is not a valid vote.\n` +
			`You can only vote **Guilty**, **Innocent**, or **Abstain**.`
		);
		return;
	}

	let voting_booth_chnl = await getChannel(interaction.guild, voting_booth_id);

	if (global.Game.trial_votes[player_name]) {
		voting_booth_chnl.send(`**${player_name}** changed their vote.`);
		interaction.editReply(`You are replacing your previous vote, **${toTitleCase(global.Game.trial_votes[player_name])}**, with **${toTitleCase(vote)}**`);
	}
	else {
		voting_booth_chnl.send(`**${player_name}** voted.`);
		interaction.editReply(`You voted **${toTitleCase(vote)}**.`);
	}

	console.log(player_name);
	global.Game.trial_votes[player_name] = vote;




	let max_voters_count = global.Game.Players.getAlivePlayers().length - 1,
		majority_player_count = Math.ceil((max_voters_count) * 2/3),
		total_vote_count = Object.keys(global.Game.trial_votes).length,
		isMajorityVote = false;

	console.log("Checking For Early Majority Vote");
	console.log(global.Game.trial_votes);
	console.log({max_voters_count, majority_player_count, total_vote_count});

	if (total_vote_count >= majority_player_count) {
		let vote_counts = {};

		for (let voter in global.Game.trial_votes) {
			let vote = global.Game.trial_votes[voter];


			if (vote.toLowerCase() == "abstain")
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
		global.Game.startTrialResults(curr_days_passed, interaction);
	}
}

module.exports = command;