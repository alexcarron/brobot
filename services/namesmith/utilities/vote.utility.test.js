const { isVote } = require("./vote.utility");

describe('vote.utility', () => {
	describe('isVote()', () => {
		it('should return true if the value is an object with the expected properties of a vote', () => {
			expect(isVote({
				voterID: "voter-id",
				playerVotedForID: "player-id",
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
				playerVotedForID: "player-id",
			})).toBe(false);
		});

		it('should return false if the value is an object with invalid property types', () => {
			expect(isVote({
				voterID: "voter-id",
				playerVotedForID: 1,
			})).toBe(false);
		});
	});
});
