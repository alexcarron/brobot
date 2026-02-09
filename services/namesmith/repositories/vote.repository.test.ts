import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_VOTE_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { addMockVote } from "../mocks/mock-data/mock-votes";
import { Player } from "../types/player.types";
import { Vote } from "../types/vote.types";
import { PlayerNotFoundError, VoteNotFoundError } from "../utilities/error.utility";
import { VoteRepository } from "./vote.repository";

describe('VoteRepository', () => {
	let db: DatabaseQuerier;
	let voteRepository: VoteRepository;

	let SOME_VOTE: Vote;
	let SOME_PLAYER: Player;
	let SOME_OTHER_PLAYER: Player;
	let SOME_THIRD_PLAYER: Player;
	let SOME_FOURTH_PLAYER: Player;

	beforeEach(() => {
		voteRepository = VoteRepository.asMock();
		db = voteRepository.db;

		SOME_VOTE = addMockVote(db);
		SOME_PLAYER = addMockPlayer(db);
		SOME_OTHER_PLAYER = addMockPlayer(db);
		SOME_THIRD_PLAYER = addMockPlayer(db);
		SOME_FOURTH_PLAYER = addMockPlayer(db);
	})

	describe('getVotes()', () => {
		it('returns a list of votes', () => {
			const votes = voteRepository.getVotes();
			makeSure(votes).contains(SOME_VOTE);
			makeSure(votes).haveOnlyProperties('voterID', 'votedFirstPlayer', 'votedSecondPlayer', 'votedThirdPlayer');
		});
	});

	describe('getVoteByVoterID()', () => {
		it('returns a vote by voterID', () => {
			const vote = voteRepository.getVoteByVoterID(SOME_VOTE.voterID);
			makeSure(vote).is(SOME_VOTE);
		});

		it('returns null if no vote is found', () => {
			const vote = voteRepository.getVoteByVoterID(INVALID_VOTE_ID);
			makeSure(vote).isNull();
		});
	});

	describe('.doesVoteExist()', () => {

		it('returns true if the vote exists with given voterID', () => {
			const result = voteRepository.doesVoteExist(SOME_VOTE.voterID);
			expect(result).toBe(true);
		});

		it('returns false if the vote does not exist with given voterID', () => {
			const result = voteRepository.doesVoteExist(INVALID_VOTE_ID);
			expect(result).toBe(false);
		});
	})

	describe('addVote()', () => {
		it('adds a new vote', () => {
			voteRepository.addVote({
				voter: "10000001",
				votedFirstPlayer: SOME_PLAYER.id,
				votedSecondPlayer: SOME_OTHER_PLAYER.id,
				votedThirdPlayer: SOME_THIRD_PLAYER.id,
			});
			const vote = voteRepository.getVoteOrThrow("10000001");
			makeSure(vote.voterID).is("10000001");
			makeSure(vote.votedFirstPlayer!.id).is(SOME_PLAYER.id);
			makeSure(vote.votedSecondPlayer!.id).is(SOME_OTHER_PLAYER.id);
			makeSure(vote.votedThirdPlayer!.id).is(SOME_THIRD_PLAYER.id);
		});

		it('adds a new vote with no votes', () => {
			voteRepository.addVote({
				voter: "10000001",
			});
			const vote = voteRepository.getVoteOrThrow("10000001");
			makeSure(vote.voterID).is("10000001");
			makeSure(vote.votedFirstPlayer).isNull();
			makeSure(vote.votedSecondPlayer).isNull();
			makeSure(vote.votedThirdPlayer).isNull();
		});

		it('adds a new vote with some null votes', () => {
			voteRepository.addVote({
				voter: "10000001",
				votedFirstPlayer: null,
				votedSecondPlayer: SOME_OTHER_PLAYER.id,
				votedThirdPlayer: null,
			});
			const vote = voteRepository.getVoteOrThrow("10000001");
			makeSure(vote.voterID).is("10000001");
			makeSure(vote.votedFirstPlayer).isNull();
			makeSure(vote.votedSecondPlayer!.id).is(SOME_OTHER_PLAYER.id);
			makeSure(vote.votedThirdPlayer).isNull();
		});

		it('throws an error if the voter ID already exists', () => {
			const existingVote = addMockVote(db);

			expect(() => voteRepository.addVote({
				voter: existingVote.voterID,
				votedFirstPlayer: SOME_OTHER_PLAYER.id,
			})).toThrow();
		});
	});

	describe('updateVote()', () => {
		it('changes the vote of a user', () => {
			voteRepository.addVote({
				voter: SOME_PLAYER.id,
				votedFirstPlayer: SOME_OTHER_PLAYER.id,
				votedSecondPlayer: SOME_THIRD_PLAYER.id,
				votedThirdPlayer: SOME_FOURTH_PLAYER,
			})

			const vote = voteRepository.updateVote({
				voter: SOME_PLAYER.id,
				votedFirstPlayer: SOME_THIRD_PLAYER.id,
				votedSecondPlayer: SOME_OTHER_PLAYER.id,
				votedThirdPlayer: SOME_THIRD_PLAYER,
			});

			makeSure(vote.voterID).is(SOME_PLAYER.id);
			makeSure(vote.votedFirstPlayer!.id).is(SOME_THIRD_PLAYER.id);
			makeSure(vote.votedSecondPlayer!.id).is(SOME_OTHER_PLAYER.id);
			makeSure(vote.votedThirdPlayer!.id).is(SOME_THIRD_PLAYER.id);

			const resolvedVote = voteRepository.getVoteByVoterID(SOME_PLAYER.id);

			makeSure(resolvedVote).is(vote);
		});

		it('can change votes to null', () => {
			voteRepository.addVote({
				voter: SOME_PLAYER.id,
				votedFirstPlayer: SOME_OTHER_PLAYER.id,
				votedSecondPlayer: SOME_THIRD_PLAYER.id,
				votedThirdPlayer: SOME_FOURTH_PLAYER,
			})

			const vote = voteRepository.updateVote({
				voter: SOME_PLAYER.id,
				votedFirstPlayer: null,
				votedSecondPlayer: null,
				votedThirdPlayer: null,
			});

			makeSure(vote.votedFirstPlayer).isNull();
			makeSure(vote.votedSecondPlayer).isNull();
			makeSure(vote.votedThirdPlayer).isNull();

			const resolvedVote = voteRepository.getVoteByVoterID(SOME_PLAYER.id);

			makeSure(resolvedVote).is(vote);
		});

		it('throws an error if the voter ID does not exist', () => {
			makeSure(() => voteRepository.updateVote({
				voter: INVALID_VOTE_ID,
				votedFirstPlayer: SOME_OTHER_PLAYER.id,
			})).throws(VoteNotFoundError);
		});

		it('throws an error if the player ID does not exist', () => {
			voteRepository.addVote({
				voter: SOME_PLAYER.id,
				votedFirstPlayer: SOME_OTHER_PLAYER.id
			})
			
			makeSure(() => voteRepository.updateVote({
				voter: SOME_PLAYER.id,
				votedFirstPlayer: INVALID_VOTE_ID,
			})).throws(PlayerNotFoundError);
		});
	});

	describe('deleteVote()', () => {
		it('deletes a vote by voterID', () => {
			voteRepository.addVote({
				voter: SOME_PLAYER.id,
				votedFirstPlayer: SOME_OTHER_PLAYER.id
			});
			voteRepository.removeVote(SOME_PLAYER.id);
			const result = voteRepository.getVoteByVoterID(SOME_PLAYER.id);
			expect(result).toBeNull();
		});

		it('throws an error if the voter ID does not exist', () => {
			expect(() => voteRepository.removeVote(INVALID_VOTE_ID)).toThrow();
		});
	});

	describe('reset()', () => {
		it('resets the vote repository', () => {
			voteRepository.removeVotes();
			const result = voteRepository.getVotes();
			expect(result).toEqual([]);
		});
	});
})