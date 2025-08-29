const { User, AutocompleteInteraction, ChatInputCommandInteraction } = require("discord.js");
const { saveObjectToJsonInGitHub, loadObjectFromJsonInGitHub } = require("../../utilities/persistent-storage-utils.js");
const Viewer = require("./viewer.js");

/**
 * A class to handle the game data that persists across mulitple sessions on github
 */
class LLPointManager {
	constructor() {
		this.viewers = new Map();
		this.sha = "";
	}

	async updateViewersFromDatabase() {
		/**
		 * @type {any}
		 */
		const viewers = await loadObjectFromJsonInGitHub("viewers");
		this.setViewers(viewers);
	}

	async updateDatabase() {
		const viewers = Object.fromEntries(this.viewers);
		await saveObjectToJsonInGitHub(viewers, "viewers");
	}


	/**
	 * Sets the viewers for this manager based on the given object.
	 * @param {Record<string, Viewer>} viewers_obj - An object where the keys are the names of the viewers
	 * and the values are objects with the properties that the Viewer class accepts in its constructor.
	 */
	setViewers(viewers_obj) {
		for (let name in viewers_obj) {
			let viewer_properties = viewers_obj[name];
			this.addViewer(new Viewer(viewer_properties));
		}
	}


	getViewers() {
		return this.viewers;
	}

	getArrayOfViewers() {
		return Array.from(this.viewers.values());
	}

	getViewerNames() {
		return Array.from(this.viewers.values()).map(viewer => viewer.name);
	}

	/**
	 * @param {string} user_id - The id of the user whose viewer to find.
	 * @returns {Promise<Viewer | undefined>} A promise that resolves with the viewer associated with the given user id, or undefined if no viewer associated with the given user id exists.
	 */
	async getViewerById(user_id) {
		return await this.getArrayOfViewers().find(viewer => viewer.user_id === user_id);
	}

	/**
	 * Adds a viewer to the manager.
	 * @param {Viewer} viewer - The viewer to add.
	 */
	addViewer(viewer) {
		this.viewers.set(viewer.name, viewer);
	}

	/**
	 * Changes the name of an existing viewer.
	 * @param {string} currentViewerName - The current name of the viewer to be changed.
	 * @param {string} newViewerName - The new name to assign to the viewer.
	 * @returns {Promise<void>} A promise that resolves once the viewer's name has been updated in the database.
	 */
	async changeNameOfViewer(currentViewerName, newViewerName) {
		const viewer = this.viewers.get(currentViewerName);
		if (!viewer) return;

		viewer.name = newViewerName;
		this.viewers.set(newViewerName, viewer);
		this.viewers.delete(currentViewerName);
		await this.updateDatabase();
	}

	/**
	 * Creates a new viewer with the given user's username and user id.
	 * The viewer is then added to the manager.
	 * @param {User} viewer_user - The user whose information to use when creating the new viewer.
	 */
	addViewerFromUser(viewer_user) {
		let new_viewer = new Viewer({
			name: viewer_user.username,
			ll_points: 0,
			user_id: viewer_user.id,
		});

		this.addViewer(new_viewer);
	}

	/**
	 * Removes a viewer from the manager.
	 * @param {Viewer} viewer - The viewer to remove.
	 */
	removeViewer(viewer) {
		this.viewers.delete(viewer.name);
	}

	/**
	 * @param {string} name - The name of the viewer to find.
	 * @returns {Viewer | undefined} The viewer associated with the given name, or undefined if no viewer associated with the given name exists.
	 */
	getViewerByName(name) {
		return this.viewers.get(name);
	}

	getNumViewers() {
		return this.viewers.size;
	}

	/**
	 * Returns the rank of a viewer in the manager, ranked by LL Points in descending order.
	 * @param {string} name - The name of the viewer to find the rank of.
	 * @returns {number} The rank of the viewer, or 0 if the viewer does not exist.
	 */
	getRankOfViewer(name) {
		const sorted_viewers_array =
			this.getArrayOfViewers().sort(
				(viewer1, viewer2) => {
					return viewer2.ll_points - viewer1.ll_points;
				}
			)

		const rank = sorted_viewers_array.findIndex((viewer) => viewer.name === name) + 1;

		return rank;
	}

	getViewersArray() {
		return Array.from(this.viewers.values());
	}

	/**
	 * Responds to an interaction with a list of autocomplete options based on the user's input.
	 * The list of autocomplete options is filtered based on the entered value, and capped at 25.
	 * If no options are found, a default message is returned.
	 * @param {AutocompleteInteraction} interaction - The interaction to respond to.
	 * @returns {Promise<void>}
	 */
	static async getViewersAutocompleteValues(interaction) {
		let autocomplete_values;
		const focused_param = await interaction.options.getFocused(true);
		if (!focused_param) return;
		const entered_value = focused_param.value;

		autocomplete_values = global.LLPointManager.getViewersArray()
			.map((viewer) => {return {name: viewer.name, value: viewer.name}})
			.filter(autocomplete_entry => autocomplete_entry.value.toLowerCase().startsWith(entered_value.toLowerCase()));

		if (Object.values(autocomplete_values).length <= 0) {
			autocomplete_values = [{name: "Sorry, there are no viewers to choose from", value: "N/A"}];
		}
		else if (Object.values(autocomplete_values).length > 25) {
			autocomplete_values.splice(25);
		}

		await interaction.respond(
			autocomplete_values
		);
	}

	async giveTiersToViewers() {
		this.getArrayOfViewers().forEach(viewer => viewer.tier = viewer.getTier());

		const viewersWithUserID = this.getArrayOfViewers().filter(viewer => viewer.user_id);

		for (const viewer of viewersWithUserID) {
			viewer.tier = await viewer.getTier();
			await viewer.setTierRole();
			// let tier = viewer.tier;

			// if (tier === LLPointTiers.LLViewer)
			// 	continue

			// const
			// 	tier_role_id = ids.ll_game_shows.roles[tier],
			// 	ll_game_shows_guild = await getGuild(ids.ll_game_shows.server_id);

			// try {
			// 	const
			// 		viewer_guild_member = await fetchGuildMember(ll_game_shows_guild, viewer.user_id),
			// 		tier_role = await fetchRole(ll_game_shows_guild, tier_role_id);
			// 	await addRoleToMember(viewer_guild_member, tier_role);
			// }
			// catch (exception) {
			// 	logInfo("Member not found on Discord Server");
			// 	continue
			// }
		}
	}

	/**
	 * @param {ChatInputCommandInteraction} interaction - The interaction to get the user from
	 * @returns {Promise<Viewer>} - The viewer associated with the user ID from the interaction. If the viewer does not exist, it will be created and added to the database.
	 */
	async getViewerOrCreateViewer(interaction) {
		const user_id = interaction.user.id;
		const viewer = await this.getViewerById(user_id);

		if (!viewer) {
			if (interaction.channel !== null)
				interaction.channel.send(`You have not been added to the LL Point database yet. You will be added as **${interaction.user.username}**`);

			this.addViewerFromUser(interaction.user);

			await this.updateDatabase();

			const viewer = await this.getViewerById(interaction.user.id);
			if (!viewer) {
				throw new Error(`Viewer ${interaction.user.username} could not be found in the database after being added.`);
			}
			return viewer
		}
		else {
			return viewer
		}
	}
}

module.exports = { LLPointManager };