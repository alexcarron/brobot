const ids = require("../../bot-config/discord-ids.js");
const { fetchGuild, fetchGuildMember, fetchUser, fetchRole } = require("../../utilities/discord-fetch-utils.js");
const { addRoleToMember, removeRoleFromMember } = require("../../utilities/discord-action-utils.js");
const { LLPointTier, LLPointThreshold, LLPointReward, LLPointAccomplishment } = require("./ll-point-enums.js");
const { logInfo, logError, logSuccess, logWarning } = require("../../utilities/logging-utils.js");

/**
 *
 */
class Viewer {
	constructor({name, aliases=[], user_id, ll_points=0, isSubscribed=false, didUndertaleQuiz=false, didDeltaruneQuiz=false, games_participated_in=[], valentine=null}) {
		this.user_id = user_id;
		this.name = name;
		this.ll_points = ll_points;
		this.aliases = aliases;
		this.tier = this.getTier();
		this.isSubscribed = isSubscribed;
		this.didUndertaleQuiz = didUndertaleQuiz;
		this.didDeltaruneQuiz = didDeltaruneQuiz;
		this.games_participated_in = games_participated_in;
		this.valentine = valentine;
	}

	toString() {
		return (
			`${this.name}\n` +
			`Discord ID: ${this.user_id}\n` +
			`LL Points: ${this.ll_points}\n`
		);
	}

	getTier() {
		let tier = LLPointTier.VIEWER;

		for (let tier_key in LLPointTier) {
			let tier_threshold = LLPointThreshold[tier_key];

			if (this.ll_points >= tier_threshold) {
				tier = LLPointTier[tier_key];
				break;
			}
	}

		return tier
	}

	async setTierRole() {
		let viewer_guild_member;

		const
			tier = this.getTier(),
			tier_role_id = ids.ll_game_shows.roles[tier],
			ll_game_shows_guild = await fetchGuild(ids.ll_game_shows.server_id);

		logInfo(`Setting ${this.name}'s Tier to ${tier}`);

		if (
			tier === LLPointTier.VIEWER ||
			!this.user_id
		)
			return

		try {
			viewer_guild_member = await fetchGuildMember(ll_game_shows_guild, this.user_id);
		}
		catch (exception) {
			logInfo(`${this.name} not found on Discord Server`);
			return
		}

		try {

			Object.values(ids.ll_game_shows.roles).map(
				async (role_id) => {
					const role = await fetchRole(ll_game_shows_guild, role_id);
					logInfo(`Removing ${role.name} from ${this.name}`);
					removeRoleFromMember(viewer_guild_member, role);
				}
			)

			const tier_role = await fetchRole(ll_game_shows_guild, tier_role_id);
			await addRoleToMember(viewer_guild_member, tier_role);
			logInfo(`Adding ${tier_role.name} to ${this.name}`);
		}
		catch (error) {
			logError("There was an error assigning roles", error);
		}

		logSuccess('Tier role set successfully');
	}

	setValentine(valentine_viewer) {
		const valentine_name = valentine_viewer.name;
		this.valentine = valentine_name
	}

	async giveReward(accomplishment, game_name=undefined) {

		let accomplishments = Object.values(LLPointAccomplishment);
		if (!accomplishments.includes(accomplishment)) {
			logWarning(`No accomplishment called ${accomplishment}. Choose between: ${accomplishments.join(", ")}`);
			return `Error: No accomplishment called ${accomplishment}`;
		}
		let accomplishment_key = Object.keys(LLPointAccomplishment).find(key => LLPointAccomplishment[key] === accomplishment);

		switch (accomplishment) {
			case LLPointAccomplishment.SUBSCRIBE:
				if (this.isSubscribed) {
					return "Error: Already subscribed";
				}

				this.isSubscribed = true;
				break;

			case LLPointAccomplishment.DO_UNDERTALE_QUIZ:
				if (this.didUndertaleQuiz) {
					return "Error: Already did Undertale Music Quiz";
				}

				this.didUndertaleQuiz = true;
				break;

			case LLPointAccomplishment.DO_DELTARUNE_QUIZ:
				if (this.didDeltaruneQuiz) {
					return "Error: Already did Deltarune Music Quiz";
				}

				this.didDeltaruneQuiz = true;
				break;

			case LLPointAccomplishment.PARTICIPATE_IN_GAME:
				if (this.games_participated_in.includes(game_name)) {
					return `Error: Already participated in ${game_name}`;
				}

				this.games_participated_in.push(game_name);
				break;

			case LLPointAccomplishment.PARTICIPATE_IN_EVENT:
				if (this.games_participated_in.includes(game_name)) {
					return `Error: Already participated in ${game_name}`;
				}

				this.games_participated_in.push(game_name);
				break;
		}

		await this.addLLPoints(LLPointReward[accomplishment_key]);
		return "Success";
	}

	async addLLPoints(amount) {
		this.ll_points += amount;
		let old_tier = this.tier;
		let new_tier = this.getTier();

		if (new_tier !== old_tier) {
			this.tier = new_tier;
			await this.dmTierChange(old_tier, new_tier)
			await this.setTierRole();
		}
	}

	async dmTierChange(old_tier, new_tier) {
		const user = await fetchUser(this.user_id);
		await user.send(`You have been promoted from **${old_tier}** to **${new_tier}**. Congratulations!`);
	}

	async dm(message) {
		let user_id;
		if (this.user_id) {
			user_id = this.user_id;
		}
		else {
			user_id = ids.users.LL;
		}
		const user = await fetchUser(user_id);
		await user.send(message);
	}
}

module.exports = Viewer;