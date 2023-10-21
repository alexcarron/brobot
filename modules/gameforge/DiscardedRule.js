const validator = require("../../utilities/validator");
const Rule = require("./Rule");
const Vote = require("./Vote");

class DiscardedRule extends Rule {
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
		super({description, proposer});
		this.votes = votes;
		this.type = type;
		this.number = number;
		this.message = message;
		this.color = color;

		this.setNumber(number)
		this.setType(type);
		// this.setJudgementTime(judgement_time);
	}

	setNumber(number) {
		this.number = number
	}

	setType(type) {
		if (!validator.isEnumValue(type, Rule.Types)) {
			console.log({type});
			throw new Error("Invalid type argument for ProposedRule class");
		}

		this.type = type
	}

	setJudgementTime(judgement_date_str) {
		if (typeof judgement_date_str !== "string") {
			this.judgement_time = undefined;
			return;
		}

		this.judgement_time = judgement_date_str;
	}

	async getMessage() {
		const proposed_rule_chnl = await ProposedRule.getProposedRuleChannel();
		return await getMessage(proposed_rule_chnl, this.message);
	}

	isDiscardedRule(value) {
		return (
			validator.isObject(value) &&
			validator.doesObjectHaveKeys(value, "description", "proposer", "votes", "type", "number", "message", "color", "judgement_time") &&
			typeof value.description === "string" &&
			validator.isArrayofType(value.votes, Vote.isVote) &&
			validator.isEnumValue(value.type, Rule.Types) &&
			validator.isInteger(this.number) &&
			validator.isInteger(this.color)
		)
	}
}

module.exports = DiscardedRule;