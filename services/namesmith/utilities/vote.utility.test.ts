import { isVote } from "./vote.utility";

describe('vote.utility', () => {
	describe('isVote()', () => {
		it('should return true if the value is an object with the expected properties of a vote', () => {
			expect(isVote({
				voterID: "voter-id",
				votedFirstPublishedName: null,
				votedSecondPublishedName: null,
				votedThirdPublishedName: null,
			})).toBe(true);
		});

		it('should return false if the value is undefined', () => {
			expect(isVote(undefined)).toBe(false);
		});

		it('should return false if the value is null', () => {
			expect(isVote(null)).toBe(false);
		});

		it('should return false if the value is a string', () => {
			expect(isVote("voter-id")).toBe(false);
		});

		it('should return false if the value is an empty object', () => {
			expect(isVote({})).toBe(false);
		});

		it('should return false if the value is an object with a missing property', () => {
			expect(isVote({
				voterID: "voter-id",
			})).toBe(false);
			expect(isVote({
				votedFirstPublishedName: null,
				votedSecondPublishedName: null,
				votedThirdPublishedName: null,
			})).toBe(false);
		});

		it('should return false if the voterID is not a string', () => {
			expect(isVote({
				voterID: 1,
				votedFirstPublishedName: null,
				votedSecondPublishedName: null,
				votedThirdPublishedName: null,
			})).toBe(false);
		});
	});
});
