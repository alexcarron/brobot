const { toTitleCase } = require("../../utilities/text-formatting-utils");

class VoteManager {
	constructor(game_manager) {
		this.game_manager = game_manager;
	}

	get votes() {
		return this.game_manager.votes;
	}
	set votes(votes) {
		this.game_manager.votes = votes;
	}

	get trial_votes() {
		return this.game_manager.trial_votes;
	}
	set trial_votes(trial_votes) {
		this.game_manager.trial_votes = trial_votes;
	}


	/**
	 * Determines if a player can vote a certain player
	 * @param {Player} player_voting
	 * @param {Player} player_voting_for
	 * @returns {true | String} true if you can vote that player. Otherwise, feedback for why you can't
	 */
	canPlayerVotePlayer(player_voting, player_voting_for) {
		if (!this.game_manager.state_manager.isInVotingPhase()) {
			return `We're not in the voting phase yet.`;
		}

		if (player_voting.name === player_voting_for) {
			return `You can't vote for yourself!`;
		}

		if (!player_voting_for.canVote) {
			return `Sorry, you have been prevented from voting.`;
		}

		return true;
	}

	/**
	 * Adds a player vote for a player to the game votes
	 * @param {Player} player_voting
	 * @param {Player} player_voting_for
	 * @returns {string} The feedback the player recieves for that vote
	 */
	addVoteForPlayer(player_voting, player_voting_for) {
		player_voting.resetInactivity();

		let curr_votes = this.votes;
		let max_voters_count = this.game_manager.player_manager.getAlivePlayers().filter(player => player.canVote === true).length;
		let feedback;

		if (curr_votes[player_voting.name]) {
			this.game_manager.logger.log(`**${player_voting.name}** changed their vote to **${player_voting_for.name}**`);

			this.game_manager.announceMessages(`**${player_voting.name}** changed their vote to **${player_voting_for.name}**`);

			feedback = `You are replacing your previous vote, **${curr_votes[this.name]}**, with **${player_voting_for.name}**`;
		}
		else {
			this.game_manager.logger.log(`**${this.name}** voted **${player_voting_for.name}**.`);

			this.game_manager.announceMessages(`**${this.name}** voted **${player_voting_for.name}**.`);

			feedback = `You voted **${player_voting_for.name}**.`;
		}

		curr_votes[this.name] = player_voting_for.name;
		this.votes = curr_votes;

		if (!this.game_manager.isMockGame) {
			const isMajorityVote = VoteManager.isMajorityVote(curr_votes, max_voters_count);
			const num_votes = Object.values(curr_votes).length;

			if (isMajorityVote || num_votes >= max_voters_count) {
				this.game_manager.startTrial();
			}
		}

		return feedback;
	}

	/**
	 * Determines if a player can vote for a certain trial outcome
	 * @param {Player} player_voting
	 * @param {String} trial_outcome
	 * @returns {true | String} true if you can vote. Otherwise, feedback for why you can't
	 */
	canVoteForTrialOutcome(player_voting, trial_outcome) {
		if (!this.game_manager.state_manager.isInTrialPhase()) {
			return `We're not in the trial phase yet.`;
		}

		if (this.game_manager.on_trial === player_voting.name) {
			return `You can't vote for your own trial.`;
		}

		if (!this.canVote) {
			return `Sorry, you have been prevented from voting.`;
		}

		return true;
	}

	/**
	 * Votes for a trial outcome for the current trial, updating votes, announcing it, and returning feedback
	 * @param {TrialVotes} trial_outcome
	 * @returns {String} feedback for vote
	 */
	addVoteForTrialOutcome(player_voting, trial_outcome) {
		let curr_votes = this.game_manager.trial_votes;
		let max_voters_count = this.game_manager.player_manager.getAlivePlayers().filter(
			player => player.name !== this.game_manager.on_trial && player.canVote === true
		).length;
		let feedback;

		player_voting.resetInactivity();

		if (curr_votes[player_voting.name]) {
			this.game_manager.logger.log(`**${player_voting.name}** changed their vote to **${toTitleCase(trial_outcome)}**`);

			this.game_manager.announceMessages(`**${player_voting.name}** changed their vote.`);

			feedback = `You are replacing your previous vote, **${toTitleCase(curr_votes[player_voting.name])}**, with **${toTitleCase(trial_outcome)}**`;
		}
		else {
			this.game_manager.logger.log(`**${player_voting.name}** voted **${toTitleCase(trial_outcome)}**.`);

			this.game_manager.announceMessages(`**${player_voting.name}** voted.`);

			feedback = `You voted **${toTitleCase(trial_outcome)}**.`;
		}

		curr_votes[player_voting.name] = trial_outcome;
		this.trial_votes = curr_votes;

		if (!this.game_manager.isMockGame) {
			const isMajorityVote = VoteManager.isMajorityVote(curr_votes, max_voters_count);
			const num_votes = Object.values(curr_votes).length;

			if (isMajorityVote || num_votes >= max_voters_count) {
				this.game_manager.startTrialResults();
			}
		}

		return feedback;
	}



	/**
	 * Determines if a majority vote has been reached for a specific vote
	 * @param {{[player_name: string]: [vote: string]}} player_votes an object which maps a player name to their vote
	 * @param {Number} num_max_voters the maximum number of possible voters
	 */
	static isMajorityVote(player_votes, num_max_voters) {
		let isMajorityVote = false;

		const total_vote_count = Object.keys(player_votes).length;
		const majority_player_count = Math.ceil(
			(num_max_voters) * Player.MAJORITY_VOTE_RATIO
		);

		if (total_vote_count >= majority_player_count) {
			let vote_counts = {};

			for (let voter in player_votes) {
				let vote = player_votes[voter];

				if (
					vote.toLowerCase() == TrialVotes.Abstain.toLowerCase() ||
					vote.toLowerCase() == Votes.Abstain.toLowerCase()
				)
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

		return isMajorityVote;
	}
}

module.exports = VoteManager;