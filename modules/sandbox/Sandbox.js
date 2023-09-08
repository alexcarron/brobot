const { getChannel, getGuild, getRole, addRole, getGuildMember, removeRole, setNickname, getNextDayCronExpression } = require("../functions.js");
const { github_token } =  require("../token.js");
const ids = require("../../databases/ids.json");
const OfficialRule = require("./OfficialRule.js");
const Host = require("./Host.js");
const Vote = require("./Vote.js");
const DiscardedRule = require("./DiscardedRule.js");
const Rule = require("./Rule.js");
const ProposedCreatoinRule = require("./ProposedCreationRule.js");
const ProposedModificationRule = require("./ProposedModificationRule.js");
const ProposedRemovalRule = require("./ProposedRemovalRule.js");

class Sandbox {
	official_rules;
	proposed_rules;
	discarded_rules;
	hosts;
	phase;
	name;
	description;

	constructor({
		official_rules = [],
		proposed_rules = [],
		discarded_rules = [],
		hosts = [],
		phase = "Brainstorming",
		name,
		description,
		phase_change_date,
	}) {
		this.official_rules = official_rules;
		this.proposed_rules = proposed_rules;
		this.discarded_rules = discarded_rules;
		this.hosts = hosts;
		this.phase = phase;
		this.name = name;
		this.description = description;
		this.phase_change_date = phase_change_date;

		console.log({phase_change_date});

		if (phase === Sandbox.Phases.Proposing || phase === Sandbox.Phases.Voting) {
			let new_phase;
			if (phase === Sandbox.Phases.Proposing) {
				new_phase = Sandbox.Phases.Voting;
			}
			else {
				new_phase = Sandbox.Phases.Proposing;
			}

			const cron_job = new cron.CronJob(
				this.phase_change_date,
				async function() {
					await global.Sandbox.setPhase(new_phase)
				},
			);
			cron_job.start();
		}
	}

	static github_path = "sandbox-game.json";
	static SECONDS_TILL_JUDGEMENT = 86400 * 2;
	static NUM_CHALLENGES = 10;
	static PHASE_LENGTH_MIN = 60*24;
	static Phases = {
		Brainstorming: "Brainstorming",
		Proposing: "Proposing",
		Voting: "Voting",
	}


	resetSandbox() {
		// for (const official_rule of this.official_rules) {

		// }
	}

	setSandboxGame(sandbox_game) {
		for (const property in sandbox_game) {
			switch (property) {
				case "official_rules": {
					for (const official_rule of sandbox_game[property]) {
						this.official_rules.push( new OfficialRule(official_rule) );
					}
					break;
				}

				case "proposed_rules": {
					for (const proposed_rule_index in sandbox_game.proposed_rules) {
						let real_proposed_rule = {};

						const proposed_rule = sandbox_game.proposed_rules[proposed_rule_index];

						for (const rule_property in proposed_rule) {
							const rule_property_value = sandbox_game.proposed_rules[proposed_rule_index][rule_property]

							if (rule_property === "votes") {
								let real_votes = [];

								const votes = rule_property_value;
								for (const vote of votes) {
									real_votes.push(new Vote(vote));
								}
								real_proposed_rule = {
									...proposed_rule,
									"votes": real_votes,
								}
							}
							else {
								real_proposed_rule = {
									...proposed_rule,
									rule_property: rule_property_value,
								}
							}
						}

						switch (real_proposed_rule.type) {
							case Rule.Types.Creation:
								real_proposed_rule = new ProposedCreatoinRule(real_proposed_rule);
								break;


							case Rule.Types.Modification:
								real_proposed_rule = new ProposedModificationRule(real_proposed_rule);
								break;


							case Rule.Types.Removal:
								real_proposed_rule = new ProposedRemovalRule(real_proposed_rule);
								break;

							default:
								break;
						}

						this.proposed_rules.push( real_proposed_rule );
					}
					break;
				}

				case "hosts": {
					for (const host of sandbox_game[property]) {
						this.hosts.push( new Host(host) );
					}
					break;
				}

				default:
					this[property] = sandbox_game[property]
					break;
			}
		}
	}

	async loadGameDataFromDatabase() {
		const
			axios = require('axios'),
			owner = "alexcarron",
			repo = "brobot-database";


		// Get the current file data
		const {data: file} =
			await axios.get(
				`https://api.github.com/repos/${owner}/${repo}/contents/${Sandbox.github_path}`,
				{
					headers: {
						'Authorization': `Token ${github_token}`
					}
				}
			)
			.catch(err => {
				console.error(err);
			});


		let sandbox_game_str = Buffer.from(file.content, 'base64').toString();
		let sandbox_game = JSON.parse(sandbox_game_str);

		this.setSandboxGame(sandbox_game);
	}

