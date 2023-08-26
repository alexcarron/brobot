const { Subphases } = require("../modules/enums");

const

	{
		getChannel,

		toTitleCase,
		autocomplete
	} = require("../modules/functions"),
	{
		rdm_server_id,
		player_actions_category_id,
		voting_booth_id
	}
		= require("../databases/ids.json").rapid_discord_mafia;

module.exports = {
	name: 'vote',
    aliases: ['voteplayer', 'v'],
	usages: ["PLAYER/Nobody/Abstain"],
    description: 'Vote for a player to be put up on trial, or vote for "Nobody".',
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

			vote = args.join(" ");
		}
		else {
			player_name = args[0];
			vote = args.slice(1).join(" ");
		}

		if (global.Game.subphase !== Subphases.Voting) {
			message.channel.send(`We're not in the voting phase yet.`);
			if (global.Game.subphase == Subphases.Trial) {
				message.channel.send(`We're in the trial phase. Did you mean to use the \`<trialvote\` command?`);
			}
			return;
		}

		let alive_player_names = global.Game.Players.getAlivePlayerNames();

		if ( ["nobody", "abstain"].includes(vote.toLowerCase()) ) vote = vote.toLowerCase();

		// Does Player Exist
		if ( !(alive_player_names.includes(vote) || ["nobody", "abstain"].includes(vote)) ) {

			// Try To Autocomplete Player
			let autocomplete_vote = autocomplete(vote, alive_player_names);

			if (autocomplete_vote) {
				await message.channel.send(`Assuming **${vote}** was meant to be **${autocomplete_vote}**`);
				vote = autocomplete_vote;
			} else {
				let alive_player_name_msgs = alive_player_names.map(name => `**${name}**`);

				message.channel.send(
					`**${vote}** is not a living player or valid vote. (Case-sensitive)\n` +
					`The living players are: ${alive_player_name_msgs.join(", ")}`
				);
				return false;
			}
		}
		else if (vote == player_name) {
			message.channel.send("Try voting for someone cooler.");
			return false;
		}

		let voting_booth_chnl = await getChannel(message.guild, voting_booth_id),
			vote_msg = vote;

		if (["nobody", "abstain"].includes(vote))
			vote_msg = toTitleCase(vote);

		if (global.Game.votes[player_name]) {
			voting_booth_chnl.send(`**${player_name}** changed their vote to **${vote_msg}**.`);
			message.channel.send(`You are replacing your previous vote, **${global.Game.votes[player_name]}**, with **${vote_msg}**`);
		}
		else {
			voting_booth_chnl.send(`**${player_name}** voted **${vote_msg}**.`);
			message.channel.send(`You voted **${vote_msg}**.`);
		}

		global.Game.votes[player_name] = vote;


		let alive_player_count = global.Game.Players.getAlivePlayers().length,
			majority_player_count = Math.ceil(alive_player_count * 2/3),
			total_vote_count = Object.values(global.Game.votes).length,
			isMajorityVote = false;

		console.log("Checking For Early Majority Vote");
		console.log({player_count: alive_player_count, majority_player_count, total_vote_count});

		if (total_vote_count >= majority_player_count) {
			let vote_counts = {};

			for (let voter in global.Game.votes) {
				let vote = global.Game.votes[voter];

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

		if (isMajorityVote || total_vote_count == alive_player_count) {
			global.Game.startTrial(curr_days_passed, message);
			return
		}
    }
};