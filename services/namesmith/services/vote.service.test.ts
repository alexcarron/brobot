import { makeSure } from "../../../utilities/jest/jest-utils";
import { VoteRepository } from "../repositories/vote.repository";
import { PlayerService } from "./player.service";
import { VoteService } from "./vote.service";
import { INVALID_PUBLISHED_NAME_ID, INVALID_VOTE_ID } from "../constants/test.constants";
import { addMockVote } from "../mocks/mock-data/mock-votes";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { addMockPublishedName } from "../mocks/mock-data/mock-published-names";
import { Placement, Rank, Ranks } from "../types/vote.types";
import { DatabaseQuerier } from "../database/database-querier";
import { Player } from "../types/player.types";
import { PublishedName } from "../types/published-name.types";
import { InvalidArgumentError } from "../../../utilities/error-utils";
import { PublishedNameNotFoundError, VoteOutOfOrderError } from "../utilities/error.utility";

// Projects a placement to the fields that do not depend on resolved player/entry object identity.
const toComparablePlacement = (placement: Placement) => ({
	name: placement.name,
	rank: placement.rank,
	points: placement.points,
	firstPlaceVotes: placement.firstPlaceVotes,
	firstPlacePoints: placement.firstPlacePoints,
	secondPlaceVotes: placement.secondPlaceVotes,
	secondPlacePoints: placement.secondPlacePoints,
	thirdPlaceVotes: placement.thirdPlaceVotes,
	thirdPlacePoints: placement.thirdPlacePoints,
});

