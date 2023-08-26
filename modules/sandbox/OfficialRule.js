const validator = require("../../utilities/validator");
const Host = require("./Host");
const Rule = require("./Rule");
const { getGuild, getChannel, getMessage } = require("../functions");
const ids = require(`${global.paths.databases_dir}/ids.json`)

class OfficialRule extends Rule {
	constructor({
		description = "",
		proposer = undefined,
		number = undefined,
		message = undefined,
	}) {
		super({description, proposer});
		this.message = message;

		this.setNumber(number);

		if (!this.isOfficialRule(this)) {
			console.log("\nINVALID OFFICIAL RULE:");
			console.log(this)
			throw new Error(`Invalid arguments for OfficialRule object.`);
		}
	}

	static async getOfficialRuleChannel() {
		const sandbox_guild = await getGuild(ids.servers.sandbox);
		return await getChannel(sandbox_guild, ids.sandbox.channels.official_rules);
	}

	setNumber(number) {
		if (number !== undefined) {
			if (!validator.isInteger(number)) {
				console.log({number});
				throw new Error("Invalid number argument for OfficialRule class");
			}

			this.number = number;
		}
		else {
			this.number = global.Sandbox.official_rules.length + 1;
		}
	}

	async getRuleMessage() {
		const official_rule_chnl = await OfficialRule.getOfficialRuleChannel();
		return await getMessage(official_rule_chnl, this.message);
	}

	isOfficialRule(value) {
		return (
			validator.isObject(value) &&
			validator.doesObjectHaveKeys(value, "description", "proposer", "number") &&
			typeof value.description === "string" &&
			Host.isHost(value.proposer) &&
			validator.isInteger(value.number)
		)
	}

	toMessage() {
		const message = `**${this.number})** ${this.description}`
		return {content: message}
	}

	async updateMessage() {
		const official_rule_msg = await this.getRuleMessage();
		official_rule_msg.edit(this.toMessage());
	}

	async deleteMessage() {
		const official_rule_msg = await this.getRuleMessage();
		await official_rule_msg.edit({ content: `**${this.number})** \`[REMOVED]\`` });
	}
}

module.exports = OfficialRule;