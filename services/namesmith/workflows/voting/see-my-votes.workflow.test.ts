import { makeSure } from "../../../../utilities/jest/jest-utils";
import { DatabaseQuerier } from "../../database/database-querier";
import { addMockPlayer } from "../../mocks/mock-data/mock-players";
import { addMockVote } from "../../mocks/mock-data/mock-votes";
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { Player } from "../../types/player.types";
import { Ranks } from "../../types/vote.types";
import { seeMyVotes } from "./see-my-votes.workflow";

describe('see-my-votes.workflow', () => {
	let db: DatabaseQuerier;

	let VOTER_PLAYER: Player;
	let VOTED_1ST_PLAYER: Player;
	let VOTED_2ND_PLAYER: Player;
	let VOTED_3RD_PLAYER: Player;

	beforeEach(() => {
		({ db } = setupMockNamesmith());

		VOTER_PLAYER = addMockPlayer(db);
		VOTED_1ST_PLAYER = addMockPlayer(db, {publishedName: '1st Player'});
		VOTED_2ND_PLAYER = addMockPlayer(db, {publishedName: '2nd Player'});
		VOTED_3RD_PLAYER = addMockPlayer(db, {publishedName: '3rd Player'});
	});

	describe(`seeMyVotes()`, () => {
		it(`returns the correct rankToVotedName map when all ranks are present`, () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER,
				votedSecondPlayer: VOTED_2ND_PLAYER,
				votedThirdPlayer: VOTED_3RD_PLAYER,
			});

			const result = seeMyVotes({voterUserID: VOTER_PLAYER.id});
			makeSure(result.rankToVotedName).is(new Map([
				[Ranks.FIRST, VOTED_1ST_PLAYER.publishedName],
				[Ranks.SECOND, VOTED_2ND_PLAYER.publishedName],
				[Ranks.THIRD, VOTED_3RD_PLAYER.publishedName],
			]));
		});

		it('returns a rankToVotedName map with only the ranks that have been voted for', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER,
			});

			const result = seeMyVotes({voterUserID: VOTER_PLAYER.id});
			makeSure(result.rankToVotedName).is(new Map([
				[Ranks.FIRST, VOTED_1ST_PLAYER.publishedName],
			]));
		});

		it('returns an empty rankToVotedName map when the user has not voted', () => {
			const result = seeMyVotes({voterUserID: VOTER_PLAYER.id});
			makeSure(result.rankToVotedName).is(new Map());
		});
	});
});