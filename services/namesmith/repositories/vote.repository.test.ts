import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_PUBLISHED_NAME_ID, INVALID_VOTE_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPublishedName } from "../mocks/mock-data/mock-published-names";
import { addMockVote } from "../mocks/mock-data/mock-votes";
import { PublishedName } from "../types/published-name.types";
import { Vote } from "../types/vote.types";
import { PublishedNameNotFoundError, VoteNotFoundError } from "../utilities/error.utility";
import { VoteRepository } from "./vote.repository";

describe('VoteRepository', () => {
	let db: DatabaseQuerier;
	let voteRepository: VoteRepository;

	let SOME_VOTE: Vote;
	let SOME_NAME: PublishedName;
	let SOME_OTHER_NAME: PublishedName;
	let SOME_THIRD_NAME: PublishedName;
	let SOME_FOURTH_NAME: PublishedName;

	beforeEach(() => {
		voteRepository = VoteRepository.asMock();
		db = voteRepository.db;

		SOME_VOTE = addMockVote(db);
		SOME_NAME = addMockPublishedName(db);
		SOME_OTHER_NAME = addMockPublishedName(db);
		SOME_THIRD_NAME = addMockPublishedName(db);
		SOME_FOURTH_NAME = addMockPublishedName(db);
	})

	describe('getVotes()', () => {
		it('returns a list of votes', () => {
			const votes = voteRepository.getVotes();
			makeSure(votes).contains(SOME_VOTE);
			makeSure(votes).haveOnlyProperties('voterID', 'votedFirstPublishedName', 'votedSecondPublishedName', 'votedThirdPublishedName');
		});
	});

	describe('getVoteByVoterID()', () => {
		it('returns a vote by voterID', () => {
			const vote = voteRepository.getVoteByVoterID(SOME_VOTE.voterID);
			makeSure(vote).is(SOME_VOTE);
		});

		it('returns null if no vote is found', () => {
			const vote = voteRepository.getVoteByVoterID(INVALID_VOTE_ID);
			makeSure(vote).isNull();
		});
	});

	describe('.doesVoteExist()', () => {

		it('returns true if the vote exists with given voterID', () => {
			const result = voteRepository.doesVoteExist(SOME_VOTE.voterID);
			expect(result).toBe(true);
		});

		it('returns false if the vote does not exist with given voterID', () => {
			const result = voteRepository.doesVoteExist(INVALID_VOTE_ID);
			expect(result).toBe(false);
		});
	})

	describe('addVote()', () => {
		it('adds a new vote', () => {
			voteRepository.addVote({
				voter: "10000001",
				votedFirstPublishedName: SOME_NAME.id,
				votedSecondPublishedName: SOME_OTHER_NAME.id,
				votedThirdPublishedName: SOME_THIRD_NAME.id,
			});
			const vote = voteRepository.getVoteOrThrow("10000001");
			makeSure(vote.voterID).is("10000001");
			makeSure(vote.votedFirstPublishedName!.id).is(SOME_NAME.id);
			makeSure(vote.votedSecondPublishedName!.id).is(SOME_OTHER_NAME.id);
			makeSure(vote.votedThirdPublishedName!.id).is(SOME_THIRD_NAME.id);
		});

		it('adds a new vote with no votes', () => {
			voteRepository.addVote({
				voter: "10000001",
			});
			const vote = voteRepository.getVoteOrThrow("10000001");
			makeSure(vote.voterID).is("10000001");
			makeSure(vote.votedFirstPublishedName).isNull();
			makeSure(vote.votedSecondPublishedName).isNull();
			makeSure(vote.votedThirdPublishedName).isNull();
		});

		it('adds a new vote with some null votes', () => {
			voteRepository.addVote({
				voter: "10000001",
				votedFirstPublishedName: null,
				votedSecondPublishedName: SOME_OTHER_NAME.id,
				votedThirdPublishedName: null,
			});
			const vote = voteRepository.getVoteOrThrow("10000001");
			makeSure(vote.voterID).is("10000001");
			makeSure(vote.votedFirstPublishedName).isNull();
			makeSure(vote.votedSecondPublishedName!.id).is(SOME_OTHER_NAME.id);
			makeSure(vote.votedThirdPublishedName).isNull();
		});

		it('throws an error if the voter ID already exists', () => {
			const existingVote = addMockVote(db);

			expect(() => voteRepository.addVote({
				voter: existingVote.voterID,
				votedFirstPublishedName: SOME_OTHER_NAME.id,
			})).toThrow();
		});
	});

	describe('updateVote()', () => {
		it('changes the vote of a user', () => {
			voteRepository.addVote({
				voter: "10000001",
				votedFirstPublishedName: SOME_OTHER_NAME.id,
				votedSecondPublishedName: SOME_THIRD_NAME.id,
				votedThirdPublishedName: SOME_FOURTH_NAME,
			})

			const vote = voteRepository.updateVote({
				voter: "10000001",
				votedFirstPublishedName: SOME_THIRD_NAME.id,
				votedSecondPublishedName: SOME_OTHER_NAME.id,
				votedThirdPublishedName: SOME_THIRD_NAME,
			});

			makeSure(vote.voterID).is("10000001");
			makeSure(vote.votedFirstPublishedName!.id).is(SOME_THIRD_NAME.id);
			makeSure(vote.votedSecondPublishedName!.id).is(SOME_OTHER_NAME.id);
			makeSure(vote.votedThirdPublishedName!.id).is(SOME_THIRD_NAME.id);

			const resolvedVote = voteRepository.getVoteByVoterID("10000001");

			makeSure(resolvedVote).is(vote);
		});

		it('can change votes to null', () => {
			voteRepository.addVote({
				voter: "10000001",
				votedFirstPublishedName: SOME_OTHER_NAME.id,
				votedSecondPublishedName: SOME_THIRD_NAME.id,
				votedThirdPublishedName: SOME_FOURTH_NAME,
			})

			const vote = voteRepository.updateVote({
				voter: "10000001",
				votedFirstPublishedName: null,
				votedSecondPublishedName: null,
				votedThirdPublishedName: null,
			});

			makeSure(vote.votedFirstPublishedName).isNull();
			makeSure(vote.votedSecondPublishedName).isNull();
			makeSure(vote.votedThirdPublishedName).isNull();

			const resolvedVote = voteRepository.getVoteByVoterID("10000001");

			makeSure(resolvedVote).is(vote);
		});

		it('throws an error if the voter ID does not exist', () => {
			makeSure(() => voteRepository.updateVote({
				voter: INVALID_VOTE_ID,
				votedFirstPublishedName: SOME_OTHER_NAME.id,
			})).throws(VoteNotFoundError);
		});

		it('throws an error if the published name ID does not exist', () => {
			voteRepository.addVote({
				voter: "10000001",
				votedFirstPublishedName: SOME_OTHER_NAME.id
			})

			makeSure(() => voteRepository.updateVote({
				voter: "10000001",
				votedFirstPublishedName: INVALID_PUBLISHED_NAME_ID,
			})).throws(PublishedNameNotFoundError);
		});
	});

	describe('deleteVote()', () => {
		it('deletes a vote by voterID', () => {
			voteRepository.addVote({
				voter: "10000001",
				votedFirstPublishedName: SOME_OTHER_NAME.id
			});
			voteRepository.removeVote("10000001");
			const result = voteRepository.getVoteByVoterID("10000001");
			expect(result).toBeNull();
		});

		it('throws an error if the voter ID does not exist', () => {
			expect(() => voteRepository.removeVote(INVALID_VOTE_ID)).toThrow();
		});
	});

	describe('reset()', () => {
		it('resets the vote repository', () => {
			voteRepository.removeVotes();
			const result = voteRepository.getVotes();
			expect(result).toEqual([]);
		});
	});
})
