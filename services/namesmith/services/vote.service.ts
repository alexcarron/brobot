import { logInfo } from "../../../utilities/logging-utils";
import { VoteRepository } from "../repositories/vote.repository";
import { PlayerID } from "../types/player.types";
import { Vote, VoteDefinition, VoteID, VoteResolvable } from "../types/vote.types";
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
		return this.voteRepository.resolveVote(voteResolvable);
	}

	/**
	 * Resolves a vote resolvable to a vote ID.
	 * @param voteResolvable - The vote resolvable to resolve.
	 * @returns The resolved vote ID.
	 * @throws {Error} If the vote resolvable is invalid.
	 */
	resolveID(voteResolvable: VoteResolvable): VoteID {
		return this.voteRepository.resolveID(voteResolvable);
	}

	/**
	 * Adds a new vote to the list of votes.
	 * @param vote - The vote object to add.
	 * @param vote.voter - The user or player who votes.
	 * @param vote.playerVotedFor - The player voted for.
	 * @returns A promise that resolves with a message indicating the result of the vote.
	 */
	addVote({ voter, playerVotedFor }: VoteDefinition): string {
		const voterID = this.playerService.resolveID(voter);
		const vote = this.voteRepository.getVoteByVoterID(voterID);
		const hasVotedBefore = vote !== null;

		const playerVotedForID = this.playerService.resolveID(playerVotedFor);
		const nameVotingFor = this.playerService.getPublishedName(playerVotedForID);

		if (voterID === playerVotedForID)
			return `You cannot vote for yourself!`;

		if (hasVotedBefore) {
			if (vote.playerVotedFor.id === playerVotedForID)
				return `You already voted for this name as your favorite!`;

			const oldNameVotingFor = this.playerService.getPublishedName(vote.playerVotedFor.id);

			this.voteRepository.updateVote({
				voter,
				playerVotedFor,
			});

			return `You have changed your favorite name vote from ${oldNameVotingFor} to ${nameVotingFor}`;
		}

		this.voteRepository.addVote({ voter, playerVotedFor, });
		return `You have voted for ${nameVotingFor} as your favorite name!`;
	}

	logVoteCountPerPlayer() {
		const votes = this.voteRepository.getVotes();

		const voteCountPerPlayer: Record<PlayerID, number> = {};

		votes.forEach(vote => {
			const { playerVotedFor } = vote;
			if (voteCountPerPlayer[playerVotedFor.id]) {
				voteCountPerPlayer[playerVotedFor.id]++;
			}
			else {
				voteCountPerPlayer[playerVotedFor.id] = 1;
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
			const { playerVotedFor } = vote;
			if (voteCountPerPlayer[playerVotedFor.id]) {
				voteCountPerPlayer[playerVotedFor.id]++;
			}
			else {
				voteCountPerPlayer[playerVotedFor.id] = 1;
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
		this.voteRepository.removeVotes();
	}
}