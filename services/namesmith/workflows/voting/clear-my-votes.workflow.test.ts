import { makeSure } from "../../../../utilities/jest/jest-utils";
import { DatabaseQuerier } from "../../database/database-querier";
import { addMockPlayer } from "../../mocks/mock-data/mock-players";
import { addMockVote } from "../../mocks/mock-data/mock-votes";
import { addMockPublishedName } from "../../mocks/mock-data/mock-published-names";
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { VoteService } from "../../services/vote.service";
import { Player } from "../../types/player.types";
import { PublishedName } from "../../types/published-name.types";
import { Ranks } from "../../types/vote.types";
import { clearMyVotes } from "./clear-my-votes.workflow";

describe('clear-my-votes.workflow', () => {
	let voteService: VoteService;
	let db: DatabaseQuerier;

	let VOTER_PLAYER: Player;
	let VOTED_1ST_NAME: PublishedName;
	let VOTED_2ND_NAME: PublishedName;
	let VOTED_3RD_NAME: PublishedName;

	beforeEach(() => {
		({ db, voteService } = setupMockNamesmith());

		VOTER_PLAYER = addMockPlayer(db);
		VOTED_1ST_NAME = addMockPublishedName(db, {name: '1st Name'});
		VOTED_2ND_NAME = addMockPublishedName(db, {name: '2nd Name'});
		VOTED_3RD_NAME = addMockPublishedName(db, {name: '3rd Name'});
	});

	describe(`clearMyVotes()`, () => {
		it('deletes the vote of the given user', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME.id,
			});

			makeSure(voteService.doesVoteExist(VOTER_PLAYER.id)).is(true);

			clearMyVotes({voterUserID: VOTER_PLAYER.id});

			makeSure(voteService.doesVoteExist(VOTER_PLAYER.id)).is(false);
		});

		it(`returns the correct rankToVotedPublishedName map when all ranks are present`, () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME,
				votedSecondPublishedName: VOTED_2ND_NAME,
				votedThirdPublishedName: VOTED_3RD_NAME,
			});

			const result = clearMyVotes({voterUserID: VOTER_PLAYER.id});
			makeSure(result.rankToVotedPublishedName).is(new Map([
				[Ranks.FIRST, VOTED_1ST_NAME],
				[Ranks.SECOND, VOTED_2ND_NAME],
				[Ranks.THIRD, VOTED_3RD_NAME],
			]));
		});

		it('returns a rankToVotedPublishedName map with only the ranks that have been voted for', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME,
			});

			const result = clearMyVotes({voterUserID: VOTER_PLAYER.id});
			makeSure(result.rankToVotedPublishedName).is(new Map([
				[Ranks.FIRST, VOTED_1ST_NAME],
			]));
		});

		it('returns an empty rankToVotedPublishedName map when the user has not voted', () => {
			const result = clearMyVotes({voterUserID: VOTER_PLAYER.id});
			makeSure(result.rankToVotedPublishedName).is(new Map());
		});
	});
});
