import { makeSure } from "../../../../utilities/jest/jest-utils";
import { DatabaseQuerier } from "../../database/database-querier";
import { addMockPlayer } from "../../mocks/mock-data/mock-players";
import { addMockVote } from "../../mocks/mock-data/mock-votes";
import { addMockPublishedName } from "../../mocks/mock-data/mock-published-names";
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { Player } from "../../types/player.types";
import { PublishedName } from "../../types/published-name.types";
import { Ranks } from "../../types/vote.types";
import { seeMyVotes } from "./see-my-votes.workflow";

describe('see-my-votes.workflow', () => {
	let db: DatabaseQuerier;

	let VOTER_PLAYER: Player;
	let VOTED_1ST_NAME: PublishedName;
	let VOTED_2ND_NAME: PublishedName;
	let VOTED_3RD_NAME: PublishedName;

	beforeEach(() => {
		({ db } = setupMockNamesmith());

		VOTER_PLAYER = addMockPlayer(db);
		VOTED_1ST_NAME = addMockPublishedName(db, {name: '1st Name'});
		VOTED_2ND_NAME = addMockPublishedName(db, {name: '2nd Name'});
		VOTED_3RD_NAME = addMockPublishedName(db, {name: '3rd Name'});
	});

	describe(`seeMyVotes()`, () => {
		it(`returns the correct rankToVotedName map when all ranks are present`, () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME,
				votedSecondPublishedName: VOTED_2ND_NAME,
				votedThirdPublishedName: VOTED_3RD_NAME,
			});

			const result = seeMyVotes({voterUserID: VOTER_PLAYER.id});
			makeSure(result.rankToVotedName).is(new Map([
				[Ranks.FIRST, VOTED_1ST_NAME.name],
				[Ranks.SECOND, VOTED_2ND_NAME.name],
				[Ranks.THIRD, VOTED_3RD_NAME.name],
			]));
		});

		it('returns a rankToVotedName map with only the ranks that have been voted for', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPublishedName: VOTED_1ST_NAME,
			});

			const result = seeMyVotes({voterUserID: VOTER_PLAYER.id});
			makeSure(result.rankToVotedName).is(new Map([
				[Ranks.FIRST, VOTED_1ST_NAME.name],
			]));
		});

		it('returns an empty rankToVotedName map when the user has not voted', () => {
			const result = seeMyVotes({voterUserID: VOTER_PLAYER.id});
			makeSure(result.rankToVotedName).is(new Map());
		});
	});
});
