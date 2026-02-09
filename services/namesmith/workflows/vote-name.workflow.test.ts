import { makeSure } from "../../../utilities/jest/jest-utils";
import { getRandomUUID } from "../../../utilities/random-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { addMockVote } from "../mocks/mock-data/mock-votes";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { VoteService } from "../services/vote.service";
import { Player } from "../types/player.types";
import { Ranks, VoteID } from "../types/vote.types";
import { returnIfNotFailure } from "../utilities/workflow.utility";
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

	describe('addVote', () => {
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

		it('returns the correct missingRanks and otherRanksToVotedNames on success', () => {
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

			makeSure(result).hasOnlyProperties('missingRanks', 'otherRankToVotedName', 'playerPreviouslyInRank');

			const {missingRanks, otherRankToVotedName, playerPreviouslyInRank} = result;
			makeSure(missingRanks).containsOnly(Ranks.THIRD);
			makeSure(otherRankToVotedName).is(new Map([[
				Ranks.FIRST, 
				SOME_PLAYER.publishedName!
			]]));
			makeSure(playerPreviouslyInRank).is(null);
		});
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
});