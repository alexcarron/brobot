import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_VOTE_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockVote, mockVotes } from "../mocks/mock-data/mock-votes";
import { createMockVoteRepo } from "../mocks/mock-repositories";
import { Vote } from "../types/vote.types";
import { VoteNotFoundError } from "../utilities/error.utility";
import { VoteRepository } from "./vote.repository";

describe('VoteRepository', () => {
	let db: DatabaseQuerier;
	let voteRepository: VoteRepository;

	let SOME_VOTE: Vote;

	beforeEach(() => {
		voteRepository = createMockVoteRepo();
		db = voteRepository.db;

		SOME_VOTE = addMockVote(db);
	})

	describe('getVotes()', () => {
		it('returns a list of votes', () => {
			const votes = voteRepository.getVotes();
			makeSure(votes).hasLengthOf(mockVotes.length + 1);
			makeSure(votes).contains(SOME_VOTE);
			makeSure(votes).haveProperties('voterID', 'playerVotedFor');
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
				playerVotedFor: "1234567891"
			});
			const vote = voteRepository.getVoteOrThrow("10000001");
			makeSure(vote.voterID).is("10000001");
			makeSure(vote.playerVotedFor.id).is("1234567891");
		});

		it('throws an error if the voter ID already exists', () => {
			expect(() => voteRepository.addVote({
				voter: SOME_VOTE.voterID,
				playerVotedFor: "1234567891",
			})).toThrow();
		});
	});

	describe('updateVote()', () => {
		it('changes the vote of a user', () => {
			const vote = voteRepository.updateVote({
				voter: "1234567890",
				playerVotedFor: "1234567892",
			});

			makeSure(vote.voterID).is("1234567890");
			makeSure(vote.playerVotedFor.id).is("1234567892");

			const resolvedVote = voteRepository.getVoteByVoterID("1234567890");

			makeSure(resolvedVote).is(vote);
		});

		it('throws an error if the voter ID does not exist', () => {
			makeSure(() => voteRepository.updateVote({
				voter: INVALID_VOTE_ID,
				playerVotedFor: "1234567892",
			})).throws(VoteNotFoundError);
		});

		it('throws an error if the player ID does not exist', () => {
			expect(() => voteRepository.updateVote({
				voter: "1234567890",
				playerVotedFor: INVALID_VOTE_ID,
			})).toThrow();
		});
	});

	describe('deleteVote()', () => {
		it('deletes a vote by voterID', () => {
			voteRepository.removeVote("1234567890");
			const result = voteRepository.getVoteByVoterID("1234567890");
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