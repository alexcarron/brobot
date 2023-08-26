const validator = require("../../utilities/validator");
const Host = require("./Host");

class Vote {
	constructor({
		doesApprove = undefined,
		voter_id = undefined,
	}) {
		console.log({doesApprove, voter_id})
		this.doesApprove = doesApprove;
		this.voter_id = voter_id;

		if (!Vote.isVote(this)) {
			console.log("\nINVALID VOTE:");
			console.log(this)
			throw new Error(`Invalid arguments for Vote object.`);
		}
	}

	static isVote(value) {
		return (
			validator.isObject(value) &&
			validator.doesObjectHaveKeys(value, "doesApprove", "voter_id") &&
			typeof value.voter_id === 'string'
		)
	}
}

module.exports = Vote;