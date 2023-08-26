const { Subphases } = require("../../modules/enums");

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
		= require("../../databases/ids.json").rapid_discord_mafia;

module.exports = {
	name: 'trialvote',
    aliases: ['votetrial', 'verdict', 'tv', 'vt'],
	usages: ["Guilty/Innocent/Abstain"],
    description: 'Vote for whether or not the player on trial should be hung.',
	hasCommaArgs: true,
	comma_arg_count: 1,
	isSeverOnly: true,
	required_servers: [rdm_server_id],
    required_categories: [player_actions_category_id],
    required_roles: ["Living"],
	async execute(message, args, isTest=false) {

		let player_name, vote;
		const curr_days_passed = global.Game.days_passed;

		if (!isTest) {
			player_name = global.Game.Players.getPlayerFromId(message.author.id).name;

			vote = args.join(" ").toLowerCase();
		}
		else {
			player_name = args[0];
			vote = args.slice(1).join(" ").toLowerCase();
		}

		if (global.Game.subphase !== Subphases.Trial) {
			message.channel.send(`We're not in the trial phase yet.`);
			return;
		}

		if (global.Game.on_trial === player_name) {
			message.channel.send(`You can't vote for your own trial.`);
			return;
		}

		if ( !["guilty", "innocent", "abstain"].includes(vote) ) {
			message.channel.send(
				`**${vote}** is not a valid vote.\n` +
				`You can only vote **Guilty**, **Innocent**, or **Abstain**.`
			);
			return;
		}

		let voting_booth_chnl = await getChannel(message.guild, voting_booth_id);

		if (global.Game.trial_votes[player_name]) {
			voting_booth_chnl.send(`**${player_name}** changed their vote.`);
			message.channel.send(`You are replacing your previous vote, **${toTitleCase(global.Game.trial_votes[player_name])}**, with **${toTitleCase(vote)}**`);
		}
		else {
			voting_booth_chnl.send(`**${player_name}** voted.`);
			message.channel.send(`You voted **${toTitleCase(vote)}**.`);
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
			global.Game.startTrialResults(curr_days_passed, message);
		}
    }
}