import { makeSure } from "../../../../utilities/jest/jest-utils";
import { DatabaseQuerier } from "../../database/database-querier";
import { addMockPlayer } from "../../mocks/mock-data/mock-players";
import { addMockVote } from "../../mocks/mock-data/mock-votes";
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { VoteService } from "../../services/vote.service";
import { Player } from "../../types/player.types";
import { Ranks } from "../../types/vote.types";
import { clearMyVotes } from "./clear-my-votes.workflow";

describe('clear-my-votes.workflow', () => {
	let voteService: VoteService;
	let db: DatabaseQuerier;

	let VOTER_PLAYER: Player;
	let VOTED_1ST_PLAYER: Player;
	let VOTED_2ND_PLAYER: Player;
	let VOTED_3RD_PLAYER: Player;

	beforeEach(() => {
		({ db, voteService } = setupMockNamesmith());

		VOTER_PLAYER = addMockPlayer(db);
		VOTED_1ST_PLAYER = addMockPlayer(db, {publishedName: '1st Player'});
		VOTED_2ND_PLAYER = addMockPlayer(db, {publishedName: '2nd Player'});
		VOTED_3RD_PLAYER = addMockPlayer(db, {publishedName: '3rd Player'});
	});

	describe(`clearMyVotes()`, () => {
		it('deletes the vote of the given user', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER.id,
			});

			makeSure(voteService.doesVoteExist(VOTER_PLAYER.id)).is(true);

			clearMyVotes({voterUserID: VOTER_PLAYER.id});

			makeSure(voteService.doesVoteExist(VOTER_PLAYER.id)).is(false);
		});

		it(`returns the correct rankToVotedPlayer map when all ranks are present`, () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER,
				votedSecondPlayer: VOTED_2ND_PLAYER,
				votedThirdPlayer: VOTED_3RD_PLAYER,
			});

			const result = clearMyVotes({voterUserID: VOTER_PLAYER.id});
			makeSure(result.rankToVotedPlayer).is(new Map([
				[Ranks.FIRST, VOTED_1ST_PLAYER],
				[Ranks.SECOND, VOTED_2ND_PLAYER],
				[Ranks.THIRD, VOTED_3RD_PLAYER],
			]));
		});

		it('returns a rankToVotedPlayer map with only the ranks that have been voted for', () => {
			addMockVote(db, {
				voter: VOTER_PLAYER.id,
				votedFirstPlayer: VOTED_1ST_PLAYER,
			});

			const result = clearMyVotes({voterUserID: VOTER_PLAYER.id});
			makeSure(result.rankToVotedPlayer).is(new Map([
				[Ranks.FIRST, VOTED_1ST_PLAYER],
			]));
		});

		it('returns an empty rankToVotedPlayer map when the user has not voted', () => {
			const result = clearMyVotes({voterUserID: VOTER_PLAYER.id});
			makeSure(result.rankToVotedPlayer).is(new Map());
		});
	});
});