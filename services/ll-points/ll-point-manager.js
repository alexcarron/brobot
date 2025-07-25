const { GITHUB_TOKEN } = require("../../bot-config/token.js");
const { GitHubJsonURL, saveObjectToJsonInGitHub } = require("../../utilities/github-json-storage-utils.js");
const Viewer = require("./viewer.js");

/**
 * A class to handle the game data that persists across mulitple sessions on github
 */
class LLPointManager {
	constructor() {
		this.viewers = new Map();
		this.sha = "";
	}

	updateViewersFromDatabase() {
		const { promisify } = require('util');
		const request = promisify(require("request"));

		const options = {
			url: GitHubJsonURL.VIEWERS,
			headers: {
				'Authorization': `Token ${GITHUB_TOKEN}`
			},
		};


		request(
			options,
			(error, response, body) => {
				if (!error && response.statusCode == 200) {
					let viewers = JSON.parse(body);
					this.setViewers(viewers);
				} else {
					console.error(error);
				}
			}
		)
		.catch(err => {
			console.error(err);
		});
	}

	async updateDatabase() {
		const viewers = Object.fromEntries(this.viewers);
		await saveObjectToJsonInGitHub(viewers, "viewers");
	}


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

	async getViewerById(user_id) {
		return await this.getArrayOfViewers().find(viewer => viewer.user_id === user_id);
	}

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

	addViewerFromUser(viewer_user) {
		let new_viewer = new Viewer({
			name: viewer_user.username,
			ll_points: 0,
			user_id: viewer_user.id,
		});

		this.addViewer(new_viewer);
	}

	removeViewer(viewer) {
		this.viewers.delete(viewer.name);
	}

	getViewerByName(name) {
		return this.viewers.get(name);
	}

	getNumViewers() {
		return this.viewers.size;
	}

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

	async getViewerOrCreateViewer(interaction) {
		const user_id = interaction.user.id;
		const viewer = await this.getViewerById(user_id);

		if (!viewer) {
			interaction.channel.send(`You have not been added to the LL Point database yet. You will be added as **${interaction.user.username}**`);
			this.addViewerFromUser(interaction.user);

			await this.updateDatabase();

			return await this.getViewerById(interaction.user.id);
		}
		else {
			return viewer
		}
	}
}

module.exports = { LLPointManager };