const { ids } = require("../../bot-config/discord-ids");
const { fetchGuild, fetchGuildMember, fetchUser, fetchRole } = require("../../utilities/discord-fetch-utils.js");
const { addRoleToMember, removeRoleFromMember } = require("../../utilities/discord-action-utils");
const { LLPointTier, LLPointThreshold, LLPointReward, LLPointAccomplishment } = require("./ll-point-enums.js");
const { logInfo, logError, logSuccess, logWarning } = require("../../utilities/logging-utils.js");
const { throwIfNotError } = require("../../utilities/error-utils");

/**

 */
class Viewer {
	/**
	 * Constructs a new Viewer from the given parameters
	 * @param {object} obj - object with parameters
	 * @param {string} obj.name - the name of the viewer
	 * @param {string[]} [obj.aliases] - an array of aliases the viewer has gone by
	 * @param {string} obj.user_id - the Discord user ID of the viewer
	 * @param {number} [obj.ll_points] - the number of LL points the viewer has
	 * @param {boolean} [obj.isSubscribed] - whether the viewer is currently subscribed to LLGS
	 * @param {boolean} [obj.didUndertaleQuiz] - whether the viewer has completed the Undertale quiz
	 * @param {boolean} [obj.didDeltaruneQuiz] - whether the viewer has completed the Deltarune quiz
	 * @param {string[]} [obj.games_participated_in] - an array of game names the viewer has participated in
	 * @param {string | null} [obj.valentine] - the name of the viewer's valentine, or null if they don't have one
	 */
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

	/**
	 * Calculates the tier of the viewer based on the number of LL points they have
	 * @returns {LLPointTier[keyof typeof LLPointTier]} the tier of the viewer
	 */
	getTier() {
		let tier = LLPointTier.VIEWER;

		for (let key in LLPointTier) {
			/**
			 * @type {keyof typeof LLPointThreshold}
			 */
			const tier_key = /** @type {keyof typeof LLPointThreshold} */ (key);
			let tier_threshold = LLPointThreshold[tier_key];

			if (this.ll_points >= tier_threshold) {
				// @ts-ignore
				tier = LLPointTier[tier_key];
				break;
			}
		}

		return tier
	}

	async setTierRole() {
		let viewer_guild_member;

		const tier = this.getTier();

		if (
			tier === LLPointTier.VIEWER ||
			!this.user_id
		)
			return

		const tier_role_id = ids.ll_game_shows.roles[tier],
			ll_game_shows_guild = await fetchGuild(ids.ll_game_shows.server_id);

		logInfo(`Setting ${this.name}'s Tier to ${tier}`);

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
			throwIfNotError(error);
			logError("There was an error assigning roles", error);
		}

		logSuccess('Tier role set successfully');
	}

	/**
	 * Sets the viewer's valentine to the given viewer
	 * @param {Viewer} valentine_viewer - the viewer to set as the valentine
	 */
	setValentine(valentine_viewer) {
		const valentine_name = valentine_viewer.name;
		this.valentine = valentine_name
	}

	/**
	 * Gives the viewer a reward based on the given accomplishment.
	 * If the viewer has already completed the given accomplishment, an error message is returned.
	 * @param {string} accomplishment - the accomplishment to reward the viewer for
	 * @param {string} [game_name] - the name of the game or event the viewer participated in
	 * @returns {Promise<string>} - a success or error message
	 */
	async giveReward(accomplishment, game_name=undefined) {

		let accomplishments = Object.values(LLPointAccomplishment);
		// @ts-ignore
		if (!accomplishments.includes(accomplishment)) {
			logWarning(`No accomplishment called ${accomplishment}. Choose between: ${accomplishments.join(", ")}`);
			return `Error: No accomplishment called ${accomplishment}`;
		}
		let accomplishment_key =
			Object.keys(LLPointAccomplishment)
				.find(
					// @ts-ignore
					key => LLPointAccomplishment[key] === accomplishment
				);
		if (accomplishment_key === undefined) {
			logWarning(`No accomplishment called ${accomplishment}. Choose between: ${accomplishments.join(", ")}`);
			return `Error: No accomplishment called ${accomplishment}`;
		}

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
				if (game_name === undefined)
					return "Error: Game name not provided";

				if (this.games_participated_in.includes(game_name))
					return `Error: Already participated in ${game_name}`;

				this.games_participated_in.push(game_name);
				break;

			case LLPointAccomplishment.PARTICIPATE_IN_EVENT:
				if (game_name === undefined)
					return "Error: Event name not provided";

				if (this.games_participated_in.includes(game_name))
					return `Error: Already participated in ${game_name}`;

				this.games_participated_in.push(game_name);
				break;
		}

		// @ts-ignore
		await this.addLLPoints(LLPointReward[accomplishment_key]);
		return "Success";
	}

	/**
	 * Adds the given amount of LL points to the viewer's total amount of LL points
	 * and checks if the viewer's tier has changed. If the tier has changed, sends
	 * a direct message to the viewer with the old and new tier. Also sets the
	 * viewer's tier role in the LL Game Shows server.
	 * @param {number} amount - the amount of LL points to add
	 */
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

	/**
	 * Sends a direct message to the viewer to inform them that they have been
	 * promoted to a new tier.
	 * @param {string} old_tier - the tier the viewer was previously in
	 * @param {string} new_tier - the tier the viewer is now in
	 */
	async dmTierChange(old_tier, new_tier) {
		const user = await fetchUser(this.user_id);
		await user.send(`You have been promoted from **${old_tier}** to **${new_tier}**. Congratulations!`);
	}

	/**
	 * Sends a direct message to the viewer or to me (LL) if the viewer ID is not set.
	 * @param {string} message - the message to be sent
	 */
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