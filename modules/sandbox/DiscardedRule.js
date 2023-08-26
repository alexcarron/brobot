const validator = require("../../utilities/validator");
const Host = require("./Host");
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
		color = generateRandomHexColorNumber(),
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
		this.setJudgementTime(judgement_time);

		if (!this.isDiscardedRule(this)) {
			console.log("\nINVALID DISCARDED RULE:");
			console.log(this)
			throw new Error(`Invalid arguments for DiscardedRule object.`);
		}
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
			Host.isHost(value.proposer) &&
			validator.isArrayofType(value.votes, Vote.isVote) &&
			validator.isEnumValue(value.type, Rule.Types) &&
			validator.isInteger(this.number) &&
			validator.isInteger(this.color)
		)
	}
}

module.exports = DiscardedRule;