const validator = require("../../utilities/validator");

class Vote {
	constructor({
		vote = undefined,
		voter_id = undefined,
	}) {
		this.vote = vote;
		this.voter_id = voter_id;

		if (!Vote.isVote(this)) {
			console.log("\nINVALID VOTE:");
			console.log(this)
			throw new Error(`Invalid arguments for Vote object.`);
		}
	}

	static Votes = {
		Approve: "Approve",
		Disapprove: "Disapprove",
		NoOpinion: "No Opinion",
	}

	static isVote(value) {
		return (
			validator.isObject(value) &&
			validator.doesObjectHaveKeys(value, "vote", "voter_id") &&
			typeof value.voter_id === 'string'
		)
	}
}

module.exports = Vote;