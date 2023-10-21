const { getRandomHexColorNumber } = require("../functions");
const ProposedRule = require("./ProposedRule");
const Rule = require("./Rule");

class ProposedCreatoinRule extends ProposedRule {
	constructor({
		description = "",
		proposer = undefined,
		votes = [],
		type = undefined,
		number = undefined,
		message = undefined,
		color = getRandomHexColorNumber(),
		judgement_time = undefined,
	}) {
		super({description, proposer, votes, type: Rule.Types.Creation, number, message, color, judgement_time});
	}

	isProposedCreationRule(value) {
		return (
			super.isProposedRule(value) &&
			value.type === Rule.Types.Creation
		)
	}
}

module.exports = ProposedCreatoinRule;