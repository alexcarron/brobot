import { makeSure } from "../../../utilities/jest/jest-utils";
import { mockPlayers, mockVotes } from "../repositories/mock-repositories";
import { VoteRepository } from "../repositories/vote.repository";
import { createMockVoteService } from "./mock-services";
import { PlayerService } from "./player.service";
import { VoteService } from "./vote.service";

describe('VoteService', () => {
	let voteService: VoteService;

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
			makeSure(() => voteService.resolveVote('invalid')).throwsAnError();
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
			makeSure(votes).isEmpty();
		});
	});
});