	async saveGameDataToDatabase() {
		console.log("Saving Sandbox Data...")
		const
			axios = require('axios'),
			owner = "alexcarron",
			repo = "brobot-database",
			sandbox_game = this,
			sandbox_game_str = JSON.stringify(sandbox_game);



			try {
        // Get the current file data
        const { data: file } = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents/${Sandbox.github_path}`,
            {
                headers: {
                    'Authorization': `Token ${github_token}`
                }
            }
        );

        // Update the file content
        const updatedContent = new Buffer.from(sandbox_game_str).toString('base64');

        try {
            await axios.put(
                `https://api.github.com/repos/${owner}/${repo}/contents/${Sandbox.github_path}`,
                {
                    message: 'Update file',
                    content: updatedContent,
                    sha: file.sha
                },
                {
                    headers: {
                        'Authorization': `Token ${github_token}`
                    }
                }
            );
            console.log('File saved successfully.');
        } catch (updateError) {
            if (updateError.response && updateError.response.status === 409) {
                console.log('Conflict detected. Fetching the latest content and trying again...');
                // Fetch the latest file data and retry the update
                const { data: latestFile } = await axios.get(
                    `https://api.github.com/repos/${owner}/${repo}/contents/${Sandbox.github_path}`,
                    {
                        headers: {
                            'Authorization': `Token ${github_token}`
                        }
                    }
                );

                await axios.put(
                    `https://api.github.com/repos/${owner}/${repo}/contents/${Sandbox.github_path}`,
                    {
                        message: 'Update file',
                        content: updatedContent,
                        sha: latestFile.sha
                    },
                    {
                        headers: {
                            'Authorization': `Token ${github_token}`
                        }
                    }
                );
                console.log('File saved successfully after conflict resolution.');
            } else {
                console.error('Error updating file:', updateError);
            }
        }
    } catch (error) {
        console.error(error);
    }

	}

	async addHost(host) {
		this.hosts.push(host);

		const sandbox_guild =	await getGuild(ids.servers.sandbox);
		const host_role = await getRole(sandbox_guild, "Host");
		const outsider_role = await getRole(sandbox_guild, "Outsider");
		const host_guild_member = await getGuildMember(sandbox_guild, host.id);
		await removeRole(host_guild_member, outsider_role);
		await addRole(host_guild_member, host_role);
		await setNickname(host_guild_member, host.name).catch(console.error());

		await global.Sandbox.saveGameDataToDatabase();
	}

	async addProposedRule(proposed_rule) {
		const current_date = new Date();

		const judgement_date = new Date(current_date);

		// judgement_date.setDate(current_date.getDate()+1);
		judgement_date.setSeconds(current_date.getSeconds() + Sandbox.SECONDS_TILL_JUDGEMENT);

		proposed_rule.setJudgementTime(judgement_date.toString());

		const { ButtonBuilder, ButtonStyle, ActionRowBuilder, ThreadAutoArchiveDuration } = require('discord.js');

		const approve_button = new ButtonBuilder()
			.setCustomId(`${Vote.Votes.Approve}${proposed_rule.number}`)
			.setLabel(Vote.Votes.Approve)
			.setStyle(ButtonStyle.Success);

		const disapprove_button = new ButtonBuilder()
			.setCustomId(`${Vote.Votes.Disapprove}${proposed_rule.number}`)
			.setLabel(Vote.Votes.Disapprove)
			.setStyle(ButtonStyle.Danger);

		const no_opinion_button = new ButtonBuilder()
			.setCustomId(`${Vote.Votes.NoOpinion}${proposed_rule.number}`)
			.setLabel(Vote.Votes.NoOpinion)
			.setStyle(ButtonStyle.Secondary);

		const action_row = new ActionRowBuilder()
			.addComponents(approve_button, disapprove_button, no_opinion_button);

		const sandbox_guild = await getGuild(ids.servers.sandbox);
		const proposed_rules_chnl = await getChannel(sandbox_guild, ids.sandbox.channels.proposed_rules);
		const proposed_rule_message = await proposed_rules_chnl.send({
			embeds: [await proposed_rule.toEmbed()],
			components: [action_row],
		});

		const thread = await proposed_rule_message.startThread({
			name: `Discuss Proposal #${proposed_rule.number}`,
			autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
			reason: `To discuss specifically proposal #${proposed_rule.number}`,
		});

		proposed_rule.message = proposed_rule_message.id;

		this.proposed_rules.push(proposed_rule);

		await global.Sandbox.saveGameDataToDatabase();
	}

	async discardProposedRule(proposed_rule) {
		this.deleteProposedRule(proposed_rule.number);
		const discarded_rule = new DiscardedRule(proposed_rule);
		this.discarded_rules.push(discarded_rule);

		const sandbox_guild = await getGuild(ids.servers.sandbox);
		const announce_chnl = await getChannel(sandbox_guild, ids.sandbox.channels.announcements);
		await announce_chnl.send(
			`Proposed Rule **#${proposed_rule.number}** has been discarded.\n` +
			`https://discord.com/channels/${ids.servers.sandbox}/${ids.sandbox.channels.proposed_rules}/${proposed_rule.message}`
		);

		console.log("Discarded Proposed Rule");
	}

	async addOfficialRule(proposed_creation_rule) {
		const official_rule = new OfficialRule( new Rule(proposed_creation_rule) );

		const sandbox_guild = await getGuild(ids.servers.sandbox);
		const official_rules_chnl = await getChannel(sandbox_guild, ids.sandbox.channels.official_rules);
		const official_rule_message = await official_rules_chnl.send(official_rule.toMessage());

		official_rule.message = official_rule_message.id;

		this.official_rules.push(official_rule);

		const announce_chnl = await getChannel(sandbox_guild, ids.sandbox.channels.announcements);
		await announce_chnl.send(
			`Proposed Rule **#${proposed_creation_rule.number}** has become an offical rule.\n` +
			`https://discord.com/channels/${ids.servers.sandbox}/${ids.sandbox.channels.proposed_rules}/${proposed_creation_rule.message}`
		);

		const staff_chnl = await getChannel(sandbox_guild, ids.sandbox.channels.staff);
		await staff_chnl.send(`<@${ids.users.LL}> Official Rule Created`);

		console.log("Added Official Rule")
	}

	async editOfficialRule(proposed_modification_rule) {
		console.log({proposed_modification_rule});

		const sandbox_guild = await getGuild(ids.servers.sandbox);

		const official_rule_modifying = await this.getOfficialRuleFromNum(proposed_modification_rule.num_rule_modifying);
		official_rule_modifying.description = proposed_modification_rule.description;
		await official_rule_modifying.updateMessage();

		const announce_chnl = await getChannel(sandbox_guild, ids.sandbox.channels.announcements);
		announce_chnl.send(
			`Proposed Rule **#${proposed_modification_rule.number}** has modified Offical Rule **#${proposed_modification_rule.num_rule_modifying}**.\n` +
			`https://discord.com/channels/${ids.servers.sandbox}/${ids.sandbox.channels.proposed_rules}/${proposed_modification_rule.message}`
			);

		const staff_chnl = await getChannel(sandbox_guild, ids.sandbox.channels.staff);
		staff_chnl.send(`<@${ids.users.LL}> Official Rule Modified`);

		console.log("Edited Official Rule")
	}

	async removeOfficialRule(proposed_removal_rule) {
		const sandbox_guild = await getGuild(ids.servers.sandbox);

		const official_rule_removing = await this.getOfficialRuleFromNum(proposed_removal_rule.num_rule_removing);
		await official_rule_removing.deleteMessage();
		this.official_rules.splice(proposed_removal_rule.num_rule_removing, 1);
		const announce_chnl = await getChannel(sandbox_guild, ids.sandbox.channels.announcements);
		announce_chnl.send(
			`Proposed Rule **#${proposed_removal_rule.number}** has removed Offical Rule **#${proposed_removal_rule.num_rule_removing}**.\n` +
			`https://discord.com/channels/${ids.servers.sandbox}/${ids.sandbox.channels.proposed_rules}/${proposed_removal_rule.message}`
		);

		const staff_chnl = await getChannel(sandbox_guild, ids.sandbox.channels.staff);
		staff_chnl.send(`<@${ids.users.LL}> Official Rule Removed`);

		console.log("Removed Official Rule")
	}

	async getOfficialRuleFromNum(rule_num) {
		const official_rule = await this.official_rules.find(official_rule => official_rule.number === rule_num);;
		console.log({rule_num, official_rule});
		return official_rule;
	}

	async getProposedRuleFromNum(rule_num) {
		const proposed_rule = await this.proposed_rules.find(proposed_rule => proposed_rule.number === rule_num);
		console.log({rule_num, proposed_rule});
		return proposed_rule;
	}

	deleteProposedRule(rule_num) {
		const proposed_rule_index = this.proposed_rules.findIndex(proposed_rule => proposed_rule.number === rule_num);
		this.proposed_rules.splice(proposed_rule_index, 1);
	}

	getHostByID(id) {
		return this.hosts.find(host => host.id === id);
	}

	logError(error_msg) {
		console.log({error_msg});
	}

	async setPhase(phase) {
		this.phase = phase;

		const sandbox_guild = await getGuild(ids.servers.sandbox);
		const announce_chnl = await getChannel(sandbox_guild, ids.sandbox.channels.announcements);
		await announce_chnl.send(`It is now the **${phase}** phase`);

		if (phase === Sandbox.Phases.Proposing || phase === Sandbox.Phases.Voting) {
			let new_phase;
			if (phase === Sandbox.Phases.Proposing) {
				new_phase = Sandbox.Phases.Voting;

				global.Sandbox.proposed_rules.forEach(rule => {
					rule.makeJudgement({isEarly: false});
				})
			}
			else {
				new_phase = Sandbox.Phases.Proposing;
			}

			const current_date = new Date();
			const phase_change_date = new Date(current_date);

			phase_change_date.setSeconds(current_date.getSeconds() + Sandbox.SECONDS_TILL_JUDGEMENT / 2);

			const cron_job = new cron.CronJob(
				phase_change_date,
				async function() {
					await global.Sandbox.setPhase(new_phase);
				},
			);
			cron_job.start();

			this.phase_change_date = phase_change_date.toString();

			await this.saveGameDataToDatabase();
		}
	}
}

module.exports = Sandbox;