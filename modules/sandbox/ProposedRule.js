const validator = require("../../utilities/validator");
const Vote = require("./Vote");
const Host = require("./Host");
const Rule = require("./Rule");
const ids = require("../../databases/ids.json")
const { EmbedBuilder } = require("discord.js");
const { generateRandomHexColorNumber, getGuild, getChannel, getMessage } = require("../functions");
const Sandbox = require("./sandbox");

class ProposedRule extends Rule {
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

		if (!this.isProposedRule(this)) {
			console.log("\nINVALID PROPOSED RULE:");
			console.log(this)
			throw new Error(`Invalid arguments for ProposedRule object.`);
		}
	}

	static EARLY_APPROVE_VOTE_RATIO = 2/3;
	static APPROVE_VOTE_RATIO = 1/2;
	static VOTE_HOST_RATIO = .5;
	static MIN_APPROVE_VOTES_NEEDED = 3;
	static RULE_NUM_INCREMEMENT = 1;
	static REQUIRED_FIRST_RULE_PHRASES = [
		"The theme for the game show is:",
		"The location this game show takes place is:"
	];
	static FINALIZE_RULES_PHRASE = "The official rules are finalized"
	static NAME_PHRASE = "The name of the game will be "
	static DESCRIPTION_PHRASE = "The description of the game will be "

	static async getProposedRuleChannel() {
		const sandbox_guild = await getGuild(ids.servers.sandbox);
		return await getChannel(sandbox_guild, ids.sandbox.channels.proposed_rules);
	}

	setNumber(number) {
		if (number === undefined) {
			const getNumberOfLastItem = (array) => {
				console.log({array});

				if (array.length <= 0) {
					return 0
				}

				return array[array.length - 1].number
			}

			const last_proposed_rule_number = getNumberOfLastItem(global.Sandbox.proposed_rules);
			const last_discarded_rule_number = getNumberOfLastItem(global.Sandbox.discarded_rules);
			const last_number = Math.max(last_discarded_rule_number, last_proposed_rule_number);

			this.number = last_number + ProposedRule.RULE_NUM_INCREMEMENT;
		}
		else {
			this.number = number
		}
	}

	setVotes(votes) {
		if (!validator.isArrayofType(votes, Vote.isVote)) {
			console.log({votes});
			throw new Error("Invalid votes argument for ProposedRule class");
		}

		this.votes = votes;
	}

	setType(type) {
		if (!validator.isEnumValue(type, Rule.Types)) {
			console.log({type});
			throw new Error("Invalid type argument for ProposedRule class");
		}

		this.type = type
	}

	isProposedRule(value) {
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

	getNumVotesOf(vote_value) {
		return this.votes.filter(vote => vote.vote === vote_value).length;
	}

	async getMessage() {
		const proposed_rule_chnl = await ProposedRule.getProposedRuleChannel();
		return await getMessage(proposed_rule_chnl, this.message);
	}

	async addVote(vote_str, voter_id) {
		console.log({vote_str, voter_id});

		if (this.votes.some(vote => vote.voter_id === voter_id)) {
			console.log("Changing Vote");
			const vote_index = this.votes.findIndex(vote => vote.voter_id === voter_id);
			this.votes[vote_index].vote = vote_str;
		}
		else {
			console.log("Adding Vote");
			const vote = new Vote({vote: vote_str, voter_id});
			this.votes.push(vote);
		}

		await this.updateMessage()

		this.makeJudgement({isEarly: true});

		console.log("saving votes");
		global.Sandbox.saveGameDataToDatabase();
		console.log("saved");
	}

	async becomeOfficialRule() {
		console.log(this.type);

		if (
			global.Sandbox.phrase === Sandbox.Phases.Brainstorming &&
			((
				this.description.includes(ProposedRule.NAME_PHRASE) &&
				global.Sandbox.official_rules.some(rule =>
					rule.description.includes(ProposedRule.DESCRIPTION_PHRASE)
				)
			) ||
			(
				this.description.includes(ProposedRule.DESCRIPTION_PHRASE) &&
				global.Sandbox.official_rules.some(rule =>
					rule.description.includes(ProposedRule.NAME_PHRASE)
				)
			))
		) {
			await global.Sandbox.setPhase(Sandbox.Phases.Proposing);
		}

		global.Sandbox.discardProposedRule(this);

		switch (this.type) {
			case Rule.Types.Creation:
				await global.Sandbox.addOfficialRule(this);
				break;

			case Rule.Types.Modification:
				await global.Sandbox.editOfficialRule(this);
				break;

			case Rule.Types.Removal:
				await global.Sandbox.removeOfficialRule(this);
				break;

			default:
				break;
		}

		console.log(`Proposal ${this.number} is official!`);

		global.Sandbox.saveGameDataToDatabase();
	}

	async becomeDiscardedRule() {
		await global.Sandbox.discardProposedRule(this);
		global.Sandbox.saveGameDataToDatabase();
	}

	async updateMessage() {
		const proposed_rule_msg = await this.getMessage();
		await proposed_rule_msg.edit({ embeds: [await this.toEmbed()] });
	}

	async toEmbed() {
		const vote_count = this.votes.length;
		const host_count = global.Sandbox.hosts.length;
		const perc_hosts_voted = Math.round((vote_count / host_count)*100);
		const embed_msg = new EmbedBuilder()
			.setColor(this.color)
			.setTitle(`${this.number}) Proposed Rule ${this.type}`)
			.setDescription(
				`**Rule To Create**: \`${this.description}\`\n` +
				`**Proposer**: \`${this.proposer.name}\`\n`
			)
			.setFooter({
				text: `${this.getNumVotesOf(Vote.Votes.Approve)}👍     ${this.getNumVotesOf(Vote.Votes.NoOpinion)}🤷     ${this.getNumVotesOf(Vote.Votes.Disapprove)}👎     ${perc_hosts_voted}% Hosts Voted`
			})

		return embed_msg;
	}

	setJudgementTime(judgement_date_str) {
		const proposed_rule = this;
		console.log({judgement_date_str});

		if (typeof judgement_date_str !== "string") {
			this.judgement_time = undefined;
			return;
		}

		const judgement_date = new Date(judgement_date_str);

		if (judgement_date < new Date()) {
			console.log({judgement_date})
			global.Sandbox.logError("Judgement Date has passed but proposed rule still exists");
		}

		const cron_job = new cron.CronJob(
			judgement_date,
			async function() {
				if (
					global.Sandbox.proposed_rules.find(rule => rule.number === proposed_rule.number)
				) {
					proposed_rule.makeJudgement({isEarly: false});
				}
			},
		);
		cron_job.start();

		this.judgement_time = judgement_date_str;
	}

	getJudgementTime() {
		return new Date(next_day);
	}

	async makeJudgement({isEarly}) {
		const vote_count = this.votes.length;
		const approve_vote_count = this.getNumVotesOf(Vote.Votes.Approve);
		const approve_disapprove_vote_count = approve_vote_count + this.getNumVotesOf(Vote.Votes.Disapprove);
		const host_count = global.Sandbox.hosts.length;
		let becameOfficialRule = undefined;
		let wasJudged = false;

		console.log({host_count, vote_count, approve_vote_count, isEarly});
		console.log(`Approve Vote Ratio: ${(approve_vote_count / approve_disapprove_vote_count)}`);
		console.log(`Needed Approve Ratio: ${ProposedRule.APPROVE_VOTE_RATIO}`);
		console.log(`Needed EARLY Approve Ratio: ${ProposedRule.EARLY_APPROVE_VOTE_RATIO}`);
		console.log(`Vote to Host Ratio: ${(vote_count / host_count)}`);
		console.log(`Needed Vote to Host Ratio: ${ProposedRule.VOTE_HOST_RATIO}`);
		console.log(`Approve Vote Count: ${(approve_vote_count)}`);
		console.log(`Needed Approve Vote Count: ${ProposedRule.MIN_APPROVE_VOTES_NEEDED}`);

		if (
			(
				isEarly &&
				(approve_vote_count / approve_disapprove_vote_count) > (ProposedRule.EARLY_APPROVE_VOTE_RATIO) &&
				(vote_count / host_count) > (ProposedRule.VOTE_HOST_RATIO) &&
				(approve_vote_count >= ProposedRule.MIN_APPROVE_VOTES_NEEDED)
			) ||
			(
				!isEarly &&
				(approve_vote_count / approve_disapprove_vote_count) > (ProposedRule.APPROVE_VOTE_RATIO) &&
				(vote_count / host_count) > (ProposedRule.VOTE_HOST_RATIO)
			)
		) {
			becameOfficialRule = true;
			wasJudged = true;
			this.becomeOfficialRule()
		}
		else if (!isEarly) {
			becameOfficialRule = false;
			wasJudged = true;
			this.becomeDiscardedRule();
		}
		else {
			becameOfficialRule = undefined;
			wasJudged = false;
		}

		if (wasJudged === true) {

			console.log(`PROPOSAL ${this.number} HAS MADE A JUDGEMENT!`);

			let new_embed;

			if (becameOfficialRule === true) {
				new_embed = (await this.toEmbed())
					.setColor(0x00ff00)
					.setTitle(`✅ ${this.number}) APPROVED Rule ${this.type}`)
			}
			else if (becameOfficialRule === false) {
				new_embed = (await this.toEmbed())
					.setColor(0xff0000)
					.setTitle(`❌ ${this.number}) DISCARDED Rule ${this.type}`)
			}

			const proposed_rule_msg = await this.getMessage();
			proposed_rule_msg.edit({ embeds: [new_embed], components: [] });
		}
	}

	/**
	 * Validates whethere a rule description is allowed or not. Returns true if valid and an error message if invalid
	 *
	 * @returns true or Error Message String
	 */
	async validate() {
		const num_official_rules = global.Sandbox.official_rules.length;
		const num_new_official_rules = num_official_rules - Rule.NUM_STARTING_RULES;

		if (
			(num_new_official_rules <= 0) &&
			(!ProposedRule.REQUIRED_FIRST_RULE_PHRASES.every(
				required_phrase => this.description.includes(required_phrase)
			))
		) {
			return `The first new official rule must include the phrases: "${ProposedRule.REQUIRED_FIRST_RULE_PHRASES.join("\", \"")}"`
		}

		return true
	}
}

module.exports = ProposedRule;