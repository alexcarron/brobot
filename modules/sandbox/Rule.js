const validator = require("../../utilities/validator");
const Host = require("./Host");

class Rule {
	constructor({
		description = "",
		proposer = undefined,
	}) {
		this.description = description;
		this.proposer = null;

		this.setProposer(proposer);

		if (!this.isRule(this)) {
			console.log("\nINVALID RULE:");
			console.log(this)
			throw new Error(`Invalid arguments for Rule object.`);
		}
	}

	static NUM_STARTING_RULES = 24;

	static Types = {
		Creation: "Creation",
		Modification: "Modification",
		Removal: "Removal"
	}

	setProposer(proposer) {
		if (!Host.isHost(proposer)) {
			console.log({proposer})
			throw new Error(`Invalid proposer argument for Rule`);
		}

		this.proposer = proposer
	}

	isRule(value) {
		return (
			validator.isObject(value) &&
			validator.doesObjectHaveKeys(value, "description", "proposer") &&
			typeof value.description === "string" &&
			Host.isHost(value.proposer)
		)
	}
}

module.exports = Rule;