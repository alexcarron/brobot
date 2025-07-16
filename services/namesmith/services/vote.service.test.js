const { makeSure } = require("../../../utilities/jest-utils");
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
			makeSure(voteService).isAnInstanceOf(VoteService);
			makeSure(voteService.voteRepository).isAnInstanceOf(VoteRepository);
			makeSure(voteService.playerService).isAnInstanceOf(PlayerService);
		});
	});

	describe('.resolveVote()', () => {
		it('should resolve a vote object to a vote object', () => {
			const vote = voteService.voteRepository.getVotes()[0];

			const resolvedVote = voteService.resolveVote(vote);

			makeSure(resolvedVote).is(vote);
		});

		it('should resolve a vote ID to a vote object', () => {
			const vote = voteService.voteRepository.getVotes()[0];
			const voteID = vote.voterID;

			const resolvedVote = voteService.resolveVote(voteID);

			makeSure(resolvedVote).is(vote);
		});

		it('should throw an error if the vote resolvable is invalid', () => {
			makeSure(() => voteService.resolveVote(-999)).throwsAnError();
			makeSure(() => voteService.resolveVote('invalid')).throwsAnError();
			makeSure(() => voteService.resolveVote({})).throwsAnError();
			makeSure(() => voteService.resolveVote()).throwsAnError();
		});
	});

	describe('.addVote()', () => {
		it('should add a new vote', async () => {
			const message = await voteService.addVote({
				voterID: mockPlayers[3].id,
				playerVotedForID: mockPlayers[1].id
			});

			const votes = voteService.voteRepository.getVotes();

			makeSure(votes).hasLengthOf(mockVotes.length + 1);
			makeSure(votes).contains({
				voterID: mockPlayers[0].id,
				playerVotedForID: mockPlayers[1].id
			})
			makeSure(message).is(`You have voted for ${mockPlayers[1].publishedName} as your favorite name!`);
		});

		it('should not add a new vote when they have already voted that person', async () => {
			const message = await voteService.addVote({
				voterID: mockVotes[0].voterID,
				playerVotedForID: mockVotes[0].playerVotedForID
			});

			const votes = voteService.voteRepository.getVotes();

			makeSure(votes).hasLengthOf(mockVotes.length);
			makeSure(message).is(`You already voted for this name as your favorite!`);
		});

		it('should change their vote when they have already voted a different person', async () => {
			const message = await voteService.addVote({
				voterID: mockVotes[0].voterID,
				playerVotedForID: mockPlayers[3].id
			});

			const votes = voteService.voteRepository.getVotes();

			makeSure(votes).hasLengthOf(mockVotes.length);
			makeSure(votes).contains({
				voterID: mockPlayers[0].id,
				playerVotedForID: mockPlayers[3].id
			});
			makeSure(message).is(`You have changed your favorite name vote from ${mockPlayers[1].publishedName} to ${mockPlayers[3].publishedName}`);
		});

		it('should throw an error if voterID is not given', async () => {
			await makeSure(
				voteService.addVote({
					playerVotedForID: mockPlayers[3].id
				})
			).eventuallyThrowsAnErrorWith(
				"Missing voterID or playerVotedForID"
			);
		});

		it('should throw an error if playerVotedForID is not given', async () => {
			await makeSure(
				voteService.addVote({
					voterID: mockPlayers[3].id
				})
			).eventuallyThrowsAnErrorWith("Missing voterID or playerVotedForID");
		});
	});

	describe('.getWinningPlayerID()', () => {
		it('should return the ID of the player with the most votes', async () => {
			const winningPlayerID = await voteService.getWinningPlayerID();

			makeSure(winningPlayerID).is(mockPlayers[1].id);
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
			makeSure(winningPlayerID).is(mockPlayers[3].id);
		});

		it('should not return anything when there is a tie', async () => {
			await voteService.addVote({
				voterID: mockPlayers[3].id,
				playerVotedForID: mockPlayers[2].id
			});

			const winningPlayerID = await voteService.getWinningPlayerID();
			makeSure(winningPlayerID).is(null);
		});

		it('should not return anything when there are no votes', async () => {
			await voteService.reset();

			const winningPlayerID = await voteService.getWinningPlayerID();
			makeSure(winningPlayerID).is(null);
		});
	});

	describe('.reset()', () => {
		it('should reset the votes', async () => {
			await voteService.addVote({
				voterID: mockPlayers[3].id,
				playerVotedForID: mockPlayers[2].id
			});

			await voteService.reset();

			const votes = voteService.voteRepository.getVotes();
			makeSure(votes).isEmpty(0);
		});
	});
});