const { LLPointTiers, LLPointThresholds, LLPointRewards, LLPointAccomplishments } = require("./enums.js");
const ids = require("../bot-config/discord-ids.js");
const { removeRole } = require("./functions.js");
const { fetchGuild, fetchGuildMember, fetchUser, fetchRole } = require("../utilities/discord-fetch-utils.js");
const { addRoleToMember } = require("../utilities/discord-action-utils.js");

class Viewer {
	constructor({name, aliases=[], user_id, ll_points=0, isSubscribed=false, didUndertaleQuiz=false, didDeltaruneQuiz=false, games_participated_in=[], valentine}) {
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
		let tier = LLPointTiers.LLViewer;

		for (let tier_key in LLPointTiers) {
			let tier_threshold = LLPointThresholds[tier_key];

			if (this.ll_points >= tier_threshold) {
				tier = LLPointTiers[tier_key];
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

		console.log(`Setting ${this.name}'s Tier to ${tier}`);

		if (
			tier === LLPointTiers.LLViewer ||
			!this.user_id
		)
			return

		try {
			viewer_guild_member = await fetchGuildMember(ll_game_shows_guild, this.user_id);
		}
		catch (exception) {
			console.log(`${this.name} not found on Discord Server`);
			return
		}

		try {

			Object.values(ids.ll_game_shows.roles).map(
				async (role_id) => {
					const role = await fetchRole(ll_game_shows_guild, role_id);
					console.log(`Removing ${role.name} from ${this.name}`);
					removeRole(viewer_guild_member, role);
				}
			)

			const tier_role = await fetchRole(ll_game_shows_guild, tier_role_id);
			await addRoleToMember(viewer_guild_member, tier_role);
			console.log(`Adding ${tier_role.name} to ${this.name}`);
		}
		catch (exception) {
			console.log(exception);
			console.log("There was an error assigning roles");
		}

		console.log("Done.");

	}

	setValentine(valentine_viewer) {
		const valentine_name = valentine_viewer.name;
		this.valentine = valentine_name
	}

	async giveReward(accomplishment, game_name=undefined) {

		let accomplishments = Object.values(LLPointAccomplishments);
		if (!accomplishments.includes(accomplishment)) {
			console.log(`Error: No accomplishment called ${accomplishment}`);
			console.log(`Choose between: ${accomplishments.join(", ")}`);
			return `Error: No accomplishment called ${accomplishment}`;
		}
		let accomplishment_key = Object.keys(LLPointAccomplishments).find(key => LLPointAccomplishments[key] === accomplishment);

		console.log({accomplishment});
		console.log(LLPointAccomplishments.DoUndertaleQuiz);

		switch (accomplishment) {
			case LLPointAccomplishments.Subscribe:
				if (this.isSubscribed) {
					console.log("Error: Already subscribed");
					return "Error: Already subscribed";
				}

				this.isSubscribed = true;
				break;

			case LLPointAccomplishments.DoUndertaleQuiz:
				console.log("HELLO!")
				if (this.didUndertaleQuiz) {
					console.log("Error: Already did Undertale Music Quiz");
					return "Error: Already did Undertale Music Quiz";
				}

				this.didUndertaleQuiz = true;
				console.log(this)
				break;

			case LLPointAccomplishments.DoDeltaruneQuiz:
				if (this.didDeltaruneQuiz) {
					console.log("Error: Already did Deltarune Music Quiz");
					return "Error: Already did Deltarune Music Quiz";
				}

				this.didDeltaruneQuiz = true;
				break;

			case LLPointAccomplishments.ParticipateInGame:
				if (this.games_participated_in.includes(game_name)) {
					console.log(`Error: Already participated in ${game_name}`);
					return;
				}

				this.games_participated_in.push(game_name);
				break;

			case LLPointAccomplishments.ParticipateInEvent:
				if (this.games_participated_in.includes(game_name)) {
					console.log(`Error: Already participated in ${game_name}`);
					return;
				}

				this.games_participated_in.push(game_name);
				break;
		}

		await this.addLLPoints(LLPointRewards[accomplishment_key]);
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
		console.log({old_tier, new_tier});
		console.log(this.user_id);
		const user = await fetchUser(this.user_id);
		console.log({user})
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