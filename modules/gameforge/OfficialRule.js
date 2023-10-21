const validator = require("../../utilities/validator");
const Rule = require("./Rule");
const { getGuild, getChannel, getMessage, toOrdinal, toWordOrdinal } = require("../functions");
const ids = require("../../databases/ids.json")

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
		const gameforge_guild = await getGuild(ids.servers.gameforge);
		return await getChannel(gameforge_guild, ids.gameforge.channels.official_rules);
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
			this.number = global.GameForge.official_rules.length + 1;
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

	isAboutChallenge(challenge_num) {
		console.log(this.description.toLowerCase())
		console.log("challenge " + challenge_num)
		console.log("challenge #" + challenge_num)
		return (
			[
				`challenge ${challenge_num}`,
				`challenge #${challenge_num}`,
				`${toOrdinal(challenge_num)} challenge`,
				`${toWordOrdinal(challenge_num)} challenge`,
			]
			.some(challenge_phrase =>
				this.description.toLowerCase().includes(challenge_phrase)
			)
		)
	}
}

module.exports = OfficialRule;