describe('VoteService', () => {
	let db: DatabaseQuerier;
	let voteService: VoteService;

	let VOTER_PLAYER: Player;
	let SECOND_VOTER_PLAYER: Player;
	let VOTED_1ST_NAME: PublishedName;
	let VOTED_2ND_NAME: PublishedName;
	let VOTED_3RD_NAME: PublishedName;
	let SOME_OTHER_NAME: PublishedName;

	const addSomeVote = () => {
		return addMockVote(db, {
			voter: VOTER_PLAYER.id,
			votedFirstPublishedName: VOTED_1ST_NAME.id,
			votedSecondPublishedName: VOTED_2ND_NAME.id,
			votedThirdPublishedName: VOTED_3RD_NAME.id,
		});
	}

	beforeEach(() => {
		voteService = VoteService.asMock();
		db = voteService.voteRepository.db;

		VOTER_PLAYER = addMockPlayer(db);
		SECOND_VOTER_PLAYER = addMockPlayer(db);
		VOTED_1ST_NAME = addMockPublishedName(db, {name: '1st Name'});
		VOTED_2ND_NAME = addMockPublishedName(db, {name: '2nd Name'});
		VOTED_3RD_NAME = addMockPublishedName(db, {name: '3rd Name'});
		SOME_OTHER_NAME = addMockPublishedName(db, {name: 'Some Other Name'});
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
				votedFirstPublishedName: null
			};

			const resolvedVote = voteService.resolveVote(OUTDATED_VOTE);

			makeSure(resolvedVote).is(SOME_VOTE);
		});

		it('should throw an error if the vote resolvable is invalid', () => {
			makeSure(() => voteService.resolveVote('invalid')).throwsAnError();
		});
	});

	describe('votePublishedNameAsRank()', () => {
		it('should vote a name as first place', () => {
			const vote = voteService.votePublishedNameAsRank(VOTER_PLAYER.id, VOTED_1ST_NAME.id, Ranks.FIRST);

			makeSure(vote).hasOnlyProperties({
				voterID: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME,
				votedSecondPublishedName: null,
				votedThirdPublishedName: null
			});

			const resolvedVote = voteService.resolveVote(VOTER_PLAYER.id);
			makeSure(resolvedVote).is(vote);
		});

		it('throws a VoteOutOfOrderError if voting a name as second place when there is no 1st place vote', () => {
			makeSure(() =>
				voteService.votePublishedNameAsRank(VOTER_PLAYER.id, VOTED_2ND_NAME.id, Ranks.SECOND)
			).throws(VoteOutOfOrderError);
		});

		it('throws a VoteOutOfOrderError if voting a name as third place when there is no 1st place vote', () => {
			makeSure(() =>
				voteService.votePublishedNameAsRank(VOTER_PLAYER.id, VOTED_3RD_NAME.id, Ranks.THIRD)
			).throws(VoteOutOfOrderError);
		});

		it('throws a VoteOutOfOrderError if voting a name as third place when there is no 2nd place vote', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
			});

			makeSure(() =>
				voteService.votePublishedNameAsRank(VOTER_PLAYER.id, VOTED_3RD_NAME.id, Ranks.THIRD)
			).throws(VoteOutOfOrderError);
		});

		it('throws VoteOutOfOrderError if voting the same name in 2nd place that you voted in 1st place', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
			});

			makeSure(() =>
				voteService.votePublishedNameAsRank(VOTER_PLAYER.id, VOTED_1ST_NAME.id, Ranks.SECOND)
			).throws(VoteOutOfOrderError);
		});

		it('throws VoteOutOfOrderError if voting the same name in 3rd place that you voted in 2nd place', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
			});

			makeSure(() =>
				voteService.votePublishedNameAsRank(VOTER_PLAYER.id, VOTED_2ND_NAME.id, Ranks.THIRD)
			).throws(VoteOutOfOrderError);
		});

		it('throws VoteOutOfOrderError if voting the same name in 3rd place that you voted in 1st place', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
			});

			makeSure(() =>
				voteService.votePublishedNameAsRank(VOTER_PLAYER.id, VOTED_1ST_NAME.id, Ranks.THIRD)
			).throws(VoteOutOfOrderError);
		});

		it('should update an existing vote that has a 2nd place vote with also a 1st place vote', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
			});

			const vote = voteService.votePublishedNameAsRank(VOTER_PLAYER.id, VOTED_1ST_NAME.id, Ranks.FIRST);

			makeSure(vote).hasOnlyProperties({
				voterID: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME,
				votedSecondPublishedName: VOTED_2ND_NAME,
				votedThirdPublishedName: null
			});
		});

		it('should fill out all three ranks when used three times on different ranks', () => {
			voteService.votePublishedNameAsRank(VOTER_PLAYER.id, VOTED_1ST_NAME.id, Ranks.FIRST);
			voteService.votePublishedNameAsRank(VOTER_PLAYER.id, VOTED_2ND_NAME.id, Ranks.SECOND);
			const vote = voteService.votePublishedNameAsRank(VOTER_PLAYER.id, VOTED_3RD_NAME.id, Ranks.THIRD);

			makeSure(vote).hasOnlyProperties({
				voterID: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME,
				votedSecondPublishedName: VOTED_2ND_NAME,
				votedThirdPublishedName: VOTED_3RD_NAME
			});
		});

		it('should replace an existing vote with a new one', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
				votedThirdPublishedName: VOTED_3RD_NAME.id,
			});

			const vote = voteService.votePublishedNameAsRank(VOTER_PLAYER.id, SOME_OTHER_NAME.id, Ranks.THIRD);

			makeSure(vote).hasOnlyProperties({
				voterID: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME,
				votedSecondPublishedName: VOTED_2ND_NAME,
				votedThirdPublishedName: SOME_OTHER_NAME
			});
		});

		it('should throw an error if the rank is invalid', () => {
			makeSure(() =>
				voteService.votePublishedNameAsRank(VOTER_PLAYER.id, VOTED_1ST_NAME.id, '4th' as Rank)
			).throws(InvalidArgumentError);
		});

		it('should throw an error if the published name is invalid', () => {
			makeSure(() =>
				voteService.votePublishedNameAsRank(VOTER_PLAYER.id, INVALID_PUBLISHED_NAME_ID, Ranks.FIRST)
			).throws(PublishedNameNotFoundError);
		});

		it('should remove original vote for name if already voted in another rank', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
			});

			voteService.votePublishedNameAsRank(VOTER_PLAYER.id, VOTED_2ND_NAME.id, Ranks.FIRST);

			const vote = voteService.resolveVote(VOTER_PLAYER.id);

			makeSure(vote).hasOnlyProperties({
				voterID: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_2ND_NAME,
				votedSecondPublishedName: null,
				votedThirdPublishedName: null
			});
		})
	});

	describe('getMissingRanksOfVote()', () => {
		it('returns the third place rank that is missing from the vote', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
			});

			const missingRanks = voteService.getMissingRanksOfVote(VOTER_PLAYER.id);

			makeSure(missingRanks).is(new Set([Ranks.THIRD]));
		});

		it('returns the first and second place ranks that are missing from the vote', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedThirdPublishedName: VOTED_1ST_NAME.id,
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
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
				votedThirdPublishedName: VOTED_3RD_NAME.id,
			});

			const missingRanks = voteService.getMissingRanksOfVote(VOTER_PLAYER.id);

			makeSure(missingRanks).is(new Set([]));
		});
	});

	describe('getRanksToVotedPublishedName()', () => {
		it('returns the map of ranks to names voted for in the given vote', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
				votedThirdPublishedName: VOTED_3RD_NAME.id,
			});

			const rankToVotedPublishedName = voteService.getRanksToVotedPublishedName(VOTER_PLAYER.id);

			makeSure(rankToVotedPublishedName).is(new Map([
				[Ranks.FIRST, VOTED_1ST_NAME],
				[Ranks.SECOND, VOTED_2ND_NAME],
				[Ranks.THIRD, VOTED_3RD_NAME]
			]));
		});

		it('returns the correct map of ranks to names when some ranks are missing', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedThirdPublishedName: VOTED_3RD_NAME.id,
			});

			const rankToVotedPublishedName = voteService.getRanksToVotedPublishedName(VOTER_PLAYER.id);

			makeSure(rankToVotedPublishedName).is(new Map([
				[Ranks.FIRST, VOTED_1ST_NAME],
				[Ranks.THIRD, VOTED_3RD_NAME]
			]));
		});

		it('returns an empty map if there are no votes', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
			});

			const rankToVotedPublishedName = voteService.getRanksToVotedPublishedName(VOTER_PLAYER.id);

			makeSure(rankToVotedPublishedName).is(new Map([]));
		});

		it('returns an empty map if the vote does not exist', () => {
			const rankToVotedPublishedName = voteService.getRanksToVotedPublishedName(VOTER_PLAYER.id);

			makeSure(rankToVotedPublishedName).is(new Map([]));
		});
	});

	describe('getRanksToVotedName()', () => {
		it('returns the map of ranks to the names voted for in the given vote', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
				votedThirdPublishedName: VOTED_3RD_NAME.id,
			});

			const rankToVotedName = voteService.getRanksToVotedName(VOTER_PLAYER.id);

			makeSure(rankToVotedName).is(new Map([
				[Ranks.FIRST, VOTED_1ST_NAME.name],
				[Ranks.SECOND, VOTED_2ND_NAME.name],
				[Ranks.THIRD, VOTED_3RD_NAME.name]
			]));
		});

		it('returns the correct map of ranks to names when some ranks are missing', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedThirdPublishedName: VOTED_3RD_NAME.id,
			});

			const rankToVotedName = voteService.getRanksToVotedName(VOTER_PLAYER.id);

			makeSure(rankToVotedName).is(new Map([
				[Ranks.FIRST, VOTED_1ST_NAME.name],
				[Ranks.THIRD, VOTED_3RD_NAME.name]
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

	describe('getOtherRanksToVotedPublishedName()', () => {
		it('returns the first and second place rank when the 3rd rank is given', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
			});

			const rankToVotedPublishedName = voteService.getOtherRanksToVotedPublishedName(VOTER_PLAYER.id, Ranks.THIRD);

			makeSure(rankToVotedPublishedName).is(new Map([
				[Ranks.FIRST, VOTED_1ST_NAME],
				[Ranks.SECOND, VOTED_2ND_NAME],
			]));
		});

		it('returns 2nd and 3rd place ranks when the 1st rank is given', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
				votedThirdPublishedName: VOTED_3RD_NAME.id,
			});

			const rankToVotedPublishedName = voteService.getOtherRanksToVotedPublishedName(VOTER_PLAYER.id, Ranks.FIRST);

			makeSure(rankToVotedPublishedName).is(new Map([
				[Ranks.SECOND, VOTED_2ND_NAME],
				[Ranks.THIRD, VOTED_3RD_NAME],
			]));
		});

		it('returns 1st place rank when 2nd place is empty and 3rd place is given', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
			});

			const rankToVotedPublishedName = voteService.getOtherRanksToVotedPublishedName(VOTER_PLAYER.id, Ranks.THIRD);

			makeSure(rankToVotedPublishedName).is(new Map([
				[Ranks.FIRST, VOTED_1ST_NAME],
			]));
		});

		it('returns empty map when there are no votes', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
			})
			const rankToVotedPublishedName = voteService.getOtherRanksToVotedPublishedName(VOTER_PLAYER.id, Ranks.THIRD);

			makeSure(rankToVotedPublishedName).is(new Map([]));
		});
	});

	describe(`getPublishedNameVotedInRank()`, () => {
		it(`gets the name voted 1st`, () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
			});

			const publishedName = voteService.getPublishedNameVotedInRank(VOTER_PLAYER.id, Ranks.FIRST);

			makeSure(publishedName).is(VOTED_1ST_NAME);
		});

		it('gets the name voted 3rd', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
				votedThirdPublishedName: VOTED_3RD_NAME.id,
			});

			const publishedName = voteService.getPublishedNameVotedInRank(VOTER_PLAYER.id, Ranks.THIRD);

			makeSure(publishedName).is(VOTED_3RD_NAME);
		});

		it('gets null when no name is voted 2nd', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
			});

			const publishedName = voteService.getPublishedNameVotedInRank(VOTER_PLAYER.id, Ranks.SECOND);

			makeSure(publishedName).is(null);
		});

		it('gets null when the user has not voted yet', () => {
			const publishedName = voteService.getPublishedNameVotedInRank(VOTER_PLAYER.id, Ranks.FIRST);
			makeSure(publishedName).is(null);
		});
	});

	describe('getRankOfPublishedNameInVote()', () => {
		it('returns null if the vote does not exist', () => {
			const rank = voteService.getRankOfPublishedNameInVote(VOTER_PLAYER.id, VOTED_1ST_NAME);
			makeSure(rank).isNull();
		});

		it('returns null if the name is not voted for in the vote', () => {
			const mockVote = addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
			});

			const rank = voteService.getRankOfPublishedNameInVote(mockVote, SOME_OTHER_NAME);

			makeSure(rank).isNull();
		});

		it('returns the rank of the name if it is voted for in the vote', () => {
			const voteResolvable = addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
				votedThirdPublishedName: VOTED_3RD_NAME.id,
			});

			const rank = voteService.getRankOfPublishedNameInVote(voteResolvable, VOTED_2ND_NAME);

			makeSure(rank).is(Ranks.SECOND);
		});

		it('returns the correct rank of the name for all ranks', () => {
			const voteResolvable = addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
				votedThirdPublishedName: VOTED_3RD_NAME.id,
			});

			const rank1 = voteService.getRankOfPublishedNameInVote(voteResolvable, VOTED_1ST_NAME);
			const rank2 = voteService.getRankOfPublishedNameInVote(voteResolvable, VOTED_2ND_NAME);
			const rank3 = voteService.getRankOfPublishedNameInVote(voteResolvable, VOTED_3RD_NAME);

			makeSure(rank1).is(Ranks.FIRST);
			makeSure(rank2).is(Ranks.SECOND);
			makeSure(rank3).is(Ranks.THIRD);
		});
	});

	describe('doesVoteExist()', () => {
		it('returns true if the vote exists', () => {
			const voteResolvable = {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
			};

			addMockVote(db, voteResolvable);

			const doesVoteExist = voteService.doesVoteExist(voteResolvable);

			makeSure(doesVoteExist).toBe(true);
		});

		it('returns false if the vote does not exist', () => {
			const voteResolvable = {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
			};

			const doesVoteExist = voteService.doesVoteExist(voteResolvable);

			makeSure(doesVoteExist).toBe(false);
		});

		it('works with vote IDs', () => {
			const mockVote = addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
			});

			makeSure(voteService.doesVoteExist(mockVote.voterID)).toBe(true);
			makeSure(voteService.doesVoteExist(INVALID_VOTE_ID)).toBe(false);
		});
	});

	describe('removeVote()', () => {
		it('removes a vote that exists', () => {
			const mockVote = addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
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
				votedFirstPublishedName: VOTED_1ST_NAME.id,
			});

			const deletedVote = voteService.removeVote(mockVote.voterID);

			makeSure(deletedVote).is(mockVote);
		});

		it('returns null on an invalid vote id', () => {
			const deletedVote = voteService.removeVote(INVALID_VOTE_ID);
			makeSure(deletedVote).isNull();
		});
	});

	describe('getPublishedNameIDToPoints()', () => {
		it('returns a map of all published names to 0 if there are no votes', () => {
			const scores = voteService.getPublishedNameIDToPoints();
			makeSure(scores).is(new Map([
				[VOTED_1ST_NAME.id, 0],
				[VOTED_2ND_NAME.id, 0],
				[VOTED_3RD_NAME.id, 0],
				[SOME_OTHER_NAME.id, 0],
			]));
		});

		it('returns the correct score for names based on the votes in the repository', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
				votedThirdPublishedName: VOTED_3RD_NAME.id,
			});

			const scores = voteService.getPublishedNameIDToPoints();

			makeSure(scores).is(new Map([
				[VOTED_1ST_NAME.id, 3],
				[VOTED_2ND_NAME.id, 2],
				[VOTED_3RD_NAME.id, 1],
				[SOME_OTHER_NAME.id, 0],
			]))
		});

		it('returns score totals for names if there are multiple votes', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
				votedThirdPublishedName: VOTED_3RD_NAME.id,
			});

			addMockVote(db, {
				voter: SECOND_VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_2ND_NAME.id,
				votedSecondPublishedName: VOTED_3RD_NAME.id,
				votedThirdPublishedName: SOME_OTHER_NAME.id,
			});

			const scores = voteService.getPublishedNameIDToPoints();

			makeSure(scores).is(new Map([
				[VOTED_2ND_NAME.id, 5],
				[VOTED_1ST_NAME.id, 3],
				[VOTED_3RD_NAME.id, 3],
				[SOME_OTHER_NAME.id, 1],
			]));
		});

		it('returns score map in order of highest score to lowest score', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
				votedThirdPublishedName: VOTED_3RD_NAME.id,
			});

			addMockVote(db, {
				voter: SECOND_VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_2ND_NAME.id,
				votedSecondPublishedName: VOTED_3RD_NAME.id,
				votedThirdPublishedName: SOME_OTHER_NAME.id,
			});

			const scores = voteService.getPublishedNameIDToPoints();

			makeSure([...scores.entries()]).is([
				[VOTED_2ND_NAME.id, 5],
				[VOTED_1ST_NAME.id, 3],
				[VOTED_3RD_NAME.id, 3],
				[SOME_OTHER_NAME.id, 1],
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
			makeSure(placements.map(toComparablePlacement)).is([
				{ name: VOTED_1ST_NAME.name, rank: 1, ...NO_POINTS_VOTE_INFO },
				{ name: VOTED_2ND_NAME.name, rank: 1, ...NO_POINTS_VOTE_INFO },
				{ name: VOTED_3RD_NAME.name, rank: 1, ...NO_POINTS_VOTE_INFO },
				{ name: SOME_OTHER_NAME.name, rank: 1, ...NO_POINTS_VOTE_INFO },
			]);
		});

		it('returns the correct placements for names based on the votes in the repository', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
				votedThirdPublishedName: VOTED_3RD_NAME.id,
			});

			const placements = voteService.getPlacements();

			makeSure(placements.map(toComparablePlacement)).is([
				{ name: VOTED_1ST_NAME.name, rank: 1, points: 3, firstPlaceVotes: 1, firstPlacePoints: 3, secondPlaceVotes: 0, secondPlacePoints: 0, thirdPlaceVotes: 0, thirdPlacePoints: 0 },
				{ name: VOTED_2ND_NAME.name, rank: 2, points: 2, firstPlaceVotes: 0, firstPlacePoints: 0, secondPlaceVotes: 1, secondPlacePoints: 2, thirdPlaceVotes: 0, thirdPlacePoints: 0 },
				{ name: VOTED_3RD_NAME.name, rank: 3, points: 1, firstPlaceVotes: 0, firstPlacePoints: 0, secondPlaceVotes: 0, secondPlacePoints: 0, thirdPlaceVotes: 1, thirdPlacePoints: 1 },
				{ name: SOME_OTHER_NAME.name, rank: 4, ...NO_POINTS_VOTE_INFO },
			]);
		});

		it('returns correct placements for names when there are multiple votes', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
				votedSecondPublishedName: VOTED_2ND_NAME.id,
				votedThirdPublishedName: VOTED_3RD_NAME.id,
			});

			addMockVote(db, {
				voter: SECOND_VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_2ND_NAME.id,
				votedSecondPublishedName: VOTED_3RD_NAME.id,
				votedThirdPublishedName: SOME_OTHER_NAME.id,
			});

			const placements = voteService.getPlacements();

			makeSure(placements.map(toComparablePlacement)).is([
				{ name: VOTED_2ND_NAME.name, rank: 1, points: 5, firstPlaceVotes: 1, firstPlacePoints: 3, secondPlaceVotes: 1, secondPlacePoints: 2, thirdPlaceVotes: 0, thirdPlacePoints: 0 },
				{ name: VOTED_1ST_NAME.name, rank: 2, points: 3, firstPlaceVotes: 1, firstPlacePoints: 3, secondPlaceVotes: 0, secondPlacePoints: 0, thirdPlaceVotes: 0, thirdPlacePoints: 0 },
				{ name: VOTED_3RD_NAME.name, rank: 2, points: 3, firstPlaceVotes: 0, firstPlacePoints: 0, secondPlaceVotes: 1, secondPlacePoints: 2, thirdPlaceVotes: 1, thirdPlacePoints: 1 },
				{ name: SOME_OTHER_NAME.name, rank: 4, points: 1, firstPlaceVotes: 0, firstPlacePoints: 0, secondPlaceVotes: 0, secondPlacePoints: 0, thirdPlaceVotes: 1, thirdPlacePoints: 1 },
			]);
		});
	});
});
