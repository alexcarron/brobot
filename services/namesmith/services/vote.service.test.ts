import { makeSure } from "../../../utilities/jest/jest-utils";
import { VoteRepository } from "../repositories/vote.repository";
import { PlayerService } from "./player.service";
import { VoteService } from "./vote.service";
import { INVALID_PLAYER_ID, INVALID_VOTE_ID } from "../constants/test.constants";
import { addMockVote } from "../mocks/mock-data/mock-votes";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { Rank, Ranks } from "../types/vote.types";
import { DatabaseQuerier } from "../database/database-querier";
import { Player } from "../types/player.types";
import { InvalidArgumentError } from "../../../utilities/error-utils";
import { PlayerNotFoundError, VoteOutOfOrderError } from "../utilities/error.utility";

describe('VoteService', () => {
	let db: DatabaseQuerier;
	let voteService: VoteService;

	let VOTER_PLAYER: Player;
	let VOTED_1ST_PLAYER: Player;
	let VOTED_2ND_PLAYER: Player;
	let VOTED_3RD_PLAYER: Player;
	let SOME_OTHER_PLAYER: Player;
	
	const addSomeVote = () => {
		return addMockVote(db, {
			voter: VOTER_PLAYER.id,
			votedFirstPlayer: VOTED_1ST_PLAYER.id,
			votedSecondPlayer: VOTED_2ND_PLAYER.id,
			votedThirdPlayer: VOTED_3RD_PLAYER.id,
		});
	}

	beforeEach(() => {
		voteService = VoteService.asMock();
		db = voteService.voteRepository.db;

		VOTER_PLAYER = addMockPlayer(db);
		VOTED_1ST_PLAYER = addMockPlayer(db, {publishedName: '1st Player'});
		VOTED_2ND_PLAYER = addMockPlayer(db, {publishedName: '2nd Player'});
		VOTED_3RD_PLAYER = addMockPlayer(db, {publishedName: '3rd Player'});
		SOME_OTHER_PLAYER = addMockPlayer(db, {publishedName: 'Some Other Player'});
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

	describe('resolveVote()', () => {
		it('should resolve a vote object to a vote object', () => {
			const vote = addMockVote(db);

			const resolvedVote = voteService.resolveVote(vote);

			makeSure(resolvedVote).is(vote);
		});

		it('should resolve a vote ID to a vote object', () => {
			const vote = addMockVote(db);
			const voteID = vote.voterID;

			const resolvedVote = voteService.resolveVote(voteID);

			makeSure(resolvedVote).is(vote);
		});

		it('resolves the current vote object from an outdated vote object', () => {
			const SOME_VOTE = addSomeVote();
			const OUTDATED_VOTE = {
				...SOME_VOTE,
				votedFirstPlayer: INVALID_PLAYER_ID
			};

			const resolvedVote = voteService.resolveVote(OUTDATED_VOTE);

			makeSure(resolvedVote).is(SOME_VOTE);
		});

		it('should throw an error if the vote resolvable is invalid', () => {
			makeSure(() => voteService.resolveVote('invalid')).throwsAnError();
		});
	});

	describe('votePlayerAsRank()', () => {
		it('should vote a player as first place', () => {
			const vote = voteService.votePlayerAsRank(VOTER_PLAYER.id, VOTED_1ST_PLAYER.id, Ranks.FIRST);

			makeSure(vote).hasOnlyProperties({
				voterID: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER,
				votedSecondPlayer: null,
				votedThirdPlayer: null
			});

			const resolvedVote = voteService.resolveVote(VOTER_PLAYER.id);
			makeSure(resolvedVote).is(vote);
		});

		it('throws a VoteOutOfOrderError if voting a player as second place when there is no 1st place vote', () => {
			makeSure(() => 
				voteService.votePlayerAsRank(VOTER_PLAYER.id, VOTED_2ND_PLAYER.id, Ranks.SECOND)
			).throws(VoteOutOfOrderError);
		});

		it('throws a VoteOutOfOrderError if voting a player as third place when there is no 1st place vote', () => {
			makeSure(() => 
				voteService.votePlayerAsRank(VOTER_PLAYER.id, VOTED_3RD_PLAYER.id, Ranks.THIRD)
			).throws(VoteOutOfOrderError);
		});

		it('throws a VoteOutOfOrderError if voting a player as third place when there is no 2nd place vote', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
			});

			makeSure(() => 
				voteService.votePlayerAsRank(VOTER_PLAYER.id, VOTED_3RD_PLAYER.id, Ranks.THIRD)
			).throws(VoteOutOfOrderError);
		});

		it('throws VoteOutOfOrderError if voting the same player in 2nd place that you voted in 1st place', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
			});

			makeSure(() => 
				voteService.votePlayerAsRank(VOTER_PLAYER.id, VOTED_1ST_PLAYER.id, Ranks.SECOND)
			).throws(VoteOutOfOrderError);
		});

		it('throws VoteOutOfOrderError if voting the same player in 3rd place that you voted in 2nd place', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
			});

			makeSure(() => 
				voteService.votePlayerAsRank(VOTER_PLAYER.id, VOTED_2ND_PLAYER.id, Ranks.THIRD)
			).throws(VoteOutOfOrderError);
		});

		it('throws VoteOutOfOrderError if voting the same player in 3rd place that you voted in 1st place', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
			});

			makeSure(() => 
				voteService.votePlayerAsRank(VOTER_PLAYER.id, VOTED_1ST_PLAYER.id, Ranks.THIRD)
			).throws(VoteOutOfOrderError);
		});
		
		it('should update an existing vote that has a 2nd place vote with also a 1st place vote', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
			});

			const vote = voteService.votePlayerAsRank(VOTER_PLAYER.id, VOTED_1ST_PLAYER.id, Ranks.FIRST);

			makeSure(vote).hasOnlyProperties({
				voterID: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER,
				votedSecondPlayer: VOTED_2ND_PLAYER,
				votedThirdPlayer: null
			});
		});

		it('should fill out all three ranks when used three times on different ranks', () => {
			voteService.votePlayerAsRank(VOTER_PLAYER.id, VOTED_1ST_PLAYER.id, Ranks.FIRST);
			voteService.votePlayerAsRank(VOTER_PLAYER.id, VOTED_2ND_PLAYER.id, Ranks.SECOND);
			const vote = voteService.votePlayerAsRank(VOTER_PLAYER.id, VOTED_3RD_PLAYER.id, Ranks.THIRD);

			makeSure(vote).hasOnlyProperties({
				voterID: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER,
				votedSecondPlayer: VOTED_2ND_PLAYER,
				votedThirdPlayer: VOTED_3RD_PLAYER
			});
		});

		it('should replace an existing vote with a new one', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
				votedThirdPlayer: VOTED_3RD_PLAYER.id,
			});

			const vote = voteService.votePlayerAsRank(VOTER_PLAYER.id, SOME_OTHER_PLAYER.id, Ranks.THIRD);

			makeSure(vote).hasOnlyProperties({
				voterID: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER,
				votedSecondPlayer: VOTED_2ND_PLAYER,
				votedThirdPlayer: SOME_OTHER_PLAYER
			});
		});

		it('should throw an error if the rank is invalid', () => {
			makeSure(() => 
				voteService.votePlayerAsRank(VOTER_PLAYER.id, VOTED_1ST_PLAYER.id, '4th' as Rank)
			).throws(InvalidArgumentError);
		});

		it('should throw an error if the player is invalid', () => {
			makeSure(() => 
				voteService.votePlayerAsRank(VOTER_PLAYER.id, INVALID_PLAYER_ID, Ranks.FIRST)
			).throws(PlayerNotFoundError);
		});

		it('should remove original vote for player if already voted in another rank', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
			});

			voteService.votePlayerAsRank(VOTER_PLAYER.id, VOTED_2ND_PLAYER.id, Ranks.FIRST);

			const vote = voteService.resolveVote(VOTER_PLAYER.id);

			makeSure(vote).hasOnlyProperties({
				voterID: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_2ND_PLAYER,
				votedSecondPlayer: null,
				votedThirdPlayer: null
			});
		})
	});

	describe('getMissingRanksOfVote()', () => {
		it('returns the third place rank that is missing from the vote', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
			});

			const missingRanks = voteService.getMissingRanksOfVote(VOTER_PLAYER.id);

			makeSure(missingRanks).is(new Set([Ranks.THIRD]));
		});

		it('returns the first and second place ranks that are missing from the vote', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedThirdPlayer: VOTED_1ST_PLAYER.id,
			});

			const missingRanks = voteService.getMissingRanksOfVote(VOTER_PLAYER.id);

			makeSure(missingRanks).is(new Set([Ranks.FIRST, Ranks.SECOND]));
		});

		it('returns all ranks if there are no votes', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
			});

			const missingRanks = voteService.getMissingRanksOfVote(VOTER_PLAYER.id);

			makeSure(missingRanks).is(new Set([Ranks.FIRST, Ranks.SECOND, Ranks.THIRD]));
		});

		it('returns all ranks if the vote does not exist', () => {
			const missingRanks = voteService.getMissingRanksOfVote(VOTER_PLAYER.id);

			makeSure(missingRanks).is(new Set([Ranks.FIRST, Ranks.SECOND, Ranks.THIRD]));
		});

		it('returns all votes if null is passed in', () => {
			const missingRanks = voteService.getMissingRanksOfVote(null);

			makeSure(missingRanks).is(new Set([Ranks.FIRST, Ranks.SECOND, Ranks.THIRD]));
		});

		it('returns no ranks if the vote is complete', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
				votedThirdPlayer: VOTED_3RD_PLAYER.id,
			});

			const missingRanks = voteService.getMissingRanksOfVote(VOTER_PLAYER.id);

			makeSure(missingRanks).is(new Set([]));
		});
	});

	describe('getRanksToVotedPlayer()', () => {
		it('returns the map of ranks to players voted for in the given vote', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
				votedThirdPlayer: VOTED_3RD_PLAYER.id,
			});

			const rankToVotedPlayer = voteService.getRanksToVotedPlayer(VOTER_PLAYER.id);

			makeSure(rankToVotedPlayer).is(new Map([
				[Ranks.FIRST, VOTED_1ST_PLAYER],
				[Ranks.SECOND, VOTED_2ND_PLAYER],
				[Ranks.THIRD, VOTED_3RD_PLAYER]
			]));
		});

		it('returns the correct map of ranks to players when some ranks are missing', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedThirdPlayer: VOTED_3RD_PLAYER.id,
			});

			const rankToVotedPlayer = voteService.getRanksToVotedPlayer(VOTER_PLAYER.id);

			makeSure(rankToVotedPlayer).is(new Map([
				[Ranks.FIRST, VOTED_1ST_PLAYER],
				[Ranks.THIRD, VOTED_3RD_PLAYER]
			]));
		});

		it('returns an empty map if there are no votes', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
			});

			const rankToVotedPlayer = voteService.getRanksToVotedPlayer(VOTER_PLAYER.id);

			makeSure(rankToVotedPlayer).is(new Map([]));
		});

		it('returns an empty map if the vote does not exist', () => {
			const rankToVotedPlayer = voteService.getRanksToVotedPlayer(VOTER_PLAYER.id);

			makeSure(rankToVotedPlayer).is(new Map([]));
		});
	});

	describe('getRanksToVotedName()', () => {
		it('returns the map of ranks to the names of the players voted for in the given vote', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
				votedThirdPlayer: VOTED_3RD_PLAYER.id,
			});

			const rankToVotedName = voteService.getRanksToVotedName(VOTER_PLAYER.id);

			makeSure(rankToVotedName).is(new Map([
				[Ranks.FIRST, VOTED_1ST_PLAYER.publishedName!],
				[Ranks.SECOND, VOTED_2ND_PLAYER.publishedName!],
				[Ranks.THIRD, VOTED_3RD_PLAYER.publishedName!]
			]));
		});

		it('returns the correct map of ranks to names when some ranks are missing', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedThirdPlayer: VOTED_3RD_PLAYER.id,
			});

			const rankToVotedName = voteService.getRanksToVotedName(VOTER_PLAYER.id);

			makeSure(rankToVotedName).is(new Map([
				[Ranks.FIRST, VOTED_1ST_PLAYER.publishedName!],
				[Ranks.THIRD, VOTED_3RD_PLAYER.publishedName!]
			]));
		});

		it('returns an empty map if there are no votes', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
			});

			const rankToVotedName = voteService.getRanksToVotedName(VOTER_PLAYER.id);

			makeSure(rankToVotedName).is(new Map([]));
		});

		it('returns an empty map if the vote does not exist', () => {
			const rankToVotedName = voteService.getRanksToVotedName(VOTER_PLAYER.id);

			makeSure(rankToVotedName).is(new Map([]));
		});
	});

	describe('getOtherRanksToVotedPlayer()', () => {
		it('returns the first and second place rank when the 3rd rank is given', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
			});

			const rankToVotedPlayer = voteService.getOtherRanksToVotedPlayer(VOTER_PLAYER.id, Ranks.THIRD);

			makeSure(rankToVotedPlayer).is(new Map([
				[Ranks.FIRST, VOTED_1ST_PLAYER],
				[Ranks.SECOND, VOTED_2ND_PLAYER],
			]));
		});

		it('returns 2nd and 3rd place ranks when the 1st rank is given', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
				votedThirdPlayer: VOTED_3RD_PLAYER.id,
			});

			const rankToVotedPlayer = voteService.getOtherRanksToVotedPlayer(VOTER_PLAYER.id, Ranks.FIRST);

			makeSure(rankToVotedPlayer).is(new Map([
				[Ranks.SECOND, VOTED_2ND_PLAYER],
				[Ranks.THIRD, VOTED_3RD_PLAYER],
			]));
		});

		it('returns 1st place rank when 2nd place is empty and 3rd place is given', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
			});

			const rankToVotedPlayer = voteService.getOtherRanksToVotedPlayer(VOTER_PLAYER.id, Ranks.THIRD);

			makeSure(rankToVotedPlayer).is(new Map([
				[Ranks.FIRST, VOTED_1ST_PLAYER],
			]));
		});

		it('returns empty map when there are no votes', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
			})
			const rankToVotedPlayer = voteService.getOtherRanksToVotedPlayer(VOTER_PLAYER.id, Ranks.THIRD);

			makeSure(rankToVotedPlayer).is(new Map([]));
		});
	});

	describe(`getPlayerVotedInRank()`, () => {
		it(`gets the player voted 1st`, () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
			});

			const player = voteService.getPlayerVotedInRank(VOTER_PLAYER.id, Ranks.FIRST);

			makeSure(player).is(VOTED_1ST_PLAYER);
		});

		it('gets the player voted 3rd', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
				votedThirdPlayer: VOTED_3RD_PLAYER.id,
			});

			const player = voteService.getPlayerVotedInRank(VOTER_PLAYER.id, Ranks.THIRD);

			makeSure(player).is(VOTED_3RD_PLAYER);
		});

		it('gets null when no player is voted 2nd', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
			});

			const player = voteService.getPlayerVotedInRank(VOTER_PLAYER.id, Ranks.SECOND);

			makeSure(player).is(null);
		});

		it('gets null when the user has not voted yet', () => {
			const player = voteService.getPlayerVotedInRank(VOTER_PLAYER.id, Ranks.FIRST);
			makeSure(player).is(null);
		});
	});

	describe('getRankOfPlayerInVote()', () => {
		it('returns null if the vote does not exist', () => {
			const rank = voteService.getRankOfPlayerInVote(VOTER_PLAYER.id, VOTED_1ST_PLAYER);
			makeSure(rank).isNull();
		});

		it('returns null if the player is not voted for in the vote', () => {
			const mockVote = addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
			});

			const rank = voteService.getRankOfPlayerInVote(mockVote, SOME_OTHER_PLAYER);

			makeSure(rank).isNull();
		});

		it('returns the rank of the player if they are voted for in the vote', () => {
			const voteResolvable = addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
				votedThirdPlayer: VOTED_3RD_PLAYER.id,
			});

			const rank = voteService.getRankOfPlayerInVote(voteResolvable, VOTED_2ND_PLAYER);

			makeSure(rank).is(Ranks.SECOND);
		});

		it('returns the correct rank of the player for all ranks', () => {
			const voteResolvable = addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
				votedThirdPlayer: VOTED_3RD_PLAYER.id,
			});

			const rank1 = voteService.getRankOfPlayerInVote(voteResolvable, VOTED_1ST_PLAYER);
			const rank2 = voteService.getRankOfPlayerInVote(voteResolvable, VOTED_2ND_PLAYER);
			const rank3 = voteService.getRankOfPlayerInVote(voteResolvable, VOTED_3RD_PLAYER);

			makeSure(rank1).is(Ranks.FIRST);
			makeSure(rank2).is(Ranks.SECOND);
			makeSure(rank3).is(Ranks.THIRD);
		});
	});
	
	describe('doesVoteExist()', () => {
		it('returns true if the vote exists', () => {
			const voteResolvable = {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
			};

			addMockVote(db, voteResolvable);

			const doesVoteExist = voteService.doesVoteExist(voteResolvable);

			makeSure(doesVoteExist).toBe(true);
		});

		it('returns false if the vote does not exist', () => {
			const voteResolvable = {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
			};

			const doesVoteExist = voteService.doesVoteExist(voteResolvable);

			makeSure(doesVoteExist).toBe(false);
		});

		it('works with vote IDs', () => {
			const mockVote = addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
			});

			makeSure(voteService.doesVoteExist(mockVote.voterID)).toBe(true);
			makeSure(voteService.doesVoteExist(INVALID_VOTE_ID)).toBe(false);
		});
	});

	describe('removeVote()', () => {
		it('removes a vote that exists', () => {
			const mockVote = addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
			});

			const deletedVote = voteService.removeVote(mockVote);

			makeSure(deletedVote).is(mockVote);
		});

		it('returns null if the vote does not exist', () => {
			const voteResolvable = {
				voter: VOTER_PLAYER.id,
			};

			const deletedVote = voteService.removeVote(voteResolvable);

			makeSure(deletedVote).isNull();
		});

		it('works with vote IDs', () => {
			const mockVote = addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
			});

			const deletedVote = voteService.removeVote(mockVote.voterID);

			makeSure(deletedVote).is(mockVote);
		});

		it('returns null on an invalid vote id', () => {
			const deletedVote = voteService.removeVote(INVALID_VOTE_ID);
			makeSure(deletedVote).isNull();
		});
	});

	describe('getPlayerIDToPoints()', () => {
		it('returns an map of all players to 0 if there are no votes', () => {
			const scores = voteService.getPlayerIDToPoints();
			makeSure(scores).is(new Map([
				[VOTER_PLAYER.id, 0],
				[SOME_OTHER_PLAYER.id, 0],
				[VOTED_1ST_PLAYER.id, 0],
				[VOTED_2ND_PLAYER.id, 0],
				[VOTED_3RD_PLAYER.id, 0],
			]));
		});

		it('returns the correct score for players based on the votes in the repository', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
				votedThirdPlayer: VOTED_3RD_PLAYER.id,
			});

			const scores = voteService.getPlayerIDToPoints();

			makeSure(scores).is(new Map([
				[VOTER_PLAYER.id, 0],
				[SOME_OTHER_PLAYER.id, 0],
				[VOTED_1ST_PLAYER.id, 3],
				[VOTED_2ND_PLAYER.id, 2],
				[VOTED_3RD_PLAYER.id, 1],

			]))
		});

		it('returns score totals for players if there are multiple votes', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
				votedThirdPlayer: VOTED_3RD_PLAYER.id,
			});

			addMockVote(db, {
				voter: SOME_OTHER_PLAYER.id,
				votedFirstPlayer: VOTED_2ND_PLAYER.id,
				votedSecondPlayer: VOTED_3RD_PLAYER.id,
				votedThirdPlayer: VOTER_PLAYER.id,
			});

			const scores = voteService.getPlayerIDToPoints();

			makeSure(scores).is(new Map([
				[VOTER_PLAYER.id, 1],
				[SOME_OTHER_PLAYER.id, 0],
				[VOTED_1ST_PLAYER.id, 3],
				[VOTED_2ND_PLAYER.id, 5],
				[VOTED_3RD_PLAYER.id, 3],
			]));
		});

		it('returns score map in order of highest score to lowest score', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
				votedThirdPlayer: VOTED_3RD_PLAYER.id,
			});

			addMockVote(db, {
				voter: SOME_OTHER_PLAYER.id,
				votedFirstPlayer: VOTED_2ND_PLAYER.id,
				votedSecondPlayer: VOTED_3RD_PLAYER.id,
				votedThirdPlayer: VOTER_PLAYER.id,
			});

			const scores = voteService.getPlayerIDToPoints();

			makeSure([...scores.entries()]).is([
				[VOTED_2ND_PLAYER.id, 5],
				[VOTED_1ST_PLAYER.id, 3],
				[VOTED_3RD_PLAYER.id, 3],
				[VOTER_PLAYER.id, 1],
				[SOME_OTHER_PLAYER.id, 0],
			]);
		});
	});

	describe('getPlacements()', () => {
		const NO_POINTS_VOTE_INFO = {
			points: 0,
			firstPlaceVotes: 0,
			firstPlacePoints: 0,
			secondPlaceVotes: 0,
			secondPlacePoints: 0,
			thirdPlaceVotes: 0,
			thirdPlacePoints: 0
		}
		
		it('returns an array of placements with no votes', () => {
			const placements = voteService.getPlacements();
			makeSure(placements).hasLengthOf(4);
			makeSure(placements).is([
				{ player: VOTED_1ST_PLAYER, name: VOTED_1ST_PLAYER.publishedName,  rank: 1, ...NO_POINTS_VOTE_INFO },
				{ player: VOTED_2ND_PLAYER, name: VOTED_2ND_PLAYER.publishedName,  rank: 1, ...NO_POINTS_VOTE_INFO },
				{ player: VOTED_3RD_PLAYER, name: VOTED_3RD_PLAYER.publishedName,  rank: 1, ...NO_POINTS_VOTE_INFO },
				{ player: SOME_OTHER_PLAYER, name: SOME_OTHER_PLAYER.publishedName, rank: 1, ...NO_POINTS_VOTE_INFO },
			]);
		});

		it('returns the correct placements for players based on the votes in the repository', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
				votedThirdPlayer: VOTED_3RD_PLAYER.id,
			});

			const placements = voteService.getPlacements();

			makeSure(placements).is([
				{ 
					player: VOTED_1ST_PLAYER,
					name: VOTED_1ST_PLAYER.publishedName,
					rank: 1, 
					points: 3, 
					firstPlaceVotes: 1, 
					firstPlacePoints: 3, 
					secondPlaceVotes: 0, 
					secondPlacePoints: 0, 
					thirdPlaceVotes: 0, 
					thirdPlacePoints: 0 
				},
				{ 
					player: VOTED_2ND_PLAYER,
					name: VOTED_2ND_PLAYER.publishedName,
					rank: 2, 
					points: 2, 
					firstPlaceVotes: 0, 
					firstPlacePoints: 0, 
					secondPlaceVotes: 1, 
					secondPlacePoints: 2, 
					thirdPlaceVotes: 0, 
					thirdPlacePoints: 0 
				},
				{
					player: VOTED_3RD_PLAYER,
					name: VOTED_3RD_PLAYER.publishedName,
					rank: 3,
					points: 1,
					firstPlaceVotes: 0,
					firstPlacePoints: 0,
					secondPlaceVotes: 0,
					secondPlacePoints: 0,
					thirdPlaceVotes: 1,
					thirdPlacePoints: 1,
				},
				{ player: SOME_OTHER_PLAYER, name: SOME_OTHER_PLAYER.publishedName, rank: 4, ...NO_POINTS_VOTE_INFO },
			]);
		});

		it('returns correct placements for players when there are multiple votes', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
				votedSecondPlayer: VOTED_2ND_PLAYER.id,
				votedThirdPlayer: VOTED_3RD_PLAYER.id,
			});

			addMockVote(db, {
				voter: VOTED_1ST_PLAYER.id,
				votedFirstPlayer: VOTED_2ND_PLAYER.id,
				votedSecondPlayer: VOTED_3RD_PLAYER.id,
				votedThirdPlayer: SOME_OTHER_PLAYER.id,
			});

			const placements = voteService.getPlacements();

			makeSure(placements).is([
				{ 
					player: VOTED_2ND_PLAYER,
					name: VOTED_2ND_PLAYER.publishedName,
					rank: 1, 
					points: 5, 
					firstPlaceVotes: 1, 
					firstPlacePoints: 3, 
					secondPlaceVotes: 1, 
					secondPlacePoints: 2, 
					thirdPlaceVotes: 0, 
					thirdPlacePoints: 0 
				},
				{ 
					player: VOTED_1ST_PLAYER,
					name: VOTED_1ST_PLAYER.publishedName,
					rank: 2, 
					points: 3, 
					firstPlaceVotes: 1, 
					firstPlacePoints: 3, 
					secondPlaceVotes: 0, 
					secondPlacePoints: 0, 
					thirdPlaceVotes: 0, 
					thirdPlacePoints: 0 
				},
				{
					player: VOTED_3RD_PLAYER,
					name: VOTED_3RD_PLAYER.publishedName,
					rank: 2,
					points: 3,
					firstPlaceVotes: 0,
					firstPlacePoints: 0,
					secondPlaceVotes: 1,
					secondPlacePoints: 2,
					thirdPlaceVotes: 1,
					thirdPlacePoints: 1,
				},
				{ 
					player: SOME_OTHER_PLAYER, 
					name: SOME_OTHER_PLAYER.publishedName, 
					rank: 4, 
					points: 1, 
					firstPlaceVotes: 0, 
					firstPlacePoints: 0, 
					secondPlaceVotes: 0, 
					secondPlacePoints: 0, 
					thirdPlaceVotes: 1, 
					thirdPlacePoints: 1,
				},
			]);
		});
	});
});