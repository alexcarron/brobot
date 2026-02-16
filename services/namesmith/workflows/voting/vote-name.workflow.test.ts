import { failTest, makeSure } from "../../../../utilities/jest/jest-utils";
import { getRandomUUID } from "../../../../utilities/random-utils";
import { DatabaseQuerier } from "../../database/database-querier";
import { addMockPlayer } from "../../mocks/mock-data/mock-players";
import { addMockVote } from "../../mocks/mock-data/mock-votes";
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { VoteService } from "../../services/vote.service";
import { Player } from "../../types/player.types";
import { Ranks, VoteID } from "../../types/vote.types";
import { returnIfNotFailure } from "../../utilities/workflow.utility";
import { voteName } from "./vote-name.workflow";

describe('vote-name.workflow', () => {
	let voteService: VoteService;
	let db: DatabaseQuerier;

	let SOME_USER_ID: VoteID;
	let SOME_PLAYER: Player;
	let SOME_OTHER_PLAYER: Player;

	beforeEach(() => {
		({ db, voteService } = setupMockNamesmith());

		SOME_USER_ID = getRandomUUID();
		SOME_PLAYER = addMockPlayer(db);
		SOME_OTHER_PLAYER = addMockPlayer(db);
	});

	describe('voteName()', () => {
		it('creates a vote from the given user voting that player in 1st', () => {
			voteName({
				voterUserID: SOME_USER_ID,
				votedPlayer: SOME_PLAYER,
				rankVotingFor: Ranks.FIRST,
			});

			const vote = voteService.resolveVote(SOME_USER_ID);
			makeSure(vote).hasOnlyProperties({
				voterID: SOME_USER_ID,
				votedFirstPlayer: SOME_PLAYER,
				votedSecondPlayer: null,
				votedThirdPlayer: null,
			});
		});

		it('updates an existing vote with a new vote for a player at 2nd', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedFirstPlayer: SOME_PLAYER
			});

			voteName({
				voterUserID: SOME_USER_ID,
				votedPlayer: SOME_OTHER_PLAYER,
				rankVotingFor: Ranks.SECOND,
			});

			const vote = voteService.resolveVote(SOME_USER_ID);
			makeSure(vote).hasOnlyProperties({
				voterID: SOME_USER_ID,
				votedFirstPlayer: SOME_PLAYER,
				votedSecondPlayer: SOME_OTHER_PLAYER,
				votedThirdPlayer: null,
			});
		});

		it('replaces an existing vote for a player in 1st', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedFirstPlayer: SOME_PLAYER
			});

			voteName({
				voterUserID: SOME_USER_ID,
				votedPlayer: SOME_OTHER_PLAYER,
				rankVotingFor: Ranks.FIRST,
			});

			const vote = voteService.resolveVote(SOME_USER_ID);
			makeSure(vote).hasOnlyProperties({
				voterID: SOME_USER_ID,
				votedFirstPlayer: SOME_OTHER_PLAYER,
				votedSecondPlayer: null,
				votedThirdPlayer: null,
			});
		});

		it('returns the correct missingRanks, otherRanksToVotedNames, rankToVotedNames, playerPreviouslyInRank, and previousRankOfPlayer on success', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedFirstPlayer: SOME_PLAYER,
			});

			const result = returnIfNotFailure(
				voteName({
					voterUserID: SOME_USER_ID,
					votedPlayer: SOME_OTHER_PLAYER,
					rankVotingFor: Ranks.SECOND,
				})
			);

			makeSure(result).hasOnlyProperties('missingRanks', 'otherRankToVotedName', 'rankToVotedName', 'playerPreviouslyInRank', 'previousRankOfPlayer');

			const {missingRanks, rankToVotedName, otherRankToVotedName, playerPreviouslyInRank, previousRankOfPlayer} = result;
			makeSure(missingRanks).containsOnly(Ranks.THIRD);
			makeSure(otherRankToVotedName).is(new Map([[
				Ranks.FIRST, 
				SOME_PLAYER.publishedName!
			]]));
			makeSure(rankToVotedName).is(new Map([[
				Ranks.FIRST, 
				SOME_PLAYER.publishedName!
			], [
				Ranks.SECOND, 
				SOME_OTHER_PLAYER.publishedName!
			]]));
			makeSure(playerPreviouslyInRank).is(null);
			makeSure(previousRankOfPlayer).is(null);
		});

		it('returns a success object with playerPreviouslyInRank as the player who was originally voted 1st', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedFirstPlayer: SOME_PLAYER,
			});
	
			const result = returnIfNotFailure(
				voteName({
					voterUserID: SOME_USER_ID,
					votedPlayer: SOME_OTHER_PLAYER,
					rankVotingFor: Ranks.FIRST,
				})
			);
	
			const {playerPreviouslyInRank} = result;
			makeSure(playerPreviouslyInRank).is(SOME_PLAYER);
		});

		it('returns a votedOutOfOrder failure with correct missingRanks if a user votes 2nd place vote when they dont have a 1st place vote', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedSecondPlayer: SOME_PLAYER,
			});

			const result = voteName({
				voterUserID: SOME_USER_ID,
				votedPlayer: SOME_OTHER_PLAYER,
				rankVotingFor: Ranks.SECOND,
			});

			if (!result.isOutOfOrderVote())
				failTest(`Expected the voteName workflow to return a votedOutOfOrder failure, but it was not`);

			makeSure(result).hasProperties('missingRanks', 'rankToVotedName');
			makeSure(result.missingRanks).containsOnly(Ranks.FIRST);
			makeSure(result.rankToVotedName).is(new Map([[
				Ranks.SECOND, 
				SOME_PLAYER.publishedName!
			]]));
		});

		it('returns a votedOutOfOrder failure with correct missingRanks if a user votes 3rd place vote when they dont have a 1st or 2nd place vote', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedThirdPlayer: SOME_PLAYER,
			});

			const result = voteName({
				voterUserID: SOME_USER_ID,
				votedPlayer: SOME_OTHER_PLAYER,
				rankVotingFor: Ranks.THIRD,
			});

			if (!result.isOutOfOrderVote())
				failTest(`Expected the voteName workflow to return a votedOutOfOrder failure, but it was not`);

			makeSure(result).hasProperties('missingRanks', 'rankToVotedName');
			makeSure(result.missingRanks).containsOnly(Ranks.FIRST, Ranks.SECOND);
			makeSure(result.rankToVotedName).is(new Map([[
				Ranks.THIRD, 
				SOME_PLAYER.publishedName!
			]]));
		});

		it('returns a votedOutOfOrder failure with correct missingRanks if a user votes 3rd place vote when they dont have a 2nd place vote', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedFirstPlayer: SOME_PLAYER,
			});

			const result = voteName({
				voterUserID: SOME_USER_ID,
				votedPlayer: SOME_OTHER_PLAYER,
				rankVotingFor: Ranks.THIRD,
			});

			if (!result.isOutOfOrderVote())
				failTest(`Expected the voteName workflow to return a votedOutOfOrder failure, but it was not`);

			makeSure(result).hasProperties('missingRanks', 'rankToVotedName');
			makeSure(result.missingRanks).containsOnly(Ranks.SECOND);
			makeSure(result.rankToVotedName).is(new Map([
				[Ranks.FIRST, SOME_PLAYER.publishedName!],
			]));
		});

		it('returns a repeatedVote failure if a user tries to vote the same player in the same rank', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedFirstPlayer: SOME_PLAYER,
			});

			const result = voteName({
				voterUserID: SOME_USER_ID,
				votedPlayer: SOME_PLAYER,
				rankVotingFor: Ranks.FIRST,
			});

			if (!result.isRepeatedVote())
				failTest(`Expected the voteName workflow to return a repeatedVote failure, but it was not`);

			makeSure(result).hasProperty('rankToVotedName');
			makeSure(result.rankToVotedName).is(new Map([
				[Ranks.FIRST, SOME_PLAYER.publishedName!],
			]));
		});
	});
});