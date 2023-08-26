const validator = require("../../utilities/validator");
const { generateRandomHexColorNumber } = require("../functions");
const Host = require("./Host");
const ProposedRule = require("./ProposedRule");
const Rule = require("./Rule");
const Vote = require("./Vote");

class ProposedModificationRule extends ProposedRule {
	constructor({
		description = "",
		proposer = undefined,
		votes = [],
		type = undefined,
		number = undefined,
		message = undefined,
		color = generateRandomHexColorNumber(),
		judgement_time = undefined,
		num_rule_modifying = undefined,
	}) {
		super({description, proposer, votes, type: Rule.Types.Modification, number, message, color, judgement_time});
		this.num_rule_modifying = num_rule_modifying

		this.setNumRuleModifying(num_rule_modifying);

		if (!this.isProposedModificationRule(this)) {
			console.log("\nINVALID PROPOSED MODIFICATION RULE:");
			console.log(this)
			throw new Error(`Invalid arguments for ProposedModificationRule object.`);
		}
	}

	setNumRuleModifying(num_rule_modifying) {
		if (
			!validator.isInteger(num_rule_modifying)
		) {
			console.log({num_rule_modifying})
			throw new Error("Invalid num_rule_modifying argument for ProposedModificationRule class.")
		}

		this.num_rule_modifying = num_rule_modifying;
	}

	isProposedModificationRule(value) {
		return (
			super.isProposedRule(value) &&
			validator.doesObjectHaveKeys(value, "num_rule_modifying") &&
			validator.isInteger(value.num_rule_modifying)
		)
	}


	// @ Override
	async toEmbed() {
		const rule_modifying = await global.Sandbox.getOfficialRuleFromNum(this.num_rule_modifying);

		const embed_msg = (await super.toEmbed()).setDescription(
			`**Rule To Modify**: \`${this.num_rule_modifying}) ${rule_modifying.description}\`\n` +
			`**Rule Modification**: \`${this.description}\`\n` +
			`**Proposer**: \`${this.proposer.name}\`\n`
		);

		return embed_msg;
	}
}

module.exports = ProposedModificationRule;