const { logInfo } = require("../../../utilities/logging-utils");
const VoteRepository = require("../repositories/vote.repository");
const PlayerService = require("./player.service");

/**
 * Provides access to the dynamic votes data.
 */
class VoteService {
	/**
	 * Constructs a new VoteService instance.
	 * @param {VoteRepository} voteRepository - The repository used for accessing votes.
	 * @param {PlayerService} playerService - The service used for accessing players.
	 */
	constructor(voteRepository, playerService) {
		this.voteRepository = voteRepository;
		this.playerService = playerService;
	}

	/**
	 * Adds a new vote to the list of votes.
	 * @param {{ voterID: string, playerVotedForID: string }} vote - The vote object to add.
	 * @returns {Promise<string>} A promise that resolves with a message indicating the result of the vote.
	 */
	async addVote({ voterID, playerVotedForID }) {
		if (!voterID && !playerVotedForID)
			throw new Error("Missing voterID and playerVotedForID");

		const votes = await this.voteRepository.getVotes();
		const existingVote = votes.find(vote => vote.voterID === voterID);

		const nameVotingFor = await this.playerService.getPublishedName(playerVotedForID);


		if (existingVote) {
			if (existingVote.playerVotedForID === playerVotedForID)
				throw new Error("You already voted for this name as your favorite!");

			const oldNameVotingFor = await this.playerService.getPublishedName(existingVote.playerVotedForID);
			await this.voteRepository.changeVote({ voterID, playerVotedForID });
			return `You have changed your favorite name vote from ${oldNameVotingFor} to ${nameVotingFor}`;
		}

		await this.voteRepository.addVote({ voterID, playerVotedForID });
		return `You have voted for ${nameVotingFor} as your favorite name!`;
	}

	async logVoteCountPerPlayer() {
		const votes = await this.voteRepository.getVotes();

		const voteCountPerPlayer = {};

		votes.forEach(vote => {
			const { playerVotedForID } = vote;
			if (voteCountPerPlayer[playerVotedForID]) {
				voteCountPerPlayer[playerVotedForID]++;
			}
			else {
				voteCountPerPlayer[playerVotedForID] = 1;
			}
		});

		for (const [playerID, voteCount] of Object.entries(voteCountPerPlayer)) {
			const publishedName = await this.playerService.getPublishedName(playerID);

			logInfo(`${publishedName}: ${voteCount} votes`);
		}
	}

	/**
	 * Finds the player with the most votes and returns their published name.
	 * @returns {Promise<string>} A promise that resolves with the ID of the winning player.
	 */
	async getWinningPlayerID() {
		const votes = await this.voteRepository.getVotes();
		const voteCountPerPlayer = {};

		votes.forEach(vote => {
			const { playerVotedForID } = vote;
			if (voteCountPerPlayer[playerVotedForID]) {
				voteCountPerPlayer[playerVotedForID]++;
			}
			else {
				voteCountPerPlayer[playerVotedForID] = 1;
			}
		});

		let winningPlayerID = null;
		let winningVoteCount = 0;

		for (const [playerID, voteCount] of Object.entries(voteCountPerPlayer)) {
			if (voteCount > winningVoteCount) {
				winningPlayerID = playerID;
				winningVoteCount = voteCount;
			}
		}

		return winningPlayerID
	}

	/**
	 * Resets the vote repository, clearing all stored votes.
	 * @returns {Promise<void>} A promise that resolves once the repository is reset.
	 */
	async reset() {
		await this.voteRepository.reset();
	}
}

module.exports = VoteService;