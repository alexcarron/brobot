const validator = require("../../utilities/validator");
const { generateRandomHexColorNumber } = require("../functions");
const Host = require("./Host");
const ProposedRule = require("./ProposedRule");
const Rule = require("./Rule");
const Vote = require("./Vote");

class ProposedCreatoinRule extends ProposedRule {
	constructor({
		description = "",
		proposer = undefined,
		votes = [],
		type = undefined,
		number = undefined,
		message = undefined,
		color = generateRandomHexColorNumber(),
		judgement_time = undefined,
	}) {
		super({description, proposer, votes, type: Rule.Types.Creation, number, message, color, judgement_time});

		if (!this.isProposedCreationRule(this)) {
			console.log("\nINVALID PROPOSED CREATION RULE:");
			console.log(this)
			throw new Error(`Invalid arguments for ProposedCreatoinRule object.`);
		}
	}

	isProposedCreationRule(value) {
		return (
			super.isProposedRule(value) &&
			value.type === Rule.Types.Creation
		)
	}
}

module.exports = ProposedCreatoinRule;