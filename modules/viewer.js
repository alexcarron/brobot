const { LLPointTiers, LLPointThresholds, LLPointRewards, LLPointAccomplishments } = require("./enums.js");
const ids = require("../databases/ids.json");
const { getGuild, getGuildMember, getRoleById, addRole, removeRole } = require("./functions.js");

class Viewer {
	constructor({name, aliases=[], user_id, ll_points=0, isSubscribed=false, didUndertaleQuiz=false, didDeltaruneQuiz=false, games_participated_in=[]}) {
		this.user_id = user_id;
		this.name = name;
		this.ll_points = ll_points;
		this.aliases = aliases;
		this.tier = this.getTier();
		this.isSubscribed = isSubscribed;
		this.didUndertaleQuiz = didUndertaleQuiz;
		this.didDeltaruneQuiz = didDeltaruneQuiz;
		this.games_participated_in = games_participated_in;
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
				ll_game_shows_guild = await getGuild(ids.ll_game_shows.server_id);

			if (
				tier === LLPointTiers.LLViewer ||
				!this.user_id
			)
				return

			try {
				viewer_guild_member = await getGuildMember(ll_game_shows_guild, this.user_id);
			}
			catch (exception) {
				console.log("Member not found on Discord Server");
				return
			}

			try {

				Object.values(ids.ll_game_shows.roles).map(
					async (role_id) => {
						console.log(role_id);
						const role = await getRoleById(ll_game_shows_guild, role_id);
						console.log(role.name);
						removeRole(viewer_guild_member, role);
					}
				)

				const tier_role = await getRoleById(ll_game_shows_guild, tier_role_id);
				console.log(tier_role.name);
				await addRole(viewer_guild_member, tier_role);
			}
			catch (exception) {
				console.log(exception);
				console.log("There was an error assigning roles");
			}

	}

	giveReward(accomplishment, game_name=undefined) {

		let accomplishments = Object.values(LLPointAccomplishments);
		if (!accomplishments.includes(accomplishment)) {
			console.log(`Error: No accomplishment called ${accomplishment}`);
			console.log(`Choose between: ${accomplishments.join(", ")}`);
			return `Error: No accomplishment called ${accomplishment}`;
		}
		let accomplishment_key = Object.keys(LLPointAccomplishments).find(key => LLPointAccomplishments[key] === accomplishment);

		switch (accomplishment) {
			case LLPointAccomplishments.Subscribe:
				if (this.isSubscribed) {
					console.log("Error: Already subscribed");
					return "Error: Already subscribed";
				}

				this.isSubscribed = true;
				break;

			case LLPointAccomplishments.DoUndertaleQuiz:
				if (this.didUndertaleQuiz) {
					console.log("Error: Already did Undertale Music Quiz");
					return "Error: Already did Undertale Music Quiz";
				}

				this.didUndertaleQuiz = true;
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
		}

		this.ll_points += LLPointRewards[accomplishment_key];
		return "Success";
	}

	addLLPoints(amount) {
		this.ll_points += amount;
		this.tier = this.getTier();
		this.setTierRole();
	}
}

module.exports = Viewer;