const { createMockDB, addMockVote, addMockPlayer } = require("../database/mock-database");
const VoteRepository = require("./vote.repository");

describe('VoteRepository', () => {
	let mockDB;

	/**
	 * @type {VoteRepository}
	 */
	let voteRepository;

	const mockPlayers = [
		{
			id: "1234567890",
			currentName: "John Doe",
			publishedName: "John Doe",
			tokens: 10,
			role: "magician",
			inventory: "John Doe",
		},
		{
			id: "1234567891",
			currentName: "abcdefgh",
			publishedName: "abcd",
			tokens: 0,
			role: "magician",
			inventory: "abcdefghijklmnopqrstuvwxyz",
		},
		{
			id: "1234567892",
			currentName: "UNPUBLISHED",
			publishedName: null,
			tokens: 0,
			role: "magician",
			inventory: "UNPUBLISHED",
		}
	];

	const mockVotes = [
		{
			voterID: "1234567890",
			playerVotedForID: "1234567891",
		},
		{
			voterID: "1234567891",
			playerVotedForID: "1234567892",
		},
		{
			voterID: "1234567892",
			playerVotedForID: "1234567891",
		},
	];

	beforeEach(() => {
		mockDB = createMockDB();
		voteRepository = new VoteRepository(mockDB);
		for (const player of mockPlayers) {
			addMockPlayer(mockDB, player);
		}
		for (const vote of mockVotes) {
			addMockVote(mockDB, vote);
		}
	})

	describe('getVotes()', () => {
		it('returns a list of votes', async () => {
			const result = await voteRepository.getVotes();
			expect(result).toEqual(mockVotes);
		});
	});

	describe('getVoteByVoterID()', () => {
		it('returns a vote by voterID', async () => {
			const result = await voteRepository.getVoteByVoterID("1234567890");
			expect(result).toEqual(mockVotes[0]);
		});

		it('returns undefined if no vote is found', async () => {
			const result = await voteRepository.getVoteByVoterID("invalid-id");
			expect(result).toBeUndefined();
		});
	});

	describe('getVotesByVotedForID()', () => {
		it('returns a list of votes by votedForID', async () => {
			const result = await voteRepository.getVotesByVotedForID("1234567891");
			expect(result).toEqual([mockVotes[0], mockVotes[2]]);
		});

		it('returns an empty list if no votes are found', async () => {
			const result = await voteRepository.getVotesByVotedForID("invalid-id");
			expect(result).toEqual([]);
		});
	});

	describe('addVote()', () => {
		it('adds a new vote', async () => {
			await voteRepository.addVote({
				voterID: "new-id",
				playerVotedForID: "1234567891"
			});
			const result = await voteRepository.getVoteByVoterID("new-id");
			expect(result).toEqual({
				voterID: "new-id",
				playerVotedForID: "1234567891",
			});
		});

		it('throws an error if voterID or playerVotedForID is missing', async () => {
			await expect(voteRepository.addVote({})).rejects.toThrow();
			await expect(voteRepository.addVote({
				voterID: "new-id",
			})).rejects.toThrow();
			await expect(voteRepository.addVote({
				playerVotedForID: "1234567891",
			})).rejects.toThrow();
		});

		it('throws an error if the voter ID already exists', async () => {
			await expect(voteRepository.addVote({
				voterID: mockVotes[0].voterID,
				playerVotedForID: "1234567891",
			})).rejects.toThrow();
		});
	});

	describe('changeVote()', () => {
		it('changes the vote of a user', async () => {
			await voteRepository.changeVote({
				voterID: "1234567890",
				playerVotedForID: "1234567892",
			});

			const result = await voteRepository.getVoteByVoterID("1234567890");

			expect(result).toEqual({
				voterID: "1234567890",
				playerVotedForID: "1234567892",
			});
		});

		it('throws an error if the voter ID does not exist', async () => {
			await expect(voteRepository.changeVote({
				voterID: "invalid-id",
				playerVotedForID: "1234567892",
			})).rejects.toThrow();
		});

		it('throws an error if the player ID does not exist', async () => {
			await expect(voteRepository.changeVote({
				voterID: "1234567890",
				playerVotedForID: "invalid-id",
			})).rejects.toThrow();
		});

		it('throws an error if the voter ID and player ID are not specified', async () => {
			await expect(voteRepository.changeVote({})).rejects.toThrow();
			await expect(voteRepository.changeVote({
				voterID: "1234567890",
			})).rejects.toThrow();
			await expect(voteRepository.changeVote({
				playerVotedForID: "1234567891",
			})).rejects.toThrow();
		});
	});

	describe('deleteVote()', () => {
		it('deletes a vote by voterID', async () => {
			await voteRepository.deleteVote("1234567890");
			const result = await voteRepository.getVoteByVoterID("1234567890");
			expect(result).toBeUndefined();
		});

		it('throws an error if the voter ID does not exist', async () => {
			await expect(voteRepository.deleteVote("invalid-id")).rejects.toThrow();
		});
	});

	describe('reset()', () => {
		it('resets the vote repository', async () => {
			await voteRepository.reset();
			const result = await voteRepository.getVotes();
			expect(result).toEqual([]);
		});
	});
})