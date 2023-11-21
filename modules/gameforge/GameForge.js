const { getChannel, getGuild, getRole, addRole, getGuildMember, removeRole, setNickname, getNextDayCronExpression, getRandArrayItem } = require("../functions.js");
const { github_token } =  require("../token.js");
const ids = require("../../databases/ids.json");
const OfficialRule = require("./OfficialRule.js");
const Vote = require("./Vote.js");
const DiscardedRule = require("./DiscardedRule.js");
const Rule = require("./Rule.js");
const ProposedCreatoinRule = require("./ProposedCreationRule.js");
const ProposedModificationRule = require("./ProposedModificationRule.js");
const ProposedRemovalRule = require("./ProposedRemovalRule.js");
const cron = require("cron"); // Used to have scheduled functions execute
const { GameForgePhases } = require("../enums.js");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ThreadAutoArchiveDuration } = require("discord.js");
const Host = require("./host.js");
class GameForge {
	official_rules;
	proposed_rules;
	discarded_rules;
	hosts;
	phase;
	name;
	description;
	phase_change_date;
	topic;

	constructor({
		official_rules = [],
		proposed_rules = [],
		discarded_rules = [],
		hosts = [],
		phase = "Brainstorming",
		name,
		description,
		phase_change_date,
		topic,
	}) {
		this.official_rules = official_rules;
		this.proposed_rules = proposed_rules;
		this.discarded_rules = discarded_rules;
		this.hosts = hosts;
		this.phase = phase;
		this.name = name;
		this.description = description;
		this.phase_change_date = phase_change_date;
		this.topic = topic;
	}

	static github_path = "sandbox-game.json";
	static SECONDS_TILL_JUDGEMENT = 60*60*24*2;
	static SECONDS_BETWEEN_PHASES = 60*60*24*2;
	static NUM_CHALLENGES = 10;
	static PHASE_LENGTH_MIN = 60*24;
	static TOPICS = [
		// "Rounds can have optional challenges and there is a challenge every 5 rounds, but what happens in rounds without optional challenges. What determines when we have these challenges? What are the optional challenges?",
		// "A shop has been established, but what items can contestants buy in the shop? How do they buy them? Does the shop have any special mechanics",
		// "The first challenge is quiz with LL server-based questions, but what are the questions? How is the quiz run? How does one win or lose?",
		// "Challenge 4 is a game of hot potato with a random time. How is the time randomly generated? How are the three players chosen for this challenge? Do the players know the time on the bomb when they have it?",
		// "Challenge 7 is a video game soundtrack quiz, but what soundtrack is it? How is it run? How will the questions be decided? How will you decide which songs to include in the quiz? How many questions will there be? How can contestants win AUDB?",
		// "Check out all the features listed in the rule summary. Is there any that you think are too complicated, uncessary, or you want to change? Is there any that haven't been utilized?",
		"Challenge 10 doesn't exist yet. What ideas do you have for it? Any specific mechanics, story, or dynamics come to mind for the challenge? What would be fun and unique?",
	]

	async resetGameForge() {
		this.official_rules = [];
		this.proposed_rules = [];
		this.discarded_rules = [];
		this.hosts = [];
		this.phase = "Brainstorming";
		this.name = undefined;
		this.description = undefined;
		this.phase_change_date = undefined;
	}

