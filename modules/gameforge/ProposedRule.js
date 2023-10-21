const validator = require("../../utilities/validator");
const Vote = require("./Vote");
const Rule = require("./Rule");
const ids = require("../../databases/ids.json")
const { EmbedBuilder } = require("discord.js");
const { getRandomHexColorNumber, getGuild, getChannel, getMessage } = require("../functions");
const cron = require("cron"); // Used to have scheduled functions execute
const { GameForgePhases, XPTaskKeys, XPRewards } = require("../enums");

class ProposedRule extends Rule {
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

		if (!this.isProposedRule(this)) {
			console.log("\nINVALID PROPOSED RULE:");
			console.log(this)
			throw new Error(`Invalid arguments for ProposedRule object.`);
		}

		if (this.proposer.custom_color) {
			this.color = this.proposer.custom_color;
		}
	}

	static EARLY_APPROVE_VOTE_RATIO = 2/3;
	static APPROVE_VOTE_RATIO = 1/2;
	static VOTE_HOST_RATIO = 0.5;
	static MIN_APPROVE_VOTES_NEEDED = 3;
	static RULE_NUM_INCREMEMENT = 1;
	static AWFUL_APPROVE_VOTE_RATIO = 0.2;
	static REQUIRED_FIRST_RULE_PHRASES = [
		"The theme for the game show is:",
		"The location this game show takes place is:"
	];
	static FINALIZE_RULES_PHRASE = "The official rules are finalized"
	static NAME_PHRASE = "The name of the game will be "
	static DESCRIPTION_PHRASE = "The description of the game will be "
	static HELP_MESSAGE =
		`## ❗Check! Does your rule follow these guidelines?\n` +
		`- It is completely unambigous and has no room for interpretation\n` +
		`- It is fair for the hosts, contestants, and LL\n` +
		`- It doesn't try to override a rule that's already in place`


	static async getProposedRuleChannel() {
		const gameforge_guild = await getGuild(ids.servers.gameforge);
		return await getChannel(gameforge_guild, ids.gameforge.channels.proposed_rules);
	}

	setNumber(number) {
		if (number === undefined) {
			const getNumberOfLastItem = (array) => {
				if (array.length <= 0) {
					return 0
				}

				return array[array.length - 1].number
			}

			const last_proposed_rule_number = getNumberOfLastItem(global.GameForge.proposed_rules);
			const last_discarded_rule_number = getNumberOfLastItem(global.GameForge.discarded_rules);
			const last_number = Math.max(last_discarded_rule_number, last_proposed_rule_number);

			this.number = last_number + ProposedRule.RULE_NUM_INCREMEMENT;
		}
		else {
			this.number = number
		}
	}

	setVotes(votes) {
		if (!validator.isArrayofType(votes, Vote.isVote)) {
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
			validator.doesObjectHaveKeys(value, "description", "proposer", "votes", "type", "number", "message", "color") &&
			typeof value.description === "string" &&
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

	async addVote(vote_str, voter_id, interaction) {
		console.log({vote_str, voter_id});

		const host = global.GameForge.getHostByID(voter_id);

		if (this.votes.some(vote => vote.voter_id === voter_id)) {
			for (let vote_num = 1; vote_num <= host.voting_multiplier; vote_num++) {
				console.log("Changing Vote");
				const vote_index = this.votes.findIndex(vote => vote.voter_id === voter_id);
				this.votes[vote_index].vote = vote_str;
			}

			await interaction.reply({ content: `You change your vote to ${vote_str} on proposal \`#${this.number}\``, components: [], ephemeral: true });
		}
		else {
			for (let vote_num = 1; vote_num <= host.voting_multiplier; vote_num++) {
				console.log("Adding Vote");
				const vote = new Vote({vote: vote_str, voter_id});
				this.votes.push(vote);
			}

			await interaction.reply({
				content: `You voted ${vote_str} on proposal \`#${this.number}\``,
				components: [],
				ephemeral: true
			});

			await host.rewardXPFor(XPTaskKeys.Vote, interaction);
		}

		await this.updateMessage()

		// NO EARLY JUDGEMENTS
		// this.makeJudgement({isEarly: true});

		console.log("saving votes");
		global.GameForge.saveGameDataToDatabase();
		console.log("saved");
	}

	async becomeOfficialRule({doesSave=true}) {
		console.log(this.type);

		if (
			global.GameForge.phrase === GameForgePhases.Brainstorming &&
			((
				this.description.includes(ProposedRule.NAME_PHRASE) &&
				global.GameForge.official_rules.some(rule =>
					rule.description.includes(ProposedRule.DESCRIPTION_PHRASE)
				)
			) ||
			(
				this.description.includes(ProposedRule.DESCRIPTION_PHRASE) &&
				global.GameForge.official_rules.some(rule =>
					rule.description.includes(ProposedRule.NAME_PHRASE)
				)
			))
		) {
			await global.GameForge.setPhase(GameForgePhases.Proposing);
		}

		switch (this.type) {
			case Rule.Types.Creation:
				await global.GameForge.addOfficialRule(this);
				break;

			case Rule.Types.Modification:
				await global.GameForge.editOfficialRule(this);
				break;

			case Rule.Types.Removal:
				await global.GameForge.removeOfficialRule(this);
				break;

			default:
				break;
		}

		await global.GameForge.discardProposedRule(this);

		console.log(`Proposal ${this.number} is official!`);
		const proposer = global.GameForge.hosts.find(host => host.name === this.proposer.name);

		await proposer.rewardXPFor(XPTaskKeys.CreateOfficialRule, await this.getMessage());

		if (doesSave) {
			await global.GameForge.saveGameDataToDatabase();
		}
	}

	async becomeDiscardedRule({doesSave=true, sendAnnouncement=false}) {
		console.log("Discarding Rule")
		await global.GameForge.discardProposedRule(this, sendAnnouncement);
		console.log("Discarded")

		if (doesSave) {
			await global.GameForge.saveGameDataToDatabase();
		}
	}

	async updateMessage() {
		const proposed_rule_msg = await this.getMessage();
		await proposed_rule_msg.edit({ embeds: [await this.toEmbed()] });
	}

	async toEmbed() {
		const vote_count = this.votes.length;
		const host_count = global.GameForge.hosts.length;
		const perc_hosts_voted = Math.round((vote_count / host_count)*100);
		const embed_msg = new EmbedBuilder()
			.setColor(this.color)
			.setTitle(`${this.number}) Proposed Rule ${this.type}`)
			.setDescription(
				`**Rule To Create**: \`${this.description}\`\n` +
				`**Proposer**: \`${this.proposer.name}\`\n`
			);

		if (global.GameForge.phase === GameForgePhases.Voting) {
			embed_msg.setFooter({
				text: `${this.getNumVotesOf(Vote.Votes.Approve)}👍     ${this.getNumVotesOf(Vote.Votes.NoOpinion)}🤷     ${this.getNumVotesOf(Vote.Votes.Disapprove)}👎     ${perc_hosts_voted}% Hosts Voted`
			});
		};

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
			global.GameForge.logError("Judgement Date has passed but proposed rule still exists");
		}

		const cron_job = new cron.CronJob(
			judgement_date,
			async function() {
				if (
					global.GameForge.proposed_rules.find(rule => rule.number === proposed_rule.number)
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

	async makeJudgement({isEarly, doesSave=true}) {
		const vote_count = this.votes.length;
		const approve_vote_count = this.getNumVotesOf(Vote.Votes.Approve);
		const approve_disapprove_vote_count = approve_vote_count + this.getNumVotesOf(Vote.Votes.Disapprove);
		const host_count = global.GameForge.hosts.length;
		let becameOfficialRule = undefined;
		let wasJudged = false;

		const approve_vote_ratio =
			approve_disapprove_vote_count !== 0 ? approve_vote_count / approve_disapprove_vote_count : 1

		console.log({host_count, vote_count, approve_vote_count, isEarly});
		console.log(`Approve Vote Ratio: ${approve_vote_ratio} > ${ProposedRule.APPROVE_VOTE_RATIO}`);
		console.log(`Needed EARLY Approve Ratio: ${approve_vote_ratio} > ${ProposedRule.EARLY_APPROVE_VOTE_RATIO}`);
		console.log(`Vote to Host Ratio: ${(vote_count / host_count)} > ${ProposedRule.VOTE_HOST_RATIO}`);
		console.log(`Approve Vote Count: ${(approve_vote_count)} >= ${ProposedRule.MIN_APPROVE_VOTES_NEEDED}`);

		if (isEarly) {
			if (
				approve_vote_ratio > (ProposedRule.EARLY_APPROVE_VOTE_RATIO) &&
				(vote_count / host_count) > (ProposedRule.VOTE_HOST_RATIO) &&
				(approve_vote_count >= ProposedRule.MIN_APPROVE_VOTES_NEEDED)
			) {
				becameOfficialRule = true;
				wasJudged = true;
			}
			else {
				becameOfficialRule = undefined;
				wasJudged = false;
			}
		}
		else {
			wasJudged = true;

			if (
				approve_vote_ratio > (ProposedRule.APPROVE_VOTE_RATIO) &&
				(vote_count / host_count) > (ProposedRule.VOTE_HOST_RATIO)
			) {
				becameOfficialRule = true;
			}
			else {
				becameOfficialRule = false;
			}
		}

		console.log({becameOfficialRule, wasJudged});

		if (wasJudged && becameOfficialRule) {
			console.log("Judged to Become Official Rule");
			await this.becomeOfficialRule({doesSave});
		}
		else if (wasJudged && !becameOfficialRule) {
			console.log("Judged to Become Discarded Rule");

			if (approve_vote_ratio <= ProposedRule.AWFUL_APPROVE_VOTE_RATIO) {
				console.log(this.proposer);
				const proposer = global.GameForge.hosts.find(host => host.name === this.proposer.name);
				console.log({proposer});
				await proposer.rewardXPFor(XPTaskKeys.ProposeDissaprovedRule, await this.getMessage());
			}

			await this.becomeDiscardedRule({doesSave: true, sendAnnouncement: true});
		}
		else {
			console.log("No Judgement")
		}

		if (wasJudged) {
			console.log(`PROPOSAL ${this.number} HAS MADE A JUDGEMENT!`);

			let new_embed;
			const perc_hosts_voted = Math.round((vote_count / host_count)*100);
			const footer = {
				text: `${this.getNumVotesOf(Vote.Votes.Approve)}👍     ${this.getNumVotesOf(Vote.Votes.NoOpinion)}🤷     ${this.getNumVotesOf(Vote.Votes.Disapprove)}👎     ${perc_hosts_voted}% Hosts Voted`
			};

			if (becameOfficialRule === true) {
				new_embed = (await this.toEmbed())
					.setColor(0x00ff00)
					.setTitle(`✅ ${this.number}) APPROVED Rule ${this.type}`)
					.setFooter(footer);
			}
			else if (becameOfficialRule === false) {
				new_embed = (await this.toEmbed())
					.setColor(0xff0000)
					.setTitle(`❌ ${this.number}) DISCARDED Rule ${this.type}`)
					.setFooter(footer);
			}

			const proposed_rule_msg = await this.getMessage();
			await proposed_rule_msg.edit({ embeds: [new_embed], components: [] });
		}
	}

	/**
	 * Validates whethere a rule description is allowed or not. Returns true if valid and an error message if invalid
	 *
	 * @returns true or Error Message String
	 */
	async validate() {
		const num_official_rules = global.GameForge.official_rules.length;
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

	async createMessage() {
		const { ButtonBuilder, ButtonStyle, ActionRowBuilder, ThreadAutoArchiveDuration } = require('discord.js');

		const gameforge_guild = await getGuild(ids.servers.gameforge);
		const proposed_rules_chnl = await getChannel(gameforge_guild, ids.gameforge.channels.proposed_rules);
		const proposed_rule_message = await proposed_rules_chnl.send({
			embeds: [await this.toEmbed()],
		});

		await proposed_rule_message.startThread({
			name: `Discuss Proposal #${this.number}`,
			autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
			reason: `To discuss specifically proposal #${this.number}`,
		});

		this.message = proposed_rule_message.id;
	}

	async addButtonsToMessage() {
		const message = await this.getMessage();

		const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

		const approve_button = new ButtonBuilder()
			.setCustomId(`${Vote.Votes.Approve}${this.number}`)
			.setLabel(Vote.Votes.Approve)
			.setStyle(ButtonStyle.Success);

		const disapprove_button = new ButtonBuilder()
			.setCustomId(`${Vote.Votes.Disapprove}${this.number}`)
			.setLabel(Vote.Votes.Disapprove)
			.setStyle(ButtonStyle.Danger);

		const no_opinion_button = new ButtonBuilder()
			.setCustomId(`${Vote.Votes.NoOpinion}${this.number}`)
			.setLabel(Vote.Votes.NoOpinion)
			.setStyle(ButtonStyle.Secondary);

		const action_row = new ActionRowBuilder()
			.addComponents(approve_button, disapprove_button, no_opinion_button);

		await message.edit({ components: [action_row] });
	}

	async removeButtonsFromMessage() {
		const message = await this.getMessage();
		await message.edit({ components: [] });
	}
}



module.exports = ProposedRule;