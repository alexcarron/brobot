const validator = require("../../utilities/validator");
const { XPRewards, XPTaskKeys, XPTaskVerbs, GameForgeMilestones, XPMilestoneRewards, GameForgeBadges, LevelXPRequirements, LevelXPRequirementMultiplier, GameForgeBadgeChanceRewards } = require("../enums");
const { getUser, addRole, getRole, getGuild, getGuildMember, getRandomHexColorNumber, getProgressBar, replyToInteraction, removeRole } = require("../functions");
const ids = require(`../../databases/ids.json`);
const { EmbedBuilder } = require("discord.js");

class Host {
	name;
	id;
	xp;
	level;
	hasProposedToday;
	num_times;
	num_chances_to_be_contestant;
	custom_color;
	voting_multiplier;

	constructor({
		name = "",
		id = "",
		xp = 0,
		level = 0,
		hasProposedToday = false,
		num_times = Host.getDefaultNumTimes(),
		num_chances_to_be_contestant = 0,
		voting_multiplier = 1,
		custom_color = undefined,
	}) {
		this.name = name;
		this.id = id;
		this.xp = xp;
		this.level = level;
		this.hasProposedToday = hasProposedToday;
		this.num_times = num_times;
		this.voting_multiplier = voting_multiplier;
		this.num_chances_to_be_contestant = num_chances_to_be_contestant;

	}

	static getDefaultNumTimes() {
		const num_times = {};

		for (const task_key in XPTaskKeys) {
			num_times[task_key] = 0;
		}

		return num_times;
	}

	static isHost(value) {
		return (
			validator.isObject(value) &&
			validator.doesObjectHaveKeys(value, "name", "id") &&
			typeof value.name === 'string' &&
			typeof value.id === 'string'
		)
	}

	static async getNextXPNeededForLvl(next_lvl) {

		if (next_lvl <= 5) {
			return LevelXPRequirements[next_lvl]
		} else {
			const num_set_xp_requirements = Object.values(LevelXPRequirements).length;
			const last_set_xp_requirements = Object.values(LevelXPRequirements)[num_set_xp_requirements-1];

			return (
				last_set_xp_requirements + (
					LevelXPRequirementMultiplier *
					(Math.floor((next_lvl-6) / 5) + 1)
				)
			);
		}
	}

	static async getTotalXPNeededForLvl(level) {
		let needed_xp_for_next_lvl = 0;

		for (let lvl = 1; lvl <= level; lvl++) {
			const next_xp_needed_for_lvl = await Host.getNextXPNeededForLvl(lvl)
			needed_xp_for_next_lvl += next_xp_needed_for_lvl;
		}

		return needed_xp_for_next_lvl;
	}

	async resetDailyProposal() {
		this.hasProposedToday = false;
	}

	async reachMilestone(task_str) {
		const host_user = await getUser(this.id);
		const milestone_amount = GameForgeMilestones[task_str];

		switch (task_str) {
			case XPTaskKeys.Vote: {
				await global.dm(host_user,
					`🎉 You reached the milestone of **${milestone_amount} votes!** 🎊`
				);
				await this.giveXP(XPMilestoneRewards.Vote, true);
				await this.giveBadge(GameForgeBadges.UltimateVoter, true);
			}

			case XPTaskKeys.Propose: {
				await global.dm(host_user,
					`🎉 You reached the milestone of **${milestone_amount} proposals!** 🎊`
				);
				await this.giveXP(XPMilestoneRewards.Propose, true);
				await this.giveBadge(GameForgeBadges.UltimateProposer, true);
			}

			case XPTaskKeys.CreateOfficialRule: {
				await global.dm(host_user,
					`🎉 You reached the milestone of creating **${milestone_amount} official rules!** 🎊`
				);
				await this.giveXP(XPMilestoneRewards.CreateOfficialRule, true);
				await this.giveBadge(GameForgeBadges.UltimateRuleForger, true);
			}

			default:
				await global.dm(host_user,
					`🎉 There has been an error! 🎊`
				);
				break;
		}
	}

