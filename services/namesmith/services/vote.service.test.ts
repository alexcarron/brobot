import { makeSure } from "../../../utilities/jest/jest-utils";
import { VoteRepository } from "../repositories/vote.repository";
import { createMockVoteService } from "../mocks/mock-services";
import { PlayerService } from "./player.service";
import { VoteService } from "./vote.service";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { mockVotes } from "../mocks/mock-data/mock-votes";
import { mockPlayers } from "../mocks/mock-data/mock-players";
import { Vote } from "../types/vote.types";

describe('VoteService', () => {
	let voteService: VoteService;

	let SOME_VOTE: Vote;

	beforeEach(() => {
		voteService = createMockVoteService();

		SOME_VOTE = voteService.voteRepository.getVotes()[0];
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

		it('resolves the current vote object from an outdated vote object', () => {
			const OUTDATED_VOTE = {
				...SOME_VOTE,
				playerVotedFor: INVALID_PLAYER_ID
			};

			const resolvedVote = voteService.resolveVote(OUTDATED_VOTE);

			makeSure(resolvedVote).is(SOME_VOTE);
		});

		it('should throw an error if the vote resolvable is invalid', () => {
			makeSure(() => voteService.resolveVote('invalid')).throwsAnError();
		});
	});

	describe('.addVote()', () => {
		it('should add a new vote', () => {
			const message = voteService.addVote({
				voter: mockPlayers[3].id,
				playerVotedFor: mockPlayers[1].id
			});

			const votes = voteService.voteRepository.getVotes();

			makeSure(votes).hasLengthOf(mockVotes.length + 1);
			makeSure(votes).hasAnItemWhere( vote => {
				return (
					vote.voterID === mockPlayers[3].id &&
					vote.playerVotedFor.id === mockPlayers[1].id
				)
			})
			makeSure(message).is(`You have voted for ${mockPlayers[1].publishedName} as your favorite name!`);
		});

		it('should not add a new vote when they have already voted that person', () => {
			const message = voteService.addVote({
				voter: mockVotes[0].voter,
				playerVotedFor: mockVotes[0].playerVotedFor
			});

			const votes = voteService.voteRepository.getVotes();

			makeSure(votes).hasLengthOf(mockVotes.length);
			makeSure(message).is(`You already voted for this name as your favorite!`);
		});

		it('should change their vote when they have already voted a different person', () => {
			const message = voteService.addVote({
				voter: mockVotes[0].voter,
				playerVotedFor: mockPlayers[3].id
			});

			const votes = voteService.voteRepository.getVotes();

			makeSure(votes).hasLengthOf(mockVotes.length);
			makeSure(votes).hasAnItemWhere( vote => {
				return (
					vote.voterID === mockPlayers[0].id &&
					vote.playerVotedFor.id === mockPlayers[3].id
				)
			})
			makeSure(message).is(`You have changed your favorite name vote from ${mockPlayers[1].publishedName} to ${mockPlayers[3].publishedName}`);
		});
	});

	describe('.getWinningPlayerID()', () => {
		it('should return the ID of the player with the most votes', async () => {
			const winningPlayerID = await voteService.getWinningPlayerID();

			makeSure(winningPlayerID).is(mockPlayers[1].id);
		});

		it('should return the ID of the player with the most votes when votes change', () => {
			voteService.addVote({
				voter: mockPlayers[0].id,
				playerVotedFor: mockPlayers[3].id
			});
			voteService.addVote({
				voter: mockPlayers[1].id,
				playerVotedFor: mockPlayers[3].id
			});
			voteService.addVote({
				voter: mockPlayers[2].id,
				playerVotedFor: mockPlayers[3].id
			});

			const winningPlayerID = voteService.getWinningPlayerID();
			makeSure(winningPlayerID).is(mockPlayers[3].id);
		});

		it('should not return anything when there is a tie', () => {
			voteService.addVote({
				voter: mockPlayers[3].id,
				playerVotedFor: mockPlayers[2].id
			});

			const winningPlayerID = voteService.getWinningPlayerID();
			makeSure(winningPlayerID).is(null);
		});

		it('should not return anything when there are no votes', () => {
			voteService.reset();

			const winningPlayerID = voteService.getWinningPlayerID();
			makeSure(winningPlayerID).is(null);
		});
	});

	describe('.reset()', () => {
		it('should reset the votes', () => {
			voteService.addVote({
				voter: mockPlayers[3].id,
				playerVotedFor: mockPlayers[2].id
			});

			voteService.reset();

			const votes = voteService.voteRepository.getVotes();
			makeSure(votes).isEmpty();
		});
	});
});