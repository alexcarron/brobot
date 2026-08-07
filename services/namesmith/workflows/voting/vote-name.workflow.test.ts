import { failTest, makeSure } from "../../../../utilities/jest/jest-utils";
import { getRandomUUID } from "../../../../utilities/random-utils";
import { DatabaseQuerier } from "../../database/database-querier";
import { addMockVote } from "../../mocks/mock-data/mock-votes";
import { addMockPublishedName } from "../../mocks/mock-data/mock-published-names";
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { VoteService } from "../../services/vote.service";
import { PublishedName } from "../../types/published-name.types";
import { Ranks, VoteID } from "../../types/vote.types";
import { returnIfNotFailure } from "../../utilities/workflow.utility";
import { voteName } from "./vote-name.workflow";

describe('vote-name.workflow', () => {
	let voteService: VoteService;
	let db: DatabaseQuerier;

	let SOME_USER_ID: VoteID;
	let SOME_NAME: PublishedName;
	let SOME_OTHER_NAME: PublishedName;

	beforeEach(() => {
		({ db, voteService } = setupMockNamesmith());

		SOME_USER_ID = getRandomUUID();
		SOME_NAME = addMockPublishedName(db, {name: 'Some Name'});
		SOME_OTHER_NAME = addMockPublishedName(db, {name: 'Some Other Name'});
	});

	describe('voteName()', () => {
		it('creates a vote from the given user voting that name in 1st', () => {
			voteName({
				voterUserID: SOME_USER_ID,
				votedPublishedName: SOME_NAME,
				rankVotingFor: Ranks.FIRST,
			});

			const vote = voteService.resolveVote(SOME_USER_ID);
			makeSure(vote).hasOnlyProperties({
				voterID: SOME_USER_ID,
				votedFirstPublishedName: SOME_NAME,
				votedSecondPublishedName: null,
				votedThirdPublishedName: null,
			});
		});

		it('updates an existing vote with a new vote for a name at 2nd', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedFirstPublishedName: SOME_NAME
			});

			voteName({
				voterUserID: SOME_USER_ID,
				votedPublishedName: SOME_OTHER_NAME,
				rankVotingFor: Ranks.SECOND,
			});

			const vote = voteService.resolveVote(SOME_USER_ID);
			makeSure(vote).hasOnlyProperties({
				voterID: SOME_USER_ID,
				votedFirstPublishedName: SOME_NAME,
				votedSecondPublishedName: SOME_OTHER_NAME,
				votedThirdPublishedName: null,
			});
		});

		it('replaces an existing vote for a name in 1st', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedFirstPublishedName: SOME_NAME
			});

			voteName({
				voterUserID: SOME_USER_ID,
				votedPublishedName: SOME_OTHER_NAME,
				rankVotingFor: Ranks.FIRST,
			});

			const vote = voteService.resolveVote(SOME_USER_ID);
			makeSure(vote).hasOnlyProperties({
				voterID: SOME_USER_ID,
				votedFirstPublishedName: SOME_OTHER_NAME,
				votedSecondPublishedName: null,
				votedThirdPublishedName: null,
			});
		});

		it('returns the correct missingRanks, otherRanksToVotedNames, rankToVotedNames, publishedNamePreviouslyInRank, and previousRankOfPublishedName on success', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedFirstPublishedName: SOME_NAME,
			});

			const result = returnIfNotFailure(
				voteName({
					voterUserID: SOME_USER_ID,
					votedPublishedName: SOME_OTHER_NAME,
					rankVotingFor: Ranks.SECOND,
				})
			);

			makeSure(result).hasOnlyProperties('missingRanks', 'otherRankToVotedName', 'rankToVotedName', 'publishedNamePreviouslyInRank', 'previousRankOfPublishedName');

			const {missingRanks, rankToVotedName, otherRankToVotedName, publishedNamePreviouslyInRank, previousRankOfPublishedName} = result;
			makeSure(missingRanks).containsOnly(Ranks.THIRD);
			makeSure(otherRankToVotedName).is(new Map([[
				Ranks.FIRST,
				SOME_NAME.name
			]]));
			makeSure(rankToVotedName).is(new Map([[
				Ranks.FIRST,
				SOME_NAME.name
			], [
				Ranks.SECOND,
				SOME_OTHER_NAME.name
			]]));
			makeSure(publishedNamePreviouslyInRank).is(null);
			makeSure(previousRankOfPublishedName).is(null);
		});

		it('returns a success object with publishedNamePreviouslyInRank as the name that was originally voted 1st', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedFirstPublishedName: SOME_NAME,
			});

			const result = returnIfNotFailure(
				voteName({
					voterUserID: SOME_USER_ID,
					votedPublishedName: SOME_OTHER_NAME,
					rankVotingFor: Ranks.FIRST,
				})
			);

			const {publishedNamePreviouslyInRank} = result;
			makeSure(publishedNamePreviouslyInRank).is(SOME_NAME);
		});

		it('returns a votedOutOfOrder failure with correct missingRanks if a user votes 2nd place vote when they dont have a 1st place vote', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedSecondPublishedName: SOME_NAME,
			});

			const result = voteName({
				voterUserID: SOME_USER_ID,
				votedPublishedName: SOME_OTHER_NAME,
				rankVotingFor: Ranks.SECOND,
			});

			if (!result.isOutOfOrderVote())
				failTest(`Expected the voteName workflow to return a votedOutOfOrder failure, but it was not`);

			makeSure(result).hasProperties('missingRanks', 'rankToVotedName');
			makeSure(result.missingRanks).containsOnly(Ranks.FIRST);
			makeSure(result.rankToVotedName).is(new Map([[
				Ranks.SECOND,
				SOME_NAME.name
			]]));
		});

		it('returns a votedOutOfOrder failure with correct missingRanks if a user votes 3rd place vote when they dont have a 1st or 2nd place vote', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedThirdPublishedName: SOME_NAME,
			});

			const result = voteName({
				voterUserID: SOME_USER_ID,
				votedPublishedName: SOME_OTHER_NAME,
				rankVotingFor: Ranks.THIRD,
			});

			if (!result.isOutOfOrderVote())
				failTest(`Expected the voteName workflow to return a votedOutOfOrder failure, but it was not`);

			makeSure(result).hasProperties('missingRanks', 'rankToVotedName');
			makeSure(result.missingRanks).containsOnly(Ranks.FIRST, Ranks.SECOND);
			makeSure(result.rankToVotedName).is(new Map([[
				Ranks.THIRD,
				SOME_NAME.name
			]]));
		});

		it('returns a votedOutOfOrder failure with correct missingRanks if a user votes 3rd place vote when they dont have a 2nd place vote', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedFirstPublishedName: SOME_NAME,
			});

			const result = voteName({
				voterUserID: SOME_USER_ID,
				votedPublishedName: SOME_OTHER_NAME,
				rankVotingFor: Ranks.THIRD,
			});

			if (!result.isOutOfOrderVote())
				failTest(`Expected the voteName workflow to return a votedOutOfOrder failure, but it was not`);

			makeSure(result).hasProperties('missingRanks', 'rankToVotedName');
			makeSure(result.missingRanks).containsOnly(Ranks.SECOND);
			makeSure(result.rankToVotedName).is(new Map([
				[Ranks.FIRST, SOME_NAME.name],
			]));
		});

		it('returns a repeatedVote failure if a user tries to vote the same name in the same rank', () => {
			addMockVote(db, {
				voter: SOME_USER_ID,
				votedFirstPublishedName: SOME_NAME,
			});

			const result = voteName({
				voterUserID: SOME_USER_ID,
				votedPublishedName: SOME_NAME,
				rankVotingFor: Ranks.FIRST,
			});

			if (!result.isRepeatedVote())
				failTest(`Expected the voteName workflow to return a repeatedVote failure, but it was not`);

			makeSure(result).hasProperty('rankToVotedName');
			makeSure(result.rankToVotedName).is(new Map([
				[Ranks.FIRST, SOME_NAME.name],
			]));
		});
	});
});