	async rewardXPFor(task_str, interaction=undefined) {
		console.log(`${this.name}: ${this.xp} XP`);

		const tasks = Object.keys(XPRewards);
		const task_key = tasks.find(task => task.toLowerCase().startsWith(task_str.toLowerCase()));

		this.num_times[task_key] += 1;

		const xp_giving = XPRewards[task_key];
		const milestone_amount = GameForgeMilestones[task_key];

		await this.giveXP(xp_giving);
		console.log(`Rewarding ${this.name} for ${task_str}`);

		let message = ""
		if (xp_giving > 0)
			message = `🎉 **You got +${xp_giving} XP for ${XPTaskVerbs[task_key]}!** 🎊`;
		else
			message = `☹️ **You got ${xp_giving} XP for ${XPTaskVerbs[task_key]}...** 🤷`;

		if (interaction !== undefined && ![XPTaskKeys.CreateOfficialRule, XPTaskKeys.ProposeDissaprovedRule].includes(task_key)) {
			await replyToInteraction(interaction, message);
		}
		else if (task_key !== XPTaskKeys.Discuss) {
			const host_user = await getUser(this.id);

			await global.dm(host_user,message);
		}

		if (task_key === XPTaskKeys.Propose && !this.hasProposedToday) {
			console.log(`${this.name}: ${this.xp} XP`);
			this.hasProposedToday = true;
			await this.rewardXPFor(XPTaskKeys.DailyPropose, interaction);
			console.log(`${this.name}: ${this.xp} XP`);
		}

		if (milestone_amount && this.num_times[task_key] === milestone_amount) {
			await this.reachMilestone(task_key);
		}

		console.log(`${this.name}: ${this.xp} XP`);
		await global.GameForge.saveGameDataToDatabase();
	}

	async giveChancesAtBeingContestant(num_chances, sendMessage=false) {
		this.num_chances_to_be_contestant += num_chances;

		if (sendMessage) {
			const host_user = await getUser(this.id);
			await global.dm(host_user,`🎉 You've gained **${num_chances}** chances to be a contestant! 🎊`);
		}
	}

	async giveBadge(badge_str, sendMessage=false) {
		const badges = Object.keys(GameForgeBadges);
		const badge_key = badges.find(badge =>
			badge.toLowerCase().startsWith(badge_str.toLowerCase()) ||
			GameForgeBadges[badge].toLowerCase().startsWith(badge_str.toLowerCase())
		);
		const badge_role_name = GameForgeBadges[badge_key];

		const gameforge_guild = await getGuild(ids.servers.gameforge);
		const badge_role = await getRole(gameforge_guild, badge_role_name);
		const host_guild_member = await getGuildMember(gameforge_guild, this.id);
		try {
			await addRole(host_guild_member, badge_role);
		}
		catch {

		}

		const chances_gained = GameForgeBadgeChanceRewards[badge_key];
		await this.giveChancesAtBeingContestant(chances_gained, sendMessage);

		if (sendMessage) {
			const host_user = await getUser(this.id);
			await global.dm(host_user,`🎉 You got the **${badge_role_name}** badge! 🎊`);
		}
	}

	async removeBadge(badge_str) {
		const badges = Object.keys(GameForgeBadges);
		const badge_key = badges.find(badge =>
			badge.toLowerCase().startsWith(badge_str.toLowerCase()) ||
			GameForgeBadges[badge].toLowerCase().startsWith(badge_str.toLowerCase())
		);
		const badge_role_name = GameForgeBadges[badge_key];

		const gameforge_guild = await getGuild(ids.servers.gameforge);
		const badge_role = await getRole(gameforge_guild, badge_role_name);
		const host_guild_member = await getGuildMember(gameforge_guild, this.id);
		try {
			await removeRole(host_guild_member, badge_role);
		}
		catch {

		}
	}

	async giveXP(xp_giving, sendMessage=false) {
		this.xp += xp_giving;
		console.log(`Giving ${this.name} ${xp_giving} XP`);

		if (sendMessage) {
			const host_user = await getUser(this.id);
			await global.dm(host_user,`🎉 **You got +${xp_giving} XP** 🎊`);
		}

		await this.updateLevel(true);
	}

