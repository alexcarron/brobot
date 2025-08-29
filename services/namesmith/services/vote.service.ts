import { InvalidArgumentError } from "../../../utilities/error-utils";
import { logInfo } from "../../../utilities/logging-utils";
import { VoteRepository } from "../repositories/vote.repository";
import { PlayerID } from "../types/player.types";
import { Vote, VoteResolvable } from "../types/vote.types";
import { VoteNotFoundError } from "../utilities/error.utility";
import { isVote } from "../utilities/vote.utility";
import { PlayerService } from "./player.service";

/**
 * Provides access to the dynamic votes data.
 */
export class VoteService {
	/**
	 * Constructs a new VoteService instance.
	 * @param voteRepository - The repository used for accessing votes.
	 * @param playerService - The service used for accessing players.
	 */
	constructor(
		public voteRepository: VoteRepository,
		public playerService: PlayerService
	) {}

	/**
	 * Resolves a vote from the given resolvable.
	 * @param voteResolvable - The vote resolvable to resolve.
	 * @returns The resolved vote.
	 * @throws {Error} If the vote resolvable is invalid.
	 */
	resolveVote(voteResolvable: VoteResolvable): Vote {
		if (isVote(voteResolvable)) {
			const vote = voteResolvable;
			return vote;
		}
		else if (typeof voteResolvable === "string") {
			const voterID = voteResolvable;
			const vote = this.voteRepository.getVoteByVoterID(voterID);

			if (vote === null)
				throw new VoteNotFoundError(voterID);

			return vote;
		}

		throw new InvalidArgumentError(`resolveVote: Invalid vote resolvable: ${voteResolvable}`);
	}

	/**
	 * Adds a new vote to the list of votes.
	 * @param vote - The vote object to add.
	 * @param vote.voterID - The ID of the user who votes.
	 * @param vote.playerVotedForID - The ID of the player voted for.
	 * @returns A promise that resolves with a message indicating the result of the vote.
	 */
	addVote({ voterID, playerVotedForID }: Vote): string {
		if (!voterID || !playerVotedForID)
			throw new InvalidArgumentError("Missing voterID or playerVotedForID");

		const vote = this.voteRepository.getVoteByVoterID(voterID);
		const hasVotedBefore = vote !== null;
		const nameVotingFor = this.playerService.getPublishedName(playerVotedForID);

		if (voterID === playerVotedForID)
			return `You cannot vote for yourself!`;

		if (hasVotedBefore) {
			if (vote.playerVotedForID === playerVotedForID)
				return `You already voted for this name as your favorite!`;

			const oldNameVotingFor = this.playerService.getPublishedName(vote.playerVotedForID);
			this.voteRepository.changeVote({
				voterID,
				playerVotedForID
			});
			return `You have changed your favorite name vote from ${oldNameVotingFor} to ${nameVotingFor}`;
		}

		this.voteRepository.addVote({ voterID, playerVotedForID });
		return `You have voted for ${nameVotingFor} as your favorite name!`;
	}

	logVoteCountPerPlayer() {
		const votes = this.voteRepository.getVotes();

		const voteCountPerPlayer: Record<PlayerID, number> = {};

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
			const publishedName = this.playerService.getPublishedName(playerID);

			logInfo(`${publishedName}: ${voteCount} votes`);
		}
	}

	/**
	 * Finds the player with the most votes and returns their published name.
	 * @returns The ID of the winning player or null if there are are no votes or if there is a tie.
	 */
	getWinningPlayerID(): PlayerID | null {
		const votes = this.voteRepository.getVotes();
		const voteCountPerPlayer: Record<PlayerID, number> = {};

		votes.forEach(vote => {
			const { playerVotedForID } = vote;
			if (voteCountPerPlayer[playerVotedForID]) {
				voteCountPerPlayer[playerVotedForID]++;
			}
			else {
				voteCountPerPlayer[playerVotedForID] = 1;
			}
		});

		let winningPlayerID: PlayerID | null = null;
		let winningVoteCount = 0;

		for (const [playerID, voteCount] of Object.entries(voteCountPerPlayer)) {
			if (voteCount > winningVoteCount) {
				winningPlayerID = playerID;
				winningVoteCount = voteCount;
			}
			else if (voteCount === winningVoteCount) {
				winningPlayerID = null;
			}
		}

		return winningPlayerID
	}

	/**
	 * Resets the vote repository, clearing all stored votes.
	 */
	reset() {
		this.voteRepository.reset();
	}
}