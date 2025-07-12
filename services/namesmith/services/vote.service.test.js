const { mockPlayers, mockVotes } = require("../repositories/mock-repositories");
const VoteRepository = require("../repositories/vote.repository");
const { createMockVoteService } = require("./mock-services");
const PlayerService = require("./player.service");
const VoteService = require("./vote.service");

describe('VoteService', () => {
	/**
	 * @type {VoteService}
	 */
	let voteService;

	beforeEach(() => {
		voteService = createMockVoteService();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	})

	describe('constructor', () => {
		it('should create a new VoteService instance', () => {
			expect(voteService).toBeInstanceOf(VoteService);
			expect(voteService.voteRepository).toBeInstanceOf(VoteRepository);
			expect(voteService.playerService).toBeInstanceOf(PlayerService);
		});
	});


	describe('.resolveVote()', () => {
		it('should resolve a vote object to a vote object', async () => {
			const vote = voteService.voteRepository.getVotes()[0];

			const resolvedVote = await voteService.resolveVote(vote);

			expect(resolvedVote).toEqual(vote);
		});

		it('should resolve a vote ID to a vote object', async () => {
			const vote = voteService.voteRepository.getVotes()[0];
			const voteID = vote.voterID;

			const resolvedVote = await voteService.resolveVote(voteID);

			expect(resolvedVote).toEqual(vote);
		});

		it('should throw an error if the vote resolvable is invalid', () => {
			expect(() => voteService.resolveVote(-999)).toThrow();
			expect(() => voteService.resolveVote('invalid')).toThrow();
			expect(() => voteService.resolveVote({})).toThrow();
			expect(() => voteService.resolveVote()).toThrow();
		});
	});

	describe('.addVote()', () => {
		it('should add a new vote', async () => {
			const message = await voteService.addVote({
				voterID: mockPlayers[3].id,
				playerVotedForID: mockPlayers[1].id
			});

			const votes = await voteService.voteRepository.getVotes();

			expect(votes.length).toBe(mockVotes.length + 1);
			expect(votes).toContainEqual({
				voterID: mockPlayers[0].id,
				playerVotedForID: mockPlayers[1].id
			})
			expect(message).toBe(`You have voted for ${mockPlayers[1].publishedName} as your favorite name!`);
		});

		it('should not add a new vote when they have already voted that person', async () => {
			const message = await voteService.addVote({
				voterID: mockVotes[0].voterID,
				playerVotedForID: mockVotes[0].playerVotedForID
			});

			const votes = await voteService.voteRepository.getVotes();

			expect(votes.length).toBe(mockVotes.length);
			expect(message).toBe(`You already voted for this name as your favorite!`);
		});

		it('should change their vote when they have already voted a different person', async () => {
			const message = await voteService.addVote({
				voterID: mockVotes[0].voterID,
				playerVotedForID: mockPlayers[3].id
			});

			const votes = await voteService.voteRepository.getVotes();

			expect(votes.length).toBe(mockVotes.length);
			expect(votes).toContainEqual({
				voterID: mockPlayers[0].id,
				playerVotedForID: mockPlayers[3].id
			});
			expect(message).toBe(`You have changed your favorite name vote from ${mockPlayers[1].publishedName} to ${mockPlayers[3].publishedName}`);
		});

		it('should throw an error if voterID is not given', async () => {
			await expect(voteService.addVote({
				playerVotedForID: mockPlayers[3].id
			})).rejects.toThrow("Missing voterID or playerVotedForID");
		});

		it('should throw an error if playerVotedForID is not given', async () => {
			await expect(voteService.addVote({
				voterID: mockPlayers[3].id
			})).rejects.toThrow("Missing voterID or playerVotedForID");
		});
	});

	describe('.getWinningPlayerID()', () => {
		it('should return the ID of the player with the most votes', async () => {
			const winningPlayerID = await voteService.getWinningPlayerID();

			expect(winningPlayerID).toBe(mockPlayers[1].id);
		});

		it('should return the ID of the player with the most votes when votes change', async () => {
			await voteService.addVote({
				voterID: mockPlayers[0].id,
				playerVotedForID: mockPlayers[3].id
			});
			await voteService.addVote({
				voterID: mockPlayers[1].id,
				playerVotedForID: mockPlayers[3].id
			});
			await voteService.addVote({
				voterID: mockPlayers[2].id,
				playerVotedForID: mockPlayers[3].id
			});

			const winningPlayerID = await voteService.getWinningPlayerID();
			expect(winningPlayerID).toBe(mockPlayers[3].id);
		});

		it('should not return anything when there is a tie', async () => {
			await voteService.addVote({
				voterID: mockPlayers[3].id,
				playerVotedForID: mockPlayers[2].id
			});

			const winningPlayerID = await voteService.getWinningPlayerID();
			expect(winningPlayerID).toBe(null);
		});

		it('should not return anything when there are no votes', async () => {
			await voteService.reset();

			const winningPlayerID = await voteService.getWinningPlayerID();
			expect(winningPlayerID).toBe(null);
		});
	});

	describe('.reset()', () => {
		it('should reset the votes', async () => {
			await voteService.addVote({
				voterID: mockPlayers[3].id,
				playerVotedForID: mockPlayers[2].id
			});

			await voteService.reset();

			const votes = await voteService.voteRepository.getVotes();
			expect(votes.length).toBe(0);
		});
	});
});