	async updateLevel(sendMessage) {
		const next_lvl = this.level + 1;
		let needed_xp_for_next_lvl = await Host.getTotalXPNeededForLvl(next_lvl);

		if (this.xp >= needed_xp_for_next_lvl) {
			this.level += 1

			if (sendMessage) {
				const host_user = await getUser(this.id);
				await global.dm(host_user,`🎉 You leveled up! You are now **level ${this.level}** in GameForge 🎊`);
			}

			switch (this.level) {
				case 1:
					await this.giveBadge(GameForgeBadges.FirstSteps, true);
					break;

				case 5:
					await this.giveCustomColorProposal();
					break;

				case 8:
					await this.giveLLPoints(1, true);
					break;

				case 10:
					await this.giveBadge(GameForgeBadges.Contributor, true);
					break;

				case 15:
					await this.giveLLPoints(1, true);
					break;

				case 20:
					await this.giveBadge(GameForgeBadges.MajorContributor, true);
					break;

				case 25:
					await this.giveCustomRoleColor();
					break;

				case 35:
					await this.giveLLPoints(2, true);
					break;

				case 50:
					await this.giveBadge(GameForgeBadges.Ruler, true);
					break;

				case 75:
					await this.giveLLPoints(3, true);
					break;

				case 100:
					await this.giveBadge(GameForgeBadges.RuleLeader, true);
					await this.giveVotingMultiplier(2, true);
					break;

				case 150:
					await this.giveLLPoints(5, true);
					break;

				case 200:
					await this.giveBadge(GameForgeBadges.TheContestant, true);
					await this.giveLLPoints(8, true);
					await this.giveVotingMultiplier(3, true);
					break;

				default:
					break;
			}

			await this.updateLevel(sendMessage);
		}
	}

	async giveCustomColorProposal() {
	}

	async giveVotingMultiplier(multiplier, sendMessage=false) {
		this.voting_multiplier = multiplier;

		if (sendMessage) {
			const host_user = await getUser(this.id);
			await global.dm(host_user,`🎉 Your voting multiplier has increased! Your vote will now count for **${multiplier} votes** 🎊`);
		}
	}

	async giveCustomRoleColor() {
		const host_user = await getUser(this.id);
		await global.dm(host_user,`🎉 You have gained a custom role color that aligns with your proposal color? 🎊`);
		await global.dm(host_user,`Would you like to change your color?`);
	}

	async giveLLPoints(num_ll_points, sendMessage=false) {
		if (sendMessage) {
			const host_user = await getUser(this.id);
			await global.dm(host_user,`🎉 You have recieved **${num_ll_points} LL Points!** 🎊`);
		}
		const viewer = await global.LLPointManager.getViewerById(this.id);

		console.log({viewer});

		try {
			viewer.addLLPoints(num_ll_points);
		}
		catch {
			const host_user = await getUser(this.id);
			await global.dm(host_user,"You're not in the database :(");
		}
	}

	async toEmbed() {
		const host_user = await getUser(this.id);
		const color = this.custom_color ?? getRandomHexColorNumber();
		const xp_needed_for_next_level = await Host.getNextXPNeededForLvl(this.level + 1);
		const xp_has_for_next_lvl = this.xp - await Host.getTotalXPNeededForLvl(this.level);

		console.log({color, xp_needed_for_next_level, xp_has_for_next_lvl});

		const embed_msg = new EmbedBuilder()
			.setColor(color)
			.setTitle(this.name)
			.setDescription(
				`**XP**: \`${this.xp}\`\n` +
				`**Level**: \`${this.level}\`\n` +
				`**Progress to Next Level**: ${getProgressBar(xp_has_for_next_lvl, xp_needed_for_next_level, 15)}\n` +
				`${xp_needed_for_next_level-xp_has_for_next_lvl} XP Needed`
			)

		embed_msg.setThumbnail(host_user.avatarURL());

		return embed_msg;
	}
}

module.exports = Host;