	async setGameForgeGame(gameforge_game) {
		await global.GameForge.resetGameForge();

		for (const property in gameforge_game) {
			switch (property) {
				case "official_rules": {
					for (const official_rule of gameforge_game[property]) {
						this.official_rules.push( new OfficialRule(official_rule) );
					}
					break;
				}

				case "proposed_rules": {
					for (const proposed_rule_index in gameforge_game.proposed_rules) {
						let real_proposed_rule = {};

						const proposed_rule = gameforge_game.proposed_rules[proposed_rule_index];

						for (const rule_property in proposed_rule) {
							const rule_property_value = gameforge_game.proposed_rules[proposed_rule_index][rule_property]

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
					for (const host of gameforge_game[property]) {
						this.hosts.push( new Host(host) );
					}
					break;
				}

				default:
					this[property] = gameforge_game[property]
					break;
			}
		}

		console.log(this.phase_change_date);

		if (this.phase === GameForgePhases.Proposing || this.phase === GameForgePhases.Voting) {
			let new_phase;
			if (this.phase === GameForgePhases.Proposing) {
				new_phase = GameForgePhases.Voting;
			}
			else {
				new_phase = GameForgePhases.Proposing;
			}

			let phase_change_date = new Date(this.phase_change_date);

			if (new Date() < phase_change_date) {
				const cron_job = new cron.CronJob(
					phase_change_date,
					async function() {
						await global.GameForge.setPhase(new_phase)
					},
				);
				cron_job.start();
			}
			else {
				const announce_chnl = await this.getAnnounceChannel();
				announce_chnl.send("LL must've really messed up because we're past the phase change time");
			}
		}

		const cron_job = new cron.CronJob(
			"00 00 00 * * *",
			async function() {
				await global.GameForge.resetDailyProposals();
			},
			null,
			true,
			"America/New_York",
		);
		cron_job.start();
	}

	async getAnnounceChannel() {
		const gameforge_guild = await getGuild(ids.servers.gameforge);
		const announce_chnl = await getChannel(gameforge_guild, ids.gameforge.channels.announcements);
		return announce_chnl;
	}

	async announceMessage(message) {
		const announce_chnl = await this.getAnnounceChannel();
		announce_chnl.send(message);
	}

	async loadGameDataFromDatabase() {
		const
			axios = require('axios'),
			owner = "alexcarron",
			repo = "brobot-database";


		// Get the current file data
		const {data: file} =
			await axios.get(
				`https://api.github.com/repos/${owner}/${repo}/contents/${GameForge.github_path}`,
				{
					headers: {
						'Authorization': `Token ${github_token}`
					}
				}
			)
			.catch(err => {
				console.error(err);
			});


		let gameforge_game_str = Buffer.from(file.content, 'base64').toString();
		let gameforge_game = JSON.parse(gameforge_game_str);

		this.setGameForgeGame(gameforge_game);
	}

	async saveGameDataToDatabase() {
		console.log("Saving GameForge Data...")
		const
			axios = require('axios'),
			owner = "alexcarron",
			repo = "brobot-database",
			gameforge_game = this,
			gameforge_game_str = JSON.stringify(gameforge_game);



			try {
        // Get the current file data
        const { data: file } = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents/${GameForge.github_path}`,
            {
                headers: {
                    'Authorization': `Token ${github_token}`
                }
            }
        );

        // Update the file content
        const updatedContent = await new Buffer.from(gameforge_game_str).toString('base64');

        try {
            await axios.put(
                `https://api.github.com/repos/${owner}/${repo}/contents/${GameForge.github_path}`,
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
                    `https://api.github.com/repos/${owner}/${repo}/contents/${GameForge.github_path}`,
                    {
                        headers: {
                            'Authorization': `Token ${github_token}`
                        }
                    }
                );

                await axios.put(
                    `https://api.github.com/repos/${owner}/${repo}/contents/${GameForge.github_path}`,
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

	async resetDailyProposals() {
		this.hosts.forEach(async host => {
			await host.resetDailyProposal()
		})
	}

	async addHost(host) {
		this.hosts.push(host);

		const gameforge_guild =	await getGuild(ids.servers.gameforge);
		const host_role = await getRole(gameforge_guild, "Host");
		const outsider_role = await getRole(gameforge_guild, "Outsider");
		const host_guild_member = await getGuildMember(gameforge_guild, host.id);
		await removeRole(host_guild_member, outsider_role);
		await addRole(host_guild_member, host_role);
		try {
			await setNickname(host_guild_member, host.name).catch(console.error());
		}
		catch {

		}

		await global.GameForge.saveGameDataToDatabase();
	}

	async addProposedRule(proposed_rule) {
		// const current_date = new Date();

		// const judgement_date = new Date(current_date);

		// judgement_date.setDate(current_date.getDate()+1);
		// judgement_date.setSeconds(current_date.getSeconds() + GameForge.SECONDS_TILL_JUDGEMENT);

		// proposed_rule.setJudgementTime(judgement_date.toString());

		await proposed_rule.createMessage();

		this.proposed_rules.push(proposed_rule);


		const gameforge_guild = await getGuild(ids.servers.gameforge);
		const staff_chnl = await getChannel(gameforge_guild, ids.gameforge.channels.staff);
		await staff_chnl.send(`<@${ids.users.LL}> a rule has been proposed!`);

		await global.GameForge.saveGameDataToDatabase();
	}

	async discardProposedRule(proposed_rule, sendAnnouncement=false) {
		await this.deleteProposedRule(proposed_rule.number);
		const discarded_rule = new DiscardedRule(proposed_rule);
		this.discarded_rules.push(discarded_rule);

		if (sendAnnouncement) {
			console.log("Sending discarded announcement");
			const gameforge_guild = await getGuild(ids.servers.gameforge);
			const announce_chnl = await getChannel(gameforge_guild, ids.gameforge.channels.announcements);
			await announce_chnl.send(
				`Proposed Rule **#${proposed_rule.number}** has been discarded.\n` +
				`https://discord.com/channels/${ids.servers.gameforge}/${ids.gameforge.channels.proposed_rules}/${proposed_rule.message}`
			);
		}

		console.log("Discarded Proposed Rule");
	}

	async addOfficialRule(proposed_creation_rule) {
		const official_rule = new OfficialRule( new Rule(proposed_creation_rule) );

		const gameforge_guild = await getGuild(ids.servers.gameforge);
		const official_rules_chnl = await getChannel(gameforge_guild, ids.gameforge.channels.official_rules);
		const official_rule_message = await official_rules_chnl.send(official_rule.toMessage());

		official_rule.message = official_rule_message.id;

		this.official_rules.push(official_rule);

		const announce_chnl = await getChannel(gameforge_guild, ids.gameforge.channels.announcements);
		await announce_chnl.send(
			`Proposed Rule **#${proposed_creation_rule.number}** has become an offical rule.\n` +
			`https://discord.com/channels/${ids.servers.gameforge}/${ids.gameforge.channels.proposed_rules}/${proposed_creation_rule.message}`
		);

		console.log("Added Official Rule")
	}

	async editOfficialRule(proposed_modification_rule) {
		console.log({proposed_modification_rule});

		const gameforge_guild = await getGuild(ids.servers.gameforge);

		const official_rule_modifying = await this.getOfficialRuleFromNum(proposed_modification_rule.num_rule_modifying);
		official_rule_modifying.description = proposed_modification_rule.description;
		await official_rule_modifying.updateMessage();

		const announce_chnl = await getChannel(gameforge_guild, ids.gameforge.channels.announcements);
		await announce_chnl.send(
			`Proposed Rule **#${proposed_modification_rule.number}** has modified Offical Rule **#${proposed_modification_rule.num_rule_modifying}**.\n` +
			`https://discord.com/channels/${ids.servers.gameforge}/${ids.gameforge.channels.proposed_rules}/${proposed_modification_rule.message}`
			);

		const staff_chnl = await getChannel(gameforge_guild, ids.gameforge.channels.staff);
		await staff_chnl.send(`<@${ids.users.LL}> Official Rule Modified`);

		console.log("Edited Official Rule")
	}

	async removeOfficialRule(proposed_removal_rule) {
		const gameforge_guild = await getGuild(ids.servers.gameforge);

		const official_rule_removing = await this.getOfficialRuleFromNum(proposed_removal_rule.num_rule_removing);
		await official_rule_removing.deleteMessage();
		this.official_rules.splice(proposed_removal_rule.num_rule_removing, 1);
		const announce_chnl = await getChannel(gameforge_guild, ids.gameforge.channels.announcements);
		await announce_chnl.send(
			`Proposed Rule **#${proposed_removal_rule.number}** has removed Offical Rule **#${proposed_removal_rule.num_rule_removing}**.\n` +
			`https://discord.com/channels/${ids.servers.gameforge}/${ids.gameforge.channels.proposed_rules}/${proposed_removal_rule.message}`
		);

		const staff_chnl = await getChannel(gameforge_guild, ids.gameforge.channels.staff);
		await staff_chnl.send(`<@${ids.users.LL}> Official Rule Removed`);

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

	async deleteProposedRule(rule_num) {
		const proposed_rule_index = this.proposed_rules.findIndex(proposed_rule => proposed_rule.number === rule_num);
		this.proposed_rules.splice(proposed_rule_index, 1);
	}

	getHostByID(id) {
		return this.hosts.find(host => host.id === id);
	}


	async removeHostByID(id) {
		const host_index = this.hosts.findIndex(host => host.id === id);
		this.hosts.splice(host_index, 1);
		await this.saveGameDataToDatabase();
	}

	logError(error_msg) {
		console.log({error_msg});
	}


	static async getHostsAutocomplete(interaction) {
		let autocomplete_values;
		const focused_param = await interaction.options.getFocused(true);
		if (!focused_param) return;
		const entered_value = focused_param.value;

		console.log({focused_param, entered_value});

		autocomplete_values = global.GameForge.hosts
			.map((host) => {return {name: host.name, value: host.id}})
			.filter(autocomplete_entry => autocomplete_entry.name.toLowerCase().startsWith(entered_value.toLowerCase()));

		if (Object.values(autocomplete_values).length <= 0) {
			autocomplete_values = [{name: "Sorry, there are no hosts to choose from", value: "N/A"}];
		}
		else if (Object.values(autocomplete_values).length > 25) {
			autocomplete_values.splice(25);
		}

		await interaction.respond(
			autocomplete_values
		);
	}

	async setTopic(topic) {
		this.topic = topic;
	}

	async setPhase(phase) {
		console.log("Setting Phase to " + phase);

		this.phase = phase;

		const gameforge_guild = await getGuild(ids.servers.gameforge);
		const announce_chnl = await getChannel(gameforge_guild, ids.gameforge.channels.announcements);

		if (phase === GameForgePhases.Proposing || phase === GameForgePhases.Voting) {
			let next_phase;
			if (phase === GameForgePhases.Proposing) {
				next_phase = GameForgePhases.Voting;

				console.log("\n\nJudging All Proposals");
				const proposals_to_judge = global.GameForge.proposed_rules;

				for (let proposal_index = proposals_to_judge.length - 1; proposal_index >= 0; proposal_index--) {
					const proposed_rule = proposals_to_judge[proposal_index];
					console.log("\nJudging Proposal...");
					console.log({proposed_rule});
					await proposed_rule.makeJudgement({isEarly: false, doesSave: false});
					console.log(`Judged Proposal #${proposed_rule.number}`);
				}

				console.log("Judged all proposals");
				await this.resetTopic();

				console.log("\n\nSending Announcement");
				await announce_chnl.send(
					`# <@&${ids.gameforge.roles.host}> It is now the **${phase}** phase` + "\n" +
					`- Check out the new <#${ids.gameforge.channels.official_rules}>\n` +
					`- Discuss what you want to add to the game next in <#${ids.gameforge.channels.game_discussion}>\n` +
					`- Propose that addition to the game using the command \`/propose-rules\`` + `\n` +
					`\n` +
					`**Question(s) To Consider**: ${this.topic}`
				);
			}
			else {
				next_phase = GameForgePhases.Proposing;

				console.log("\n\nAdding Buttons To All Proposals");
				const proposals_to_add_buttons = global.GameForge.proposed_rules;

				for (let proposal_index = proposals_to_add_buttons.length - 1; proposal_index >= 0; proposal_index--) {
					const proposed_rule = proposals_to_add_buttons[proposal_index];
					console.log("\nAdding Buttons To...");
					console.log({proposed_rule});
					await proposed_rule.updateMessage();
					await proposed_rule.addButtonsToMessage();
					console.log(`Added Buttons #${proposed_rule.number}`);
				}

				console.log("Added buttons to all proposals");

				await announce_chnl.send(
					`# It is now the **${phase}** phase` + "\n" +
					`- Look at all the rules that have been proposed` + "\n" +
					`- Discuss in the proposal threads what you think about the rules` + "\n" +
					`- Vote on the existing proposed rules` + "\n" +
					`- Discuss what rules should be added next` + "\n" +
					`\n` +
					`<@&${ids.gameforge.roles.host}>`
				);
			}

			console.log({new_phase: next_phase});

			const current_date = new Date();
			const phase_change_date = new Date(current_date);

			phase_change_date.setSeconds(current_date.getSeconds() + GameForge.SECONDS_BETWEEN_PHASES);

			console.log({phase_change_date});

			const cron_job = new cron.CronJob(
				phase_change_date,
				async function() {
					await global.GameForge.setPhase(next_phase);
				},
			);
			cron_job.start();

			this.phase_change_date = phase_change_date.toString();
			console.log(this.phase_change_date);

			await this.saveGameDataToDatabase();
		}
	}

	static async toLeaderboardEmbed(current_page, pages) {
		const HOSTS_PER_PAGE = pages[0].length;
		const NUM_PAGES = pages.length

		// Create the leaderboard embed
		const leaderboard_embed = new EmbedBuilder()
			.setColor(0x1cc347)
			.setTitle(`GameForge Leaderboard (Page ${current_page}/${NUM_PAGES})`)
			.setDescription('Here are the top level hosts:')
			.setTimestamp();

		const page = pages[current_page-1];

		// Add each viewer to the leaderboard embed
		let embed_description = "";
		for (let index in page) {
			let host = page[index];
			const rank = parseInt(index) + (current_page-1)*HOSTS_PER_PAGE + 1;
			const name = host.name;
			const level = host.level;

			embed_description += `\`Lvl ${level}\` **${name}**: ${host.xp} XP` + "\n"
		}

		leaderboard_embed.setDescription(embed_description);

		return leaderboard_embed;
	}

	static async toLeaderboardMessageOptions(current_page, pages) {
		const leaderboard_embed = await GameForge.toLeaderboardEmbed(current_page, pages);

		const left_button = new ButtonBuilder()
			.setCustomId('left')
			.setLabel("👈")
			.setStyle(ButtonStyle.Secondary);

		const right_button = new ButtonBuilder()
			.setCustomId('right')
			.setLabel("👉")
			.setStyle(ButtonStyle.Secondary);

		const action_row = new ActionRowBuilder()
			.addComponents(left_button, right_button)

		const message_options = {
			embeds: [leaderboard_embed],
			components: [action_row],
		};

		return message_options;
	}

	async replyWithLeaderboardMessage(interaction) {
		const HOSTS_PER_PAGE = 25;
		const NUM_PAGES = Math.ceil(this.hosts.length / HOSTS_PER_PAGE);
		let current_page = 1;
		const pages = [];

		const sorted_hosts =
			this.hosts
				.sort(
					(a, b) => (b.level*10000 + b.xp) - (a.level*10000 + a.xp)
				);

		for (let page_index = 0; page_index < NUM_PAGES; page_index++) {
			const start_index = page_index * HOSTS_PER_PAGE;
			const end_index = start_index + HOSTS_PER_PAGE;
			const page_of_hosts = sorted_hosts.slice(start_index, end_index);
			pages.push(page_of_hosts);
		};

		const message_options = await GameForge.toLeaderboardMessageOptions(current_page, pages);

		const leaderboard_msg = await interaction.editReply(message_options);

		const readButtonInteractions = async function(message, current_page) {
			const collectorFilter = function(button_interaction) {
				return button_interaction.user.id === interaction.user.id;
			};

			let button_interaction;

			try {
				button_interaction = await message.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

				if (button_interaction.customId === 'left') {
					console.log("They clicked left");
					if (current_page > 1) {
						console.log("Previous Page");
						current_page--;
					}

					const message_options = await GameForge.toLeaderboardMessageOptions(current_page, pages);
					await button_interaction.update(message_options);
					await readButtonInteractions(message, current_page);
				}
				else if (button_interaction.customId === 'right') {
					console.log("right");
					if (current_page < NUM_PAGES - 1) {
						console.log("Next Page");
						current_page++;
					}

					const message_options = await GameForge.toLeaderboardMessageOptions(current_page, pages);
					await button_interaction.update(message_options);
					await readButtonInteractions(message, current_page);
				}
				else {
					const new_leaderboard_embed = GameForge.toLeaderboardEmbed(current_page, pages);
					await button_interaction.update({ embeds: [new_leaderboard_embed], components: [] });
				}
			}
			catch (error) {
				console.log("Waited Too Long...")
				console.error(error);
			}
		}

		readButtonInteractions(leaderboard_msg, current_page);
	}

	async resetTopic() {
		let challenge_num_topic = undefined;

		console.log(this.official_rules);

		for (let challenge_num = 1; challenge_num <= GameForge.NUM_CHALLENGES; challenge_num++) {
			const isAnyRuleAboutChallenge = this.official_rules.some(rule => rule.isAboutChallenge(challenge_num));

			console.log({isAnyRuleAboutChallenge});
			if (isAnyRuleAboutChallenge) {
				continue;
			}
			else {
				challenge_num_topic = challenge_num
				// console.log({challenge_num_topic});
				break;
			}
		}
		if (GameForge.TOPICS.length > 0) {
			this.topic = getRandArrayItem(GameForge.TOPICS);
		} else if (challenge_num_topic) {
			this.topic = `Challeneg ${challenge_num_topic} doesn't exist yet. What ideas do you have for it? Any specific mechanics, story, or dynamics come to mind for the challenge? What would be fun and unique?`;
		}
		else {
			this.topic = `The mechanics of the overall game`;
		}

	}
}

module.exports = GameForge;