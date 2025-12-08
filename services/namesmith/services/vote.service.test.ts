import { makeSure } from "../../../utilities/jest/jest-utils";
import { VoteRepository } from "../repositories/vote.repository";
import { PlayerService } from "./player.service";
import { VoteService } from "./vote.service";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { addMockVote } from "../mocks/mock-data/mock-votes";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { Vote } from "../types/vote.types";
import { DatabaseQuerier } from "../database/database-querier";
import { Player } from "../types/player.types";

describe('VoteService', () => {
	let db: DatabaseQuerier;
	let voteService: VoteService;

	let VOTER_PLAYER: Player;
	let VOTED_PLAYER: Player;
	let PLAYER_WITH_TOKENS: Player;
	let FOUR_DIFFERENT_PLAYERS: [Player, Player, Player, Player];
	let SOME_VOTE: Vote;

	beforeEach(() => {
		voteService = VoteService.asMock();
		db = voteService.voteRepository.db;

		VOTER_PLAYER = addMockPlayer(db);
		VOTED_PLAYER = addMockPlayer(db);
		PLAYER_WITH_TOKENS = addMockPlayer(db, { tokens: 100 });
		const SOME_FOURTH_PLAYER = addMockPlayer(db);
		FOUR_DIFFERENT_PLAYERS = [VOTER_PLAYER, VOTED_PLAYER, PLAYER_WITH_TOKENS, SOME_FOURTH_PLAYER];
		SOME_VOTE = addMockVote(db, {
			voter: VOTER_PLAYER.id,
			playerVotedFor: VOTED_PLAYER.id
		});
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
				voter: FOUR_DIFFERENT_PLAYERS[3].id,
				playerVotedFor: FOUR_DIFFERENT_PLAYERS[1].id
			});

			const votes = voteService.voteRepository.getVotes();

			makeSure(votes).hasAnItemWhere( vote => {
				return (
					vote.voterID === FOUR_DIFFERENT_PLAYERS[3].id &&
					vote.playerVotedFor.id === FOUR_DIFFERENT_PLAYERS[1].id
				)
			})
			makeSure(message).is(`You have voted for ${FOUR_DIFFERENT_PLAYERS[1].publishedName} as your favorite name!`);
		});

		it('should not add a new vote when they have already voted that person', () => {
			const oldNumVotes = voteService.voteRepository.getVotes().length;
			const message = voteService.addVote({
				voter: SOME_VOTE.voterID,
				playerVotedFor: SOME_VOTE.playerVotedFor
			});

			const votes = voteService.voteRepository.getVotes();

			makeSure(votes).hasLengthOf(oldNumVotes);
			makeSure(message).is(`You already voted for this name as your favorite!`);
		});

		it('should change their vote when they have already voted a different person', () => {
			const oldNumVotes = voteService.voteRepository.getVotes().length;
			const message = voteService.addVote({
				voter: SOME_VOTE.voterID,
				playerVotedFor: FOUR_DIFFERENT_PLAYERS[3].id
			});

			const votes = voteService.voteRepository.getVotes();

			makeSure(votes).hasLengthOf(oldNumVotes);
			makeSure(votes).hasAnItemWhere( vote => {
				return (
					vote.voterID === FOUR_DIFFERENT_PLAYERS[0].id &&
					vote.playerVotedFor.id === FOUR_DIFFERENT_PLAYERS[3].id
				)
			})
			makeSure(message).is(`You have changed your favorite name vote from ${FOUR_DIFFERENT_PLAYERS[1].publishedName} to ${FOUR_DIFFERENT_PLAYERS[3].publishedName}`);
		});
	});

	describe('.getWinningPlayerID()', () => {
		it('should return the ID of the player with the most votes', () => {
			const winningPlayerID = voteService.getWinningPlayerID();
			makeSure(winningPlayerID).is(FOUR_DIFFERENT_PLAYERS[1].id);
		});

		it('should return the ID of the player with the most votes when votes change', () => {
			voteService.addVote({
				voter: FOUR_DIFFERENT_PLAYERS[0].id,
				playerVotedFor: FOUR_DIFFERENT_PLAYERS[3].id
			});
			voteService.addVote({
				voter: FOUR_DIFFERENT_PLAYERS[1].id,
				playerVotedFor: FOUR_DIFFERENT_PLAYERS[3].id
			});
			voteService.addVote({
				voter: FOUR_DIFFERENT_PLAYERS[2].id,
				playerVotedFor: FOUR_DIFFERENT_PLAYERS[3].id
			});

			const winningPlayerID = voteService.getWinningPlayerID();
			makeSure(winningPlayerID).is(FOUR_DIFFERENT_PLAYERS[3].id);
		});

		it('should return the player with more tokens when there is a tie', () => {
			voteService.addVote({
				voter: FOUR_DIFFERENT_PLAYERS[3].id,
				playerVotedFor: PLAYER_WITH_TOKENS.id
			});

			const winningPlayerID = voteService.getWinningPlayerID();
			makeSure(winningPlayerID).is(PLAYER_WITH_TOKENS.id);
		});

		it('should return null in a double tie', () => {
			voteService.addVote({
				voter: VOTED_PLAYER.id,
				playerVotedFor: FOUR_DIFFERENT_PLAYERS[3].id
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
				voter: FOUR_DIFFERENT_PLAYERS[3].id,
				playerVotedFor: FOUR_DIFFERENT_PLAYERS[2].id
			});

			voteService.reset();

			const votes = voteService.voteRepository.getVotes();
			makeSure(votes).isEmpty();
		});
	});
});