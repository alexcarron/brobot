const validator = require("../../utilities/validator");
const { generateRandomHexColorNumber } = require("../functions");
const ProposedRule = require("./ProposedRule");
const Rule = require("./Rule");

class ProposedRemovalRule extends ProposedRule {
	constructor({
		description = "",
		proposer = undefined,
		votes = [],
		type = undefined,
		number = undefined,
		message = undefined,
		color = generateRandomHexColorNumber(),
		judgement_time = undefined,
		num_rule_removing = undefined,
	}) {
		super({description, proposer, votes, type: Rule.Types.Removal, number, message, color, judgement_time});
		this.num_rule_removing = num_rule_removing

		this.setNumRuleRemoving(num_rule_removing);

		if (!this.isProposedRemovalRule(this)) {
			console.log("\nINVALID PROPOSED REMOVAL RULE:");
			console.log(this)
			throw new Error(`Invalid arguments for ProposedRemovalRule object.`);
		}
	}

	setNumRuleRemoving(num_rule_removing) {
		if (
			!validator.isInteger(num_rule_removing)
		) {
			console.log({num_rule_modifying: num_rule_removing})
			throw new Error("Invalid num_rule_removing argument for ProposedRemovalRule class.")
		}

		this.num_rule_removing = num_rule_removing
	}

	isProposedRemovalRule(value) {
		return (
			super.isProposedRule(value) &&
			validator.doesObjectHaveKeys(value, "num_rule_removing") &&
			validator.isInteger(value.num_rule_removing)
		)
	}


	// @ Override
	async toEmbed() {
		const rule_removing = await global.Sandbox.getOfficialRuleFromNum(this.num_rule_removing);

		const embed_msg = (await super.toEmbed()).setDescription(
			`**Rule To Remove**: \`${this.num_rule_removing}) ${rule_removing.description}\`\n` +
			`**Reason**: \`${this.description}\`\n` +
			`**Proposer**: \`${this.proposer.name}\`\n`
		);

		return embed_msg;
	}
}

module.exports = ProposedRemovalRule;