import { INVALID_VOTE_ID } from "../constants/test.constants";
import { mockVotes } from "../mocks/mock-data/mock-votes";
import { createMockVoteRepo } from "../mocks/mock-repositories";
import { VoteRepository } from "./vote.repository";

describe('VoteRepository', () => {
	let voteRepository: VoteRepository;

	beforeEach(() => {
		voteRepository = createMockVoteRepo();
	})

	describe('getVotes()', () => {
		it('returns a list of votes', () => {
			const result = voteRepository.getVotes();
			expect(result).toEqual(mockVotes);
		});
	});

	describe('getVoteByVoterID()', () => {
		it('returns a vote by voterID', () => {
			const result = voteRepository.getVoteByVoterID("1234567890");
			expect(result).toEqual(mockVotes[0]);
		});

		it('returns null if no vote is found', () => {
			const result = voteRepository.getVoteByVoterID(INVALID_VOTE_ID);
			expect(result).toBeNull();
		});
	});

	describe('getVotesByVotedForID()', () => {
		it('returns a list of votes by votedForID', () => {
			const result = voteRepository.getVotesByVotedForID("1234567891");
			expect(result).toEqual([mockVotes[0], mockVotes[2]]);
		});

		it('returns an empty list if no votes are found', () => {
			const result = voteRepository.getVotesByVotedForID(INVALID_VOTE_ID);
			expect(result).toEqual([]);
		});
	});

	describe('.doesVoteExist()', () => {
		it('returns true if the vote exists with given voterID and playerVotedForID', () => {
			const result = voteRepository.doesVoteExist({
				voterID: mockVotes[0].voterID,
				playerVotedForID: mockVotes[0].playerVotedForID
			});
			expect(result).toBe(true);
		});

		it('returns false if the vote exists with given voterID but not playerVotedForID', () => {
			const result = voteRepository.doesVoteExist({
				voterID: mockVotes[0].voterID,
				playerVotedForID: INVALID_VOTE_ID
			});
			expect(result).toBe(false);
		});

		it('returns false if the vote exists with given playerVotedForID but not voterID', () => {
			const result = voteRepository.doesVoteExist({
				voterID: INVALID_VOTE_ID,
				playerVotedForID: mockVotes[0].playerVotedForID
			});
			expect(result).toBe(false);
		});

		it('returns true if the vote exists with given voterID', () => {
			const result = voteRepository.doesVoteExist({
				voterID: mockVotes[0].voterID,
			});
			expect(result).toBe(true);
		});

		it('returns false if the vote does not exist with given voterID', () => {
			const result = voteRepository.doesVoteExist({
				voterID: INVALID_VOTE_ID,
			});
			expect(result).toBe(false);
		});

		it('returns true if the vote exists with given playerVotedForID', () => {
			const result = voteRepository.doesVoteExist({
				playerVotedForID: mockVotes[0].playerVotedForID,
			});
			expect(result).toBe(true);
		});

		it('returns false if the vote does not exist with given playerVotedForID', async () => {
			const result = await voteRepository.doesVoteExist({
				playerVotedForID: INVALID_VOTE_ID,
			});
			expect(result).toBe(false);
		});
	})

	describe('addVote()', () => {
		it('adds a new vote', () => {
			voteRepository.addVote({
				voterID: "new-id",
				playerVotedForID: "1234567891"
			});
			const result = voteRepository.getVoteByVoterID("new-id");
			expect(result).toEqual({
				voterID: "new-id",
				playerVotedForID: "1234567891",
			});
		});

		it('throws an error if the voter ID already exists', () => {
			expect(() => voteRepository.addVote({
				voterID: mockVotes[0].voterID,
				playerVotedForID: "1234567891",
			})).toThrow();
		});
	});

	describe('changeVote()', () => {
		it('changes the vote of a user', () => {
			voteRepository.changeVote({
				voterID: "1234567890",
				playerVotedForID: "1234567892",
			});

			const result = voteRepository.getVoteByVoterID("1234567890");

			expect(result).toEqual({
				voterID: "1234567890",
				playerVotedForID: "1234567892",
			});
		});

		it('throws an error if the voter ID does not exist', () => {
			expect(() => voteRepository.changeVote({
				voterID: INVALID_VOTE_ID,
				playerVotedForID: "1234567892",
			})).toThrow();
		});

		it('throws an error if the player ID does not exist', () => {
			expect(() => voteRepository.changeVote({
				voterID: "1234567890",
				playerVotedForID: INVALID_VOTE_ID,
			})).toThrow();
		});
	});

	describe('deleteVote()', () => {
		it('deletes a vote by voterID', () => {
			voteRepository.deleteVote("1234567890");
			const result = voteRepository.getVoteByVoterID("1234567890");
			expect(result).toBeNull();
		});

		it('throws an error if the voter ID does not exist', () => {
			expect(() => voteRepository.deleteVote(INVALID_VOTE_ID)).toThrow();
		});
	});

	describe('reset()', () => {
		it('resets the vote repository', () => {
			voteRepository.reset();
			const result = voteRepository.getVotes();
			expect(result).toEqual([]);
		});
